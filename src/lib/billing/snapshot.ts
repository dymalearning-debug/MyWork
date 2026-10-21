import type Stripe from "stripe";

import { PLANS, type PlanId } from "./plans";

// A Stripe subscription, as the database keeps it (sync_subscription, migration
// 20261021120000_add_subscriptions.sql). Pure: the unit tests cover it with sample objects.
// The subscription is read with its payment method, its customer's one and its last invoice
// expanded (SUBSCRIPTION_EXPAND).

export const SUBSCRIPTION_EXPAND = [
  "default_payment_method",
  "latest_invoice",
  "customer.invoice_settings.default_payment_method",
];

export type SubscriptionSnapshot = {
  customerId: string;
  subscriptionId: string;
  livemode: boolean;
  plan: PlanId | null;
  status: string;
  createdAt: string;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
  endedAt: string | null;
  card: { brand: string; last4: string; expMonth: number; expYear: number } | null;
  unpaid: { amount: number; at: string; nextAttempt: string | null } | null;
};

const iso = (seconds: number | null | undefined) => (seconds ? new Date(seconds * 1000).toISOString() : null);

const expanded = <T extends { id: string }>(value: string | T | null | undefined): T | null =>
  value && typeof value === "object" ? value : null;

// The plan, from the fixed name of the price (or, for a price without one, its interval).
export function planOf(price: Stripe.Price | undefined): PlanId | null {
  if (!price) return null;
  if (price.lookup_key === PLANS.monthly.lookupKey) return "monthly";
  if (price.lookup_key === PLANS.yearly.lookupKey) return "yearly";
  if (price.recurring?.interval === "month") return "monthly";
  if (price.recurring?.interval === "year") return "yearly";
  return null;
}

// The account the subscription belongs to: given to Stripe with the payment page.
export const ownerOf = (subscription: Stripe.Subscription) => subscription.metadata?.user_id || null;

export function snapshotOf(subscription: Stripe.Subscription): SubscriptionSnapshot {
  const item = subscription.items.data[0];
  const periodEnd = item?.current_period_end ?? null;
  const customer = subscription.customer;
  const customerObject = typeof customer === "object" && !("deleted" in customer && customer.deleted) ? (customer as Stripe.Customer) : null;
  const paymentMethod =
    expanded<Stripe.PaymentMethod>(subscription.default_payment_method) ??
    expanded<Stripe.PaymentMethod>(customerObject?.invoice_settings?.default_payment_method);
  const card = paymentMethod?.card;
  const invoice = expanded<Stripe.Invoice>(subscription.latest_invoice);
  const unpaid =
    subscription.status === "past_due" && invoice && invoice.status === "open"
      ? {
          amount: invoice.amount_due,
          at: iso(invoice.status_transitions?.finalized_at ?? invoice.created)!,
          nextAttempt: iso(invoice.next_payment_attempt),
        }
      : null;

  return {
    customerId: typeof customer === "string" ? customer : customer.id,
    subscriptionId: subscription.id,
    livemode: subscription.livemode,
    plan: planOf(item?.price),
    status: subscription.status,
    createdAt: iso(subscription.created)!,
    trialEnd: iso(subscription.trial_end),
    currentPeriodEnd: iso(periodEnd),
    // A cancellation at the end of the paid period, or on a given day.
    cancelAt: iso(subscription.cancel_at ?? (subscription.cancel_at_period_end ? periodEnd : null)),
    endedAt: iso(subscription.ended_at),
    card: card ? { brand: card.brand, last4: card.last4, expMonth: card.exp_month, expYear: card.exp_year } : null,
    unpaid,
  };
}
