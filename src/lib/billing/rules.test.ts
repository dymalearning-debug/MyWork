import { describe, expect, it } from "vitest";

import { formatAmount, formatPrice, parsePlan, planSummary } from "./plans";
import {
  billingReminders,
  canStartTrial,
  cardExpiry,
  cardLabel,
  daysLeft,
  formatDaysLeft,
  formatLongDate,
  formatNumericDate,
  formatPlainDate,
  fromRow,
  hasAccess,
  nextCharge,
  retentionEnd,
  subscriptionState,
  type Subscription,
  type SubscriptionRow,
} from "./rules";

const subscription = (changes: Partial<Subscription> = {}): Subscription => ({
  customerId: "cus_1",
  subscriptionId: "sub_1",
  livemode: false,
  plan: "yearly",
  status: "trialing",
  createdAt: new Date("2026-10-21T10:00:00Z"),
  trialEnd: new Date("2026-10-28T10:00:00Z"),
  currentPeriodEnd: new Date("2026-10-28T10:00:00Z"),
  cancelAt: null,
  endedAt: null,
  trialUsed: true,
  card: { brand: "visa", last4: "4242", expMonth: 8, expYear: 2028 },
  unpaid: null,
  ...changes,
});

describe("the plan of the address", () => {
  it("reads the two plans, and nothing else", () => {
    expect(parsePlan("monthly")).toBe("monthly");
    expect(parsePlan("yearly")).toBe("yearly");
    expect(parsePlan("YEARLY")).toBeNull();
    expect(parsePlan(["monthly"])).toBeNull();
    expect(parsePlan(undefined)).toBeNull();
  });

  it("reads the prices as on the landing page", () => {
    expect(formatPrice(500)).toBe("5 €");
    expect(formatPrice(5000)).toBe("50 €");
    expect(formatPrice(417)).toBe("4,17 €");
    expect(formatAmount(500)).toBe("5,00 €");
    expect(planSummary("yearly")).toBe("Annuelle · 50 € par an");
    expect(planSummary("monthly")).toBe("Mensuelle · 5 € par mois");
  });
});

describe("from Stripe's state to the access", () => {
  it("opens MyWork during the trial, while active, after a cancellation and after a refused payment", () => {
    expect(subscriptionState(subscription(), false)).toBe("trialing");
    expect(subscriptionState(subscription({ status: "active" }), false)).toBe("active");
    expect(subscriptionState(subscription({ status: "active", cancelAt: new Date("2027-10-28") }), false)).toBe("canceling");
    expect(subscriptionState(subscription({ cancelAt: new Date("2026-10-28") }), false)).toBe("canceling");
    expect(subscriptionState(subscription({ status: "past_due" }), false)).toBe("past_due");
    for (const state of ["trialing", "active", "canceling", "past_due"] as const) expect(hasAccess(state)).toBe(true);
  });

  it("closes it without a subscription, after the end, and for an unfinished payment page", () => {
    expect(subscriptionState(null, false)).toBe("none");
    expect(subscriptionState(subscription({ status: null, subscriptionId: null }), false)).toBe("none");
    expect(subscriptionState(subscription({ status: "incomplete" }), false)).toBe("none");
    for (const status of ["canceled", "unpaid", "incomplete_expired", "paused"] as const) {
      expect(subscriptionState(subscription({ status }), false)).toBe("ended");
    }
    for (const state of ["none", "ended"] as const) expect(hasAccess(state)).toBe(false);
  });

  it("counts only the subscriptions of the Stripe mode in use", () => {
    expect(subscriptionState(subscription(), true)).toBe("none");
    expect(subscriptionState(subscription({ livemode: true }), true)).toBe("trialing");
  });

  it("gives one trial per account, in each mode", () => {
    expect(canStartTrial(null, false)).toBe(true);
    expect(canStartTrial(subscription({ status: null, trialUsed: false }), false)).toBe(true);
    expect(canStartTrial(subscription({ status: "canceled" }), false)).toBe(false);
    expect(canStartTrial(subscription({ status: "canceled" }), true)).toBe(true);
  });

  it("keeps the data 90 days after the end", () => {
    expect(retentionEnd(subscription({ endedAt: new Date("2027-10-28T10:00:00Z") }))).toEqual(new Date("2028-01-26T10:00:00Z"));
    expect(retentionEnd(subscription())).toBeNull();
  });

  it("tells the next payment: at the end of the trial, of the period, none after a cancellation", () => {
    expect(nextCharge(subscription(), "trialing")).toEqual({ amount: 5000, at: new Date("2026-10-28T10:00:00Z") });
    const active = subscription({ status: "active", plan: "monthly", currentPeriodEnd: new Date("2027-01-28T10:00:00Z") });
    expect(nextCharge(active, "active")).toEqual({ amount: 500, at: new Date("2027-01-28T10:00:00Z") });
    expect(nextCharge(subscription({ cancelAt: new Date("2026-10-28") }), "canceling")).toBeNull();
  });
});

