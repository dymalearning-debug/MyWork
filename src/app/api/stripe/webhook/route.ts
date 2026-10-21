import type Stripe from "stripe";

import { syncSubscription } from "@/lib/billing/data";
import { getStripe } from "@/lib/billing/stripe";

// Stripe's webhook (docs/billing.md, "En coulisses"): Stripe announces here each change of a
// subscription. The signature is checked with STRIPE_WEBHOOK_SECRET (in development, the one of
// `stripe listen`); the subscription is then read again from Stripe, which gives its latest state
// whatever the order of the events, and saved (each event once).
// An error answers 500: Stripe sends the event again later, for up to 3 days.

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "customer.subscription.trial_will_end",
]);

const INVOICE_EVENTS = new Set(["invoice.paid", "invoice.payment_failed", "invoice.payment_action_required"]);

const idOf = (value: string | { id: string } | null | undefined) => (typeof value === "string" ? value : (value?.id ?? null));

// The subscription an event is about, or null for the others.
function subscriptionOf(event: Stripe.Event): string | null {
  if (SUBSCRIPTION_EVENTS.has(event.type)) return (event.data.object as Stripe.Subscription).id;
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    return session.mode === "subscription" ? idOf(session.subscription) : null;
  }
  if (INVOICE_EVENTS.has(event.type)) {
    return idOf((event.data.object as Stripe.Invoice).parent?.subscription_details?.subscription);
  }
  return null;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return new Response("Webhook not configured", { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const subscriptionId = subscriptionOf(event);
  if (!subscriptionId) return Response.json({ received: true });
  try {
    await syncSubscription(subscriptionId, { id: event.id, type: event.type });
  } catch (error) {
    console.error(`[billing] ${event.id} (${event.type}) failed`, error);
    return new Response("Sync failed", { status: 500 });
  }
  return Response.json({ received: true });
}
