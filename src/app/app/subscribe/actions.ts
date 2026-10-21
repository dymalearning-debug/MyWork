"use server";

import { redirect } from "next/navigation";

import { getRequestOrigin } from "@/lib/auth/origin";
import { HOME_PATH, LOGIN_PATH } from "@/lib/auth/paths";
import { getOwnBilling, saveBillingCustomer } from "@/lib/billing/data";
import { isPlanId, TRIAL_DAYS } from "@/lib/billing/plans";
import { canStartTrial, hasAccess, SUBSCRIBE_PATH } from "@/lib/billing/rules";
import { getStripe, priceIds } from "@/lib/billing/stripe";

export type CheckoutState = { error?: "unavailable" | "failed" };

// "Démarrer mon essai de 7 jours" (docs/billing.md, "Le parcours d'inscription"): opens Stripe's
// payment page (Checkout) for the chosen plan. The Stripe customer of the account is created the
// first time and kept with it. The trial is asked for unless a first subscription already had one.
// The payment page comes back to /app/subscribe/return, which checks the payment with Stripe.
// Never for an account already subscribed: one subscription per account.
export async function startCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const billing = await getOwnBilling();
  if (!billing) redirect(LOGIN_PATH);
  if (hasAccess(billing.state)) redirect(HOME_PATH);
  const plan = formData.get("plan");
  if (!isPlanId(plan)) return { error: "failed" };
  const stripe = getStripe();
  if (!stripe) return { error: "unavailable" };

  const { user, subscription, liveMode } = billing;
  let url: string | null;
  try {
    let customerId = subscription?.livemode === liveMode ? subscription.customerId : null;
    if (!customerId) {
      const customer = await stripe.customers.create(
        { email: user.email, metadata: { user_id: user.id } },
        { idempotencyKey: `customer/${user.id}/${liveMode ? "live" : "test"}` },
      );
      customerId = customer.id;
      await saveBillingCustomer(user.id, customerId);
    }
    const origin = await getRequestOrigin();
    const trial = canStartTrial(subscription, liveMode);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: (await priceIds())[plan], quantity: 1 }],
      subscription_data: {
        metadata: { user_id: user.id },
        ...(trial && {
          trial_period_days: TRIAL_DAYS,
          trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
        }),
      },
      // The payment methods offered (the card, Apple Pay, Google Pay) are chosen in Stripe's
      // settings (docs/billing.md, "Réglages dans Stripe").
      payment_method_collection: "always",
      // For the invoices: the billing address, and for a company its name and VAT number.
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      customer_update: { address: "auto", name: "auto" },
      allow_promotion_codes: true,
      // The acceptance of the terms of sale (consent_collection.terms_of_service) needs their page,
      // set in Stripe: to add with the legal pages (docs/billing.md, "Avant d'ouvrir les inscriptions").
      locale: "fr",
      success_url: `${origin}${SUBSCRIBE_PATH}/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${SUBSCRIBE_PATH}?plan=${plan}`,
    });
    url = session.url;
  } catch (error) {
    console.error("[billing] payment page not opened", error);
    return { error: "failed" };
  }
  if (!url) return { error: "failed" };
  redirect(url);
}
