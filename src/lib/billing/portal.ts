import "server-only";

import type Stripe from "stripe";

import { getRequestOrigin } from "@/lib/auth/origin";
import { createClient } from "@/lib/supabase/server";

import { syncSubscription, type OwnBilling } from "./data";
import { otherPlan, type PlanId } from "./plans";
import { accessEnd, hasAccess, type Card, type SubscriptionState } from "./rules";
import { getStripe, priceIds } from "./stripe";

// The section "Abonnement" of the Settings (docs/billing.md): the essentials read in MyWork, the
// operations on Stripe's customer portal, each button opening the right page of it, which then
// leads back to the Settings (through /app/subscribe/refresh, which reads the subscription again).

export type BillingInvoice = { id: string; date: string; amount: number; status: "paid" | "unpaid" | "void"; pdf: string | null };

export type BillingOverview = {
  state: SubscriptionState;
  plan: PlanId | null;
  trialEnd: string | null;
  nextChargeAt: string | null;
  accessEnd: string | null;
  createdAt: string | null;
  card: Card | null;
  // The last refused payment, while Stripe tries again.
  unpaid: { amount: number; at: string; nextAttempt: string | null } | null;
  // null: the invoices could not be read (Stripe not configured or unavailable).
  invoices: BillingInvoice[] | null;
  // The confirmed bookings after the end of the access, if the subscription stopped then.
  bookingsAfterEnd: number;
  // A Stripe customer of this mode: the portal (invoices, card) can open.
  hasPortal: boolean;
};

const iso = (date: Date | null) => date?.toISOString() ?? null;

// The confirmed bookings starting from a date (the end of the access).
async function bookingsFrom(date: Date | null) {
  if (!date) return 0;
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed")
    .gte("start_at", date.toISOString());
  if (error) throw new Error(`Bookings count failed: ${error.message}`);
  return count ?? 0;
}

// The last 3 invoices with an amount (the trial opens with an invoice of 0 €).
async function lastInvoices(customerId: string): Promise<BillingInvoice[] | null> {
  const stripe = getStripe();
  if (!stripe) return null;
  try {
    const { data } = await stripe.invoices.list({ customer: customerId, limit: 10 });
    return data
      .filter((invoice) => invoice.total > 0 && invoice.status !== "draft")
      .slice(0, 3)
      .map((invoice) => ({
        id: invoice.id ?? "",
        date: new Date((invoice.status_transitions?.finalized_at ?? invoice.created) * 1000).toISOString(),
        amount: invoice.total,
        status: invoice.status === "paid" ? "paid" : invoice.status === "open" || invoice.status === "uncollectible" ? "unpaid" : "void",
        pdf: invoice.invoice_pdf ?? null,
      }));
  } catch (error) {
    console.error("[billing] invoices read failed", error);
    return null;
  }
}

export async function billingOverview({ subscription, state, liveMode }: OwnBilling): Promise<BillingOverview> {
  const ownMode = !!subscription && subscription.livemode === liveMode;
  const customerId = ownMode ? subscription.customerId : null;
  const end = subscription && hasAccess(state) ? accessEnd(subscription) : null;
  // Before a cancellation, what it would cancel (the confirmation of "Résilier"); after, what it will.
  // A trial stops at once: every booking to come.
  const stopsAt = state === "trialing" ? new Date() : end;
  const [invoices, bookingsAfterEnd] = await Promise.all([
    customerId ? lastInvoices(customerId) : Promise.resolve([]),
    hasAccess(state) && state !== "past_due" ? bookingsFrom(stopsAt) : Promise.resolve(0),
  ]);
  return {
    state,
    plan: ownMode ? subscription.plan : null,
    trialEnd: ownMode ? iso(subscription.trialEnd) : null,
    nextChargeAt: ownMode ? iso(state === "trialing" ? subscription.trialEnd : subscription.currentPeriodEnd) : null,
    accessEnd: iso(stopsAt),
    createdAt: ownMode ? iso(subscription.createdAt) : null,
    card: ownMode ? subscription.card : null,
    unpaid:
      ownMode && state === "past_due" && subscription.unpaid
        ? {
            amount: subscription.unpaid.amount,
            at: subscription.unpaid.at.toISOString(),
            nextAttempt: iso(subscription.unpaid.nextAttempt),
          }
        : null,
    invoices,
    bookingsAfterEnd,
    hasPortal: !!customerId && !!getStripe(),
  };
}