describe("how the subscription reads", () => {
  it("writes the dates in French, in the time of Paris", () => {
    const date = new Date("2026-10-28T10:00:00Z");
    expect(formatLongDate(date)).toBe("mercredi 28 octobre 2026");
    expect(formatLongDate(date, { year: false })).toBe("mercredi 28 octobre");
    expect(formatPlainDate(date)).toBe("28 octobre 2026");
    expect(formatPlainDate(new Date("2026-12-01T10:00:00Z"), { year: false })).toBe("1er décembre");
    expect(formatNumericDate(date)).toBe("28/10/2026");
    // 23:30 in UTC is already the next day in Paris.
    expect(formatPlainDate(new Date("2026-10-27T23:30:00Z"))).toBe("28 octobre 2026");
  });

  it("counts the days left of the trial", () => {
    const end = new Date("2026-10-28T10:00:00Z");
    expect(daysLeft(end, new Date("2026-10-25T10:00:00Z"))).toBe(3);
    expect(daysLeft(end, new Date("2026-10-25T12:00:00Z"))).toBe(3);
    expect(formatDaysLeft(3)).toBe("Dans 3 jours");
    expect(formatDaysLeft(1)).toBe("Demain");
    expect(formatDaysLeft(0)).toBe("Aujourd'hui");
  });

  it("shows the card", () => {
    const card = { brand: "visa", last4: "4242", expMonth: 8, expYear: 2028 };
    expect(cardLabel(card)).toBe("Visa •••• 4242");
    expect(cardExpiry(card)).toBe("08/28");
  });
});

describe("the reminders of the dashboard", () => {
  const href = "/app?settings=billing";

  it("recalls the end of the trial, 3 days before", () => {
    expect(billingReminders(subscription(), "trialing", new Date("2026-10-24T10:00:00Z"), href)).toEqual([]);
    expect(billingReminders(subscription(), "trialing", new Date("2026-10-25T10:00:00Z"), href)).toEqual([
      {
        id: "trial",
        title: "Fin de l'essai",
        value: "Dans 3 jours",
        tone: "warning",
        detail: "Le 28 octobre, premier prélèvement de 50 €. Résiliez avant pour ne rien payer.",
        href,
      },
    ]);
  });

  it("recalls a cancellation and a refused payment", () => {
    const canceling = subscription({ status: "active", cancelAt: new Date("2027-10-28T10:00:00Z") });
    expect(billingReminders(canceling, "canceling", new Date(), href)[0]).toMatchObject({
      id: "canceling",
      title: "Abonnement résilié",
      value: "28/10/2027",
    });
    const refused = subscription({
      status: "past_due",
      plan: "monthly",
      unpaid: { amount: 500, at: new Date("2026-11-28T10:00:00Z"), nextAttempt: new Date("2026-12-01T10:00:00Z") },
    });
    expect(billingReminders(refused, "past_due", new Date(), href)[0]).toMatchObject({
      id: "past_due",
      value: "Carte à changer",
      tone: "destructive",
      detail: "Le prélèvement de 5 € du 28 novembre a échoué. Nouvelle tentative le 1er décembre.",
    });
  });

  it("says nothing for an active subscription", () => {
    expect(billingReminders(subscription({ status: "active" }), "active", new Date(), href)).toEqual([]);
  });
});

describe("the row of the database", () => {
  it("becomes a subscription", () => {
    const row: SubscriptionRow = {
      customer_id: "cus_1",
      subscription_id: "sub_1",
      livemode: false,
      plan: "monthly",
      status: "past_due",
      subscription_created_at: "2026-10-21T10:00:00+00:00",
      trial_end: null,
      current_period_end: "2026-12-28T10:00:00+00:00",
      cancel_at: null,
      ended_at: null,
      trial_used: true,
      card_brand: "mastercard",
      card_last4: "0341",
      card_exp_month: 3,
      card_exp_year: 2027,
      unpaid_amount: 500,
      unpaid_at: "2026-11-28T10:00:00+00:00",
      next_payment_attempt: null,
    };
    expect(fromRow(row)).toMatchObject({
      plan: "monthly",
      status: "past_due",
      card: { brand: "mastercard", last4: "0341", expMonth: 3, expYear: 2027 },
      unpaid: { amount: 500, at: new Date("2026-11-28T10:00:00Z"), nextAttempt: null },
    });
    expect(fromRow({ ...row, plan: "weekly", status: "unknown", card_brand: null, unpaid_amount: null })).toMatchObject({
      plan: null,
      status: null,
      card: null,
      unpaid: null,
    });
  });
});
