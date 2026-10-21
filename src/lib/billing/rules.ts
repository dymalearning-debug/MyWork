import { formatDate } from "@/lib/booking/format";
import type { Reminder } from "@/lib/dashboard/rules";

import { DATA_RETENTION_DAYS, formatPrice, isPlanId, PLANS, TRIAL_REMINDER_DAYS, type PlanId } from "./plans";

// Rules of the subscription (docs/billing.md): from what Stripe says to what MyWork opens, and how
// the dates and amounts of the subscription read. Pure: the unit tests cover them.

// "Choisissez votre formule": the one page of an account without a subscription.
export const SUBSCRIBE_PATH = "/app/subscribe";
// Paramètres › Abonnement, opened over the dashboard (links of the emails and of the reminders).
export const BILLING_SETTINGS_PATH = "/app?settings=billing";

// The dates of the subscription read in the time of Paris.
export const BILLING_TIME_ZONE = "Europe/Paris";

const DAY = 86_400_000;

export const STRIPE_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
] as const;
export type StripeStatus = (typeof STRIPE_STATUSES)[number];

export type Card = { brand: string; last4: string; expMonth: number; expYear: number };

// The subscription of an account (table subscriptions). status null: a Stripe customer only (the
// payment page was opened, never paid).
export type Subscription = {
  customerId: string | null;
  subscriptionId: string | null;
  livemode: boolean;
  plan: PlanId | null;
  status: StripeStatus | null;
  createdAt: Date | null;
  trialEnd: Date | null;
  currentPeriodEnd: Date | null;
  cancelAt: Date | null;
  endedAt: Date | null;
  trialUsed: boolean;
  card: Card | null;
  unpaid: { amount: number; at: Date; nextAttempt: Date | null } | null;
};

// What MyWork shows and opens (docs/billing.md, "Accès selon l'état de l'abonnement").
// canceling: a cancellation asked for, the paid period still running.
export type SubscriptionState = "none" | "trialing" | "active" | "canceling" | "past_due" | "ended";

// A subscription of the other Stripe mode counts as none: with the real keys, only real
// subscriptions open MyWork (docs/billing.md, decision 8). "incomplete": the payment page was not
// finished.
export function subscriptionState(subscription: Subscription | null, liveMode: boolean): SubscriptionState {
  if (!subscription?.status || subscription.livemode !== liveMode) return "none";
  switch (subscription.status) {
    case "trialing":
    case "active":
      return subscription.cancelAt ? "canceling" : subscription.status;
    case "past_due":
      return "past_due";
    case "incomplete":
      return "none";
    default:
      return "ended";
  }
}

// Stripe tries a refused payment again for about two weeks: the access stays open meanwhile.
export const hasAccess = (state: SubscriptionState) =>
  state === "trialing" || state === "active" || state === "canceling" || state === "past_due";

// One trial per account: after a first subscription (in the same Stripe mode), the first payment
// is taken at once.
export const canStartTrial = (subscription: Subscription | null, liveMode: boolean) =>
  !(subscription && subscription.livemode === liveMode && subscription.trialUsed);

// The day the access closes, after a cancellation.
export const accessEnd = (subscription: Subscription) => subscription.cancelAt ?? subscription.currentPeriodEnd;

// The day the data of an ended subscription are deleted.
export const retentionEnd = (subscription: Subscription) =>
  subscription.endedAt ? new Date(subscription.endedAt.getTime() + DATA_RETENTION_DAYS * DAY) : null;

// The next payment: at the end of the trial, or of the paid period. None after a cancellation.
export function nextCharge(subscription: Subscription, state: SubscriptionState) {
  if (!subscription.plan) return null;
  const amount = PLANS[subscription.plan].amount;
  if (state === "trialing" && subscription.trialEnd) return { amount, at: subscription.trialEnd };
  if (state === "active" && subscription.currentPeriodEnd) return { amount, at: subscription.currentPeriodEnd };
  return null;
}

// ——— Dates ———

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

// "mercredi 28 octobre 2026", "mercredi 28 octobre".
export const formatLongDate = (date: Date, { year = true }: { year?: boolean } = {}) =>
  lowerFirst(formatDate(date, BILLING_TIME_ZONE, { year }));

// "28 octobre 2026", "28 octobre".
export const formatPlainDate = (date: Date, { year = true }: { year?: boolean } = {}) =>
  formatLongDate(date, { year }).replace(/^\S+ /, "");

// "28/10/2026".
export const formatNumericDate = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: BILLING_TIME_ZONE }).format(date);