export type PortalFlow = "payment_method" | "invoices" | "switch_plan" | "cancel";

// The address of a page of Stripe's portal, for this subscriber. null: not available (no Stripe
// customer of this mode, nothing to change, or the portal not configured in Stripe).
export async function portalUrl({ subscription, state, liveMode }: OwnBilling, flow: PortalFlow): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe || !subscription?.customerId || subscription.livemode !== liveMode) return null;
  const back = `${await getRequestOrigin()}/app/subscribe/refresh`;
  const afterCompletion = { type: "redirect" as const, redirect: { return_url: back } };
  let flowData: Stripe.BillingPortal.SessionCreateParams.FlowData | undefined;

  if (flow === "payment_method") {
    flowData = { type: "payment_method_update", after_completion: afterCompletion };
  } else if (flow === "cancel" || flow === "switch_plan") {
    if (!subscription.subscriptionId || !hasAccess(state) || state === "canceling") return null;
    // A trial is cancelled in MyWork, at once (cancelOwnTrial).
    if (flow === "cancel" && state === "trialing") return null;
    if (flow === "cancel") {
      flowData = {
        type: "subscription_cancel",
        subscription_cancel: { subscription: subscription.subscriptionId },
        after_completion: afterCompletion,
      };
    } else {
      if (!subscription.plan) return null;
      const current = await stripe.subscriptions.retrieve(subscription.subscriptionId);
      const item = current.items.data[0];
      if (!item) return null;
      flowData = {
        type: "subscription_update_confirm",
        subscription_update_confirm: {
          subscription: subscription.subscriptionId,
          items: [{ id: item.id, price: (await priceIds())[otherPlan(subscription.plan)], quantity: 1 }],
        },
        after_completion: afterCompletion,
      };
    }
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.customerId,
      return_url: back,
      locale: "fr",
      ...(flowData && { flow_data: flowData }),
    });
    return session.url;
  } catch (error) {
    // Most often: the portal is not saved yet in Stripe's settings (docs/billing.md, "Réglages dans Stripe").
    console.error(`[billing] portal (${flow}) unavailable`, error);
    return null;
  }
}

// "Résilier" during the trial: the subscription ends at once at Stripe, without any payment, and the
// space is paused (docs/billing.md, decision of 2026-10-21). After the trial, the cancellation goes
// through Stripe's portal and takes effect at the end of the paid period.
export async function cancelOwnTrial({ subscription, state }: OwnBilling): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe || state !== "trialing" || !subscription?.subscriptionId) return false;
  await stripe.subscriptions.cancel(subscription.subscriptionId);
  await syncSubscription(subscription.subscriptionId);
  return true;
}

// "Reprendre mon abonnement", after a cancellation, while the paid period runs: straight with
// Stripe, without the portal.
export async function resumeOwnSubscription({ subscription, state }: OwnBilling): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe || state !== "canceling" || !subscription?.subscriptionId) return false;
  const current = await stripe.subscriptions.retrieve(subscription.subscriptionId);
  await stripe.subscriptions.update(
    subscription.subscriptionId,
    current.cancel_at_period_end ? { cancel_at_period_end: false } : { cancel_at: "" },
  );
  await syncSubscription(subscription.subscriptionId);
  return true;
}

// Before the deletion of an account: its subscription stops at once, without refund
// (docs/billing.md, "Supprimer le compte"). Its link to the account is removed first, so that the
// events of the end (webhook) do not send "Abonnement terminé" to a deleted account. false: the
// subscription could not be stopped, the account must not be deleted.
// A subscription of the other Stripe mode (a test one, with the real keys) costs nothing: left as is.
export async function stopSubscriptionForDeletion({ subscription, liveMode }: OwnBilling): Promise<boolean> {
  if (!subscription?.subscriptionId || subscription.livemode !== liveMode) return true;
  const stripe = getStripe();
  if (!stripe) return !hasAccessInStripe(subscription.status);
  try {
    const current = await stripe.subscriptions.retrieve(subscription.subscriptionId);
    if (!hasAccessInStripe(current.status)) return true;
    await stripe.subscriptions.update(current.id, { metadata: { user_id: "" } });
    await stripe.subscriptions.cancel(current.id);
    return true;
  } catch (error) {
    console.error("[billing] subscription not stopped before the deletion", error);
    return false;
  }
}

const hasAccessInStripe = (status: string | null) => status === "trialing" || status === "active" || status === "past_due";
