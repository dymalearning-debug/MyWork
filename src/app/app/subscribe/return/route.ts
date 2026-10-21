import { NextResponse, type NextRequest } from "next/server";

import { LOGIN_PATH } from "@/lib/auth/paths";
import { getCurrentUser } from "@/lib/auth/user";
import { syncSubscription } from "@/lib/billing/data";
import { SUBSCRIBE_PATH } from "@/lib/billing/rules";
import { getStripe } from "@/lib/billing/stripe";

// Return from Stripe's payment page (docs/billing.md, "Le parcours d'inscription", step 6): the
// payment is checked with Stripe at once, without waiting for the webhook (which never reaches the
// previews of Vercel), then the dashboard opens with the welcome notification. A payment page of
// another account, or not finished: back to "Choisissez votre formule".
export async function GET(request: NextRequest) {
  const goTo = (path: string) => NextResponse.redirect(new URL(path, request.url));
  const user = await getCurrentUser();
  if (!user) return goTo(LOGIN_PATH);

  const sessionId = request.nextUrl.searchParams.get("session_id");
  const stripe = getStripe();
  if (!stripe || !sessionId) return goTo(SUBSCRIBE_PATH);
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (session.client_reference_id !== user.id || session.status !== "complete" || !subscriptionId) {
      return goTo(`${SUBSCRIBE_PATH}?error=checkout`);
    }
    await syncSubscription(subscriptionId);
  } catch (error) {
    console.error("[billing] return from the payment page failed", error);
    return goTo(`${SUBSCRIBE_PATH}?error=checkout`);
  }
  return goTo("/app?welcome=1");
}
