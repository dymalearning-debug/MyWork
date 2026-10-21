import "server-only";

import Stripe from "stripe";

import { PLAN_IDS, PLANS, type PlanId } from "./plans";

// The Stripe client of the server (docs/billing.md, "En coulisses"). STRIPE_SECRET_KEY: the test
// key in development and on previews, the real one in production only (docs/product.md,
// "Inventaire technique"). Without it (automatic tests on GitHub), nothing reaches Stripe: the
// payment page and the portal are unavailable, the rest of MyWork works with the subscriptions
// written by the tests.

let client: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (client === undefined) {
    const key = process.env.STRIPE_SECRET_KEY;
    client = key ? new Stripe(key) : null;
  }
  return client;
}

export function requireStripe(): Stripe {
  const stripe = getStripe();
  if (!stripe) throw new Error("Missing STRIPE_SECRET_KEY (see .env.example).");
  return stripe;
}

// Real payments (sk_live_, or a restricted rk_live_ key); otherwise Stripe's test mode.
export const isLiveMode = () => /^[rs]k_live_/.test(process.env.STRIPE_SECRET_KEY ?? "");

// The prices of the two plans, found by their fixed names (lookup keys), once per server.
let prices: Promise<Record<PlanId, string>> | null = null;

export function priceIds(): Promise<Record<PlanId, string>> {
  if (!prices) {
    prices = (async () => {
      const { data } = await requireStripe().prices.list({
        lookup_keys: PLAN_IDS.map((plan) => PLANS[plan].lookupKey),
        active: true,
        limit: 10,
      });
      const ids = Object.fromEntries(
        PLAN_IDS.map((plan) => [plan, data.find((price) => price.lookup_key === PLANS[plan].lookupKey)?.id]),
      );
      for (const plan of PLAN_IDS) {
        if (!ids[plan]) throw new Error(`No active Stripe price named ${PLANS[plan].lookupKey}.`);
      }
      return ids as Record<PlanId, string>;
    })();
    // A failure is not kept: the next call asks again.
    prices.catch(() => {
      prices = null;
    });
  }
  return prices;
}