// Whole days left before a date, the current one included: 3 on the 25th for the 28th.
export const daysLeft = (date: Date, now: Date) => Math.max(0, Math.ceil((date.getTime() - now.getTime()) / DAY));

// "Dans 3 jours", "Demain", "Aujourd'hui".
export function formatDaysLeft(days: number) {
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `Dans ${days} jours`;
}

// "Visa •••• 4242".
export const cardLabel = (card: Pick<Card, "brand" | "last4">) => `${card.brand.charAt(0).toUpperCase()}${card.brand.slice(1)} •••• ${card.last4}`;

// "08/28".
export const cardExpiry = (card: Card) => `${String(card.expMonth).padStart(2, "0")}/${String(card.expYear % 100).padStart(2, "0")}`;

// ——— What the subscriber sees ———

// The sentence of a refused payment: "Le prélèvement de 5 € du 28 novembre a échoué. Nouvelle
// tentative le 1er décembre."
export function unpaidText(subscription: Subscription) {
  if (!subscription.unpaid) return "Le dernier prélèvement a échoué.";
  const { amount, at, nextAttempt } = subscription.unpaid;
  const failed = `Le prélèvement de ${formatPrice(amount)} du ${formatPlainDate(at, { year: false })} a échoué.`;
  return nextAttempt ? `${failed} Nouvelle tentative le ${formatPlainDate(nextAttempt, { year: false })}.` : failed;
}

// The reminders of the dashboard (docs/billing.md, decision 12): the last days of the trial, a
// cancellation asked for, a refused payment. Each leads to Paramètres › Abonnement.
export function billingReminders(
  subscription: Subscription | null,
  state: SubscriptionState,
  now: Date,
  href: string,
): Reminder[] {
  if (!subscription) return [];
  if (state === "trialing" && subscription.trialEnd && subscription.plan) {
    const days = daysLeft(subscription.trialEnd, now);
    if (days > TRIAL_REMINDER_DAYS) return [];
    return [
      {
        id: "trial",
        title: "Fin de l'essai",
        value: formatDaysLeft(days),
        tone: "warning",
        detail: `Le ${formatPlainDate(subscription.trialEnd, { year: false })}, premier prélèvement de ${formatPrice(PLANS[subscription.plan].amount)}. Résiliez avant pour ne rien payer.`,
        href,
      },
    ];
  }
  if (state === "canceling") {
    const end = accessEnd(subscription);
    return [
      {
        id: "canceling",
        title: "Abonnement résilié",
        value: end ? formatNumericDate(end) : undefined,
        tone: "warning",
        detail: "Votre accès reste ouvert jusqu'à cette date. Vous pouvez reprendre votre abonnement d'ici là.",
        href,
      },
    ];
  }
  if (state === "past_due") {
    return [{ id: "past_due", title: "Paiement refusé", value: "Carte à changer", tone: "destructive", detail: unpaidText(subscription), href }];
  }
  return [];
}

// ——— From the database ———

export type SubscriptionRow = {
  customer_id: string | null;
  subscription_id: string | null;
  livemode: boolean;
  plan: string | null;
  status: string | null;
  subscription_created_at: string | null;
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  ended_at: string | null;
  trial_used: boolean;
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  unpaid_amount: number | null;
  unpaid_at: string | null;
  next_payment_attempt: string | null;
};

const toDate = (value: string | null) => (value ? new Date(value) : null);

export function fromRow(row: SubscriptionRow): Subscription {
  return {
    customerId: row.customer_id,
    subscriptionId: row.subscription_id,
    livemode: row.livemode,
    plan: isPlanId(row.plan) ? row.plan : null,
    status: STRIPE_STATUSES.includes(row.status as StripeStatus) ? (row.status as StripeStatus) : null,
    createdAt: toDate(row.subscription_created_at),
    trialEnd: toDate(row.trial_end),
    currentPeriodEnd: toDate(row.current_period_end),
    cancelAt: toDate(row.cancel_at),
    endedAt: toDate(row.ended_at),
    trialUsed: row.trial_used,
    card:
      row.card_brand && row.card_last4 && row.card_exp_month && row.card_exp_year
        ? { brand: row.card_brand, last4: row.card_last4, expMonth: row.card_exp_month, expYear: row.card_exp_year }
        : null,
    unpaid:
      row.unpaid_amount !== null && row.unpaid_at
        ? { amount: row.unpaid_amount, at: new Date(row.unpaid_at), nextAttempt: toDate(row.next_payment_attempt) }
        : null,
  };
}
