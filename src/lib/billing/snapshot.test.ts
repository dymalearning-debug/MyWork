import type Stripe from "stripe";
import { describe, expect, it } from "vitest";

import { isCancelledTrial, ownerOf, planOf, snapshotOf } from "./snapshot";

// A Stripe subscription, as Stripe gives it with SUBSCRIPTION_EXPAND (only the fields read here).
const at = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

function stripeSubscription(changes: Record<string, unknown> = {}): Stripe.Subscription {
  return {
    id: "sub_1",
    object: "subscription",
    customer: "cus_1",
    livemode: false,
    status: "trialing",
    created: at("2026-10-21T10:00:00Z"),
    trial_end: at("2026-10-28T10:00:00Z"),
    cancel_at: null,
    cancel_at_period_end: false,
    ended_at: null,
    metadata: { user_id: "user-1" },
    items: {
      data: [
        {
          id: "si_1",
          current_period_end: at("2026-10-28T10:00:00Z"),
          price: { id: "price_y", lookup_key: "mywork_yearly", recurring: { interval: "year" } },
        },
      ],
    },
    default_payment_method: { id: "pm_1", card: { brand: "visa", last4: "4242", exp_month: 8, exp_year: 2028 } },
    latest_invoice: { id: "in_1", status: "paid", amount_due: 0 },
    ...changes,
  } as unknown as Stripe.Subscription;
}

describe("a Stripe subscription, as the database keeps it", () => {
  it("keeps the plan, the dates and the card", () => {
    expect(snapshotOf(stripeSubscription())).toEqual({
      customerId: "cus_1",
      subscriptionId: "sub_1",
      livemode: false,
      plan: "yearly",
      status: "trialing",
      createdAt: "2026-10-21T10:00:00.000Z",
      trialEnd: "2026-10-28T10:00:00.000Z",
      currentPeriodEnd: "2026-10-28T10:00:00.000Z",
      cancelAt: null,
      endedAt: null,
      card: { brand: "visa", last4: "4242", expMonth: 8, expYear: 2028 },
      unpaid: null,
    });
    expect(ownerOf(stripeSubscription())).toBe("user-1");
    expect(ownerOf(stripeSubscription({ metadata: {} }))).toBeNull();
  });

  it("reads a cancellation at the end of the paid period, or on a given day", () => {
    expect(snapshotOf(stripeSubscription({ cancel_at_period_end: true })).cancelAt).toBe("2026-10-28T10:00:00.000Z");
    expect(snapshotOf(stripeSubscription({ cancel_at: at("2026-11-02T10:00:00Z") })).cancelAt).toBe("2026-11-02T10:00:00.000Z");
  });

  it("takes the card of the customer when the subscription has none", () => {
    const snapshot = snapshotOf(
      stripeSubscription({
        default_payment_method: null,
        customer: {
          id: "cus_1",
          invoice_settings: { default_payment_method: { id: "pm_2", card: { brand: "mastercard", last4: "0341", exp_month: 3, exp_year: 2027 } } },
        },
      }),
    );
    expect(snapshot.customerId).toBe("cus_1");
    expect(snapshot.card).toEqual({ brand: "mastercard", last4: "0341", expMonth: 3, expYear: 2027 });
  });

  it("keeps the refused payment while Stripe tries again", () => {
    const snapshot = snapshotOf(
      stripeSubscription({
        status: "past_due",
        latest_invoice: {
          id: "in_2",
          status: "open",
          amount_due: 500,
          created: at("2026-11-28T09:00:00Z"),
          status_transitions: { finalized_at: at("2026-11-28T10:00:00Z") },
          next_payment_attempt: at("2026-12-01T10:00:00Z"),
        },
      }),
    );
    expect(snapshot.unpaid).toEqual({ amount: 500, at: "2026-11-28T10:00:00.000Z", nextAttempt: "2026-12-01T10:00:00.000Z" });
  });

  it("finds a trial whose cancellation is asked for, which MyWork ends at once", () => {
    expect(isCancelledTrial(stripeSubscription())).toBe(false);
    expect(isCancelledTrial(stripeSubscription({ cancel_at_period_end: true }))).toBe(true);
    expect(isCancelledTrial(stripeSubscription({ cancel_at: at("2026-10-28T10:00:00Z") }))).toBe(true);
    expect(isCancelledTrial(stripeSubscription({ status: "active", cancel_at_period_end: true }))).toBe(false);
  });

  it("finds the plan from the name of the price, or its interval", () => {
    expect(planOf({ lookup_key: "mywork_monthly" } as Stripe.Price)).toBe("monthly");
    expect(planOf({ lookup_key: null, recurring: { interval: "year" } } as Stripe.Price)).toBe("yearly");
    expect(planOf({ lookup_key: null, recurring: null } as Stripe.Price)).toBeNull();
    expect(planOf(undefined)).toBeNull();
  });
});
