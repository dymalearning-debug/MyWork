import "server-only";

import { createClient as createServerlessClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";

import { LOGIN_PATH } from "@/lib/auth/paths";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/user";
import { sendBookingEmails } from "@/lib/booking/emails/send-email";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { sendBillingEmails } from "./emails/send";
import type { BillingEmailKind } from "./emails/templates";
import { parsePlan, type PlanId } from "./plans";
import {
  fromRow,
  hasAccess,
  SUBSCRIBE_PATH,
  subscriptionState,
  type Subscription,
  type SubscriptionRow,
  type SubscriptionState,
} from "./rules";
import { ownerOf, snapshotOf, SUBSCRIPTION_EXPAND, type SubscriptionSnapshot } from "./snapshot";
import { isLiveMode, requireStripe } from "./stripe";

// The subscription of the signed-in user, and the access it gives (docs/billing.md, "Accès selon
// l'état de l'abonnement"): the pages of the private space are checked by their layout, the Server
// Actions and route handlers ask for getSubscribedUser().

const COLUMNS =
  "customer_id, subscription_id, livemode, plan, status, subscription_created_at, trial_end, current_period_end, cancel_at, ended_at, trial_used, card_brand, card_last4, card_exp_month, card_exp_year, unpaid_amount, unpaid_at, next_payment_attempt";

export const getOwnSubscription = cache(async (userId: string): Promise<Subscription | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("subscriptions").select(COLUMNS).eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`Subscription read failed: ${error.message}`);
  return data ? fromRow(data as SubscriptionRow) : null;
});

export type OwnBilling = {
  user: CurrentUser;
  subscription: Subscription | null;
  state: SubscriptionState;
  liveMode: boolean;
};

export const getOwnBilling = cache(async (): Promise<OwnBilling | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const subscription = await getOwnSubscription(user.id);
  const liveMode = isLiveMode();
  return { user, subscription, state: subscriptionState(subscription, liveMode), liveMode };
});

// The signed-in user, if their subscription opens the private space; otherwise null.
export async function getSubscribedUser(): Promise<CurrentUser | null> {
  const billing = await getOwnBilling();
  return billing && hasAccess(billing.state) ? billing.user : null;
}

// The plan chosen on the sign-up page: kept with the account (user_metadata), so that it survives
// the confirmation of the email address (docs/billing.md, "Le parcours d'inscription").
export async function getChosenPlan(): Promise<PlanId | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const metadata = data?.claims?.user_metadata as { plan?: unknown } | undefined;
  return parsePlan(metadata?.plan);
}

// For the pages: without a subscription, "Choisissez votre formule".
export async function requireSubscriber(): Promise<OwnBilling> {
  const billing = await getOwnBilling();
  if (!billing) redirect(LOGIN_PATH);
  if (!hasAccess(billing.state)) redirect(SUBSCRIBE_PATH);
  return billing;
}

// ——— Writing, by the server ———
// Through the two database functions that ask for the billing secret (BILLING_SECRET): no
// Supabase secret key in the app, and no user session needed (the webhook has none).

function billingDb() {
  const { url, publishableKey } = getSupabaseEnv();
  return createServerlessClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function billingSecret() {
  const secret = process.env.BILLING_SECRET;
  if (!secret) throw new Error("Missing BILLING_SECRET (see .env.example).");
  return secret;
}

export async function saveBillingCustomer(userId: string, customerId: string) {
  const { error } = await billingDb().rpc("save_billing_customer", {
    owner: userId,
    customer: customerId,
    live: isLiveMode(),
    secret: billingSecret(),
  });
  if (error) throw new Error(`Billing customer save failed: ${error.message}`);
}

type SyncResult = {
  status: "ok" | "duplicate" | "unknown_user" | "stale";
  emails?: BillingEmailKind[];
  bookingEmailIds?: string[];
  recipient?: string | null;
  firstName?: string | null;
  handle?: string;
  bookingsAfterEnd?: number;
};

// Saves a subscription as Stripe gives it now, then sends the emails its change calls for. After
// the payment page, a return from the portal and each webhook event (event: handled once).
// Returns the account it belongs to, or null for a subscription without one (not made by MyWork).
export async function syncSubscription(
  subscriptionId: string,
  event?: { id: string; type: string },
): Promise<{ owner: string; status: SyncResult["status"] } | null> {
  const subscription = await requireStripe().subscriptions.retrieve(subscriptionId, { expand: SUBSCRIPTION_EXPAND });
  const owner = ownerOf(subscription);
  if (!owner) {
    console.warn(`[billing] ${subscriptionId}: no MyWork account in its metadata.`);
    return null;
  }
  const snapshot = snapshotOf(subscription);
  const { data, error } = await billingDb().rpc("sync_subscription", {
    owner,
    snapshot,
    event_id: event?.id ?? null,
    event_type: event?.type ?? null,
    secret: billingSecret(),
  });
  if (error) throw new Error(`Subscription sync failed: ${error.message}`);
  const result = data as SyncResult;
  if (result.status === "ok") await sendSyncEmails(result, snapshot);
  return { owner, status: result.status };
}

async function sendSyncEmails(result: SyncResult, snapshot: SubscriptionSnapshot) {
  if (result.bookingEmailIds?.length) await sendBookingEmails(result.bookingEmailIds);
  // A trial already cancelled ends without payment: no reminder of the first payment.
  const emails = (result.emails ?? []).filter((kind) => !(kind === "trial_ending" && snapshot.cancelAt));
  if (!snapshot.plan || emails.length === 0) return;
  await sendBillingEmails(
    emails,
    result.recipient ?? null,
    {
      firstName: result.firstName?.trim() || null,
      handle: result.handle ?? "",
      plan: snapshot.plan,
      trialEnd: snapshot.status === "trialing" ? snapshot.trialEnd : null,
      currentPeriodEnd: snapshot.currentPeriodEnd,
      cancelAt: snapshot.cancelAt,
      card: snapshot.card,
      bookingsAfterEnd: result.bookingsAfterEnd ?? 0,
      cancelledBookings: result.bookingEmailIds?.length ?? 0,
      sentAt: new Date().toISOString(),
    },
    snapshot.subscriptionId,
  );
}

// The signed-in user's subscription again from Stripe: after the payment page or the portal,
// without waiting for the webhook (which never reaches the previews of Vercel).
export async function syncOwnSubscription(userId: string) {
  const subscription = await getOwnSubscription(userId);
  if (!subscription?.subscriptionId || subscription.livemode !== isLiveMode()) return;
  await syncSubscription(subscription.subscriptionId);
}
