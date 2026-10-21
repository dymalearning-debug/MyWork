import { NextResponse, type NextRequest } from "next/server";

import { LOGIN_PATH } from "@/lib/auth/paths";
import { getCurrentUser } from "@/lib/auth/user";
import { syncOwnSubscription } from "@/lib/billing/data";
import { BILLING_SETTINGS_PATH } from "@/lib/billing/rules";

// Return from Stripe's portal (card, plan, cancellation): the subscription is read again from
// Stripe, without waiting for the webhook, then Paramètres › Abonnement opens again. Without access
// any more, the private space leads to "Choisissez votre formule".
export async function GET(request: NextRequest) {
  const goTo = (path: string) => NextResponse.redirect(new URL(path, request.url));
  const user = await getCurrentUser();
  if (!user) return goTo(LOGIN_PATH);
  try {
    await syncOwnSubscription(user.id);
  } catch (error) {
    // The webhook brings the change a little later.
    console.error("[billing] return from the portal: subscription not read again", error);
  }
  return goTo(BILLING_SETTINGS_PATH);
}
