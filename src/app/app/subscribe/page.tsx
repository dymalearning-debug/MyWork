import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthHeader } from "@/app/(auth)/_components/auth-shell";
import { FormMessage } from "@/app/(auth)/_components/form-parts";
import { Skeleton } from "@/components/ui/skeleton";
import { getOwnProfile } from "@/lib/account/profile";
import { HOME_PATH, LOGIN_PATH } from "@/lib/auth/paths";
import { getChosenPlan, getOwnBilling } from "@/lib/billing/data";
import { DEFAULT_PLAN, parsePlan, TRIAL_DAYS } from "@/lib/billing/plans";
import { canStartTrial, formatLongDate, formatPlainDate, hasAccess, retentionEnd } from "@/lib/billing/rules";

import { AccountLinks } from "./_components/account-links";
import { PlanPicker } from "./_components/plan-picker";

export const metadata: Metadata = { title: "Choisissez votre formule · MyWork" };

// "Choisissez votre formule" (docs/billing.md): the second step of the sign-up, and the one page of
// an account without a subscription (payment page left, subscription ended). Outside the shell of
// the private space. The plan comes from the address (?plan=), or the one chosen on the sign-up
// page, or the yearly one.
export default function SubscribePage({ searchParams }: PageProps<"/app/subscribe">) {
  return (
    <div className="flex flex-1 flex-col items-center bg-spotlight px-4 py-16">
      <main className="flex w-full max-w-[560px] flex-col gap-7">
        <Suspense fallback={<SubscribeSkeleton />}>
          <SubscribeContent searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function SubscribeContent({ searchParams }: { searchParams: PageProps<"/app/subscribe">["searchParams"] }) {
  const billing = await getOwnBilling();
  if (!billing) redirect(LOGIN_PATH);
  if (hasAccess(billing.state)) redirect(HOME_PATH);
  const { user, subscription, state, liveMode } = billing;
  const [params, chosenPlan, profile] = await Promise.all([searchParams, getChosenPlan(), getOwnProfile(user.id)]);
  const plan = parsePlan(params.plan) ?? chosenPlan ?? subscription?.plan ?? DEFAULT_PLAN;
  const now = new Date();
  const trialEnd = canStartTrial(subscription, liveMode) ? new Date(now.getTime() + TRIAL_DAYS * 86_400_000) : null;
  const ended = state === "ended" && subscription;
  const keptUntil = ended ? retentionEnd(subscription) : null;

  return (
    <>
      {ended ? (
        <AuthHeader eyebrow="Abonnement terminé" title="Votre espace est en pause">
          {subscription.endedAt
            ? `Votre abonnement s'est terminé le ${formatPlainDate(subscription.endedAt)}. `
            : "Votre abonnement est terminé. "}
          Votre profil public est hors ligne et vos réservations sont fermées.
        </AuthHeader>
      ) : (
        <AuthHeader eyebrow="Nouveau compte · Étape 2 sur 2" title="Choisissez votre formule">
          Plus qu&apos;une étape : votre carte, sur la page de paiement sécurisée de Stripe.
        </AuthHeader>
      )}

      {keptUntil && (
        <p className="bg-muted px-5 py-4 text-sm shadow-[inset_2px_0_0_var(--primary)]">
          Vos données sont gardées jusqu&apos;au <strong className="font-medium">{formatLongDate(keptUntil)}</strong>.
          Réabonnez-vous d&apos;ici là pour tout retrouver comme avant : profil, tableaux, fichiers et rendez-vous.
        </p>
      )}
      {params.error === "checkout" && (
        <FormMessage tone="error" title="Le paiement n'a pas abouti">
          Rien n&apos;a été prélevé. Réessayez, avec la même carte ou une autre.
        </FormMessage>
      )}

      <PlanPicker defaultPlan={plan} trialEnd={trialEnd?.toISOString() ?? null} now={now.toISOString()} />
      <AccountLinks
        email={user.email}
        profile={{ firstName: profile.firstName, lastName: profile.lastName, handle: profile.handle }}
      />
    </>
  );
}

function SubscribeSkeleton() {
  return (
    <>
      <AuthHeader eyebrow="Nouveau compte" title="Choisissez votre formule" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-28" />
      <Skeleton className="h-11" />
    </>
  );
}
