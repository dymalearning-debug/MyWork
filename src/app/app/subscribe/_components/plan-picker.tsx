"use client";

import { LockIcon } from "lucide-react";
import { useActionState, useState } from "react";

import { FormMessage, SubmitButton } from "@/app/(auth)/_components/form-parts";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice, PLAN_IDS, PLANS, TRIAL_DAYS, TRIAL_REMINDER_DAYS, type PlanId } from "@/lib/billing/plans";
import { formatLongDate, formatPlainDate } from "@/lib/billing/rules";
import { cn } from "@/lib/utils";

import { startCheckout, type CheckoutState } from "../actions";

const ERRORS: Record<NonNullable<CheckoutState["error"]>, string> = {
  unavailable: "Le paiement n'est pas disponible pour le moment. Réessayez plus tard.",
  failed: "La page de paiement n'a pas pu s'ouvrir. Réessayez dans un instant.",
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// What follows the first payment: "50 € chaque année, à la même date", "5 € chaque mois, le 28".
function then(plan: PlanId, firstCharge: Date) {
  const amount = formatPrice(PLANS[plan].amount);
  if (plan === "yearly") return `${amount} chaque année, à la même date`;
  const day = formatPlainDate(firstCharge, { year: false }).split(" ")[0];
  return `${amount} chaque mois, le ${day}`;
}

// The two plans, the schedule of the payments and the button to Stripe's payment page
// (docs/billing.md, decision 13). trialEnd: the day the trial would end if it started now; null
// without a trial (a new subscription after an ended one: the first payment is taken at once).
// now: the time of the server, the same for the page and the browser.
export function PlanPicker({ defaultPlan, trialEnd, now }: { defaultPlan: PlanId; trialEnd: string | null; now: string }) {
  const [plan, setPlan] = useState<PlanId>(defaultPlan);
  const [state, action] = useActionState(startCheckout, {} as CheckoutState);
  const end = trialEnd ? new Date(trialEnd) : null;
  const amount = formatPrice(PLANS[plan].amount);

  return (
    <form action={action} className="flex flex-col gap-7">
      <input type="hidden" name="plan" value={plan} />
      <fieldset className="flex flex-col gap-3">
        <legend className="eyebrow mb-3 text-muted-foreground">Formule</legend>
        <RadioGroup
          value={plan}
          onValueChange={(value) => setPlan(value as PlanId)}
          aria-label="Formule"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {PLAN_IDS.map((id) => (
            <label
              key={id}
              className={cn(
                "flex cursor-pointer flex-col gap-2.5 border bg-card p-5 transition-colors",
                plan === id ? "border-foreground" : "border-border hover:border-foreground/40",
              )}
            >
              <span className="flex items-center gap-2.5">
                <RadioGroupItem value={id} aria-label={`Formule ${PLANS[id].name.toLowerCase()}`} />
                <span className="text-sm font-medium">{PLANS[id].name}</span>
                {id === "yearly" && (
                  <Badge variant="contrast" className="ml-auto">
                    2 mois offerts
                  </Badge>
                )}
              </span>
              <span className="flex flex-wrap items-baseline gap-1.5 tabular-nums">
                <span className="font-heading text-[40px] leading-none font-medium">{formatPrice(PLANS[id].amount)}</span>
                <span className="text-sm text-muted-foreground">{PLANS[id].period}</span>
                {id === "yearly" && (
                  <s className="text-[13px] text-muted-foreground">
                    <span className="sr-only">au lieu de </span>60 €
                  </s>
                )}
              </span>
              <span className="text-[13px] leading-[18px] text-muted-foreground">{PLANS[id].text}</span>
            </label>
          ))}
        </RadioGroup>
      </fieldset>
      <p className="-mt-3 text-[13px] leading-[18px] text-muted-foreground">
        Les deux formules donnent accès à tout : profil public, rendez-vous avec visio, tableaux de tâches, 10 Go de
        fichiers.
      </p>

      <section
        aria-label="Échéancier"
        className="flex flex-col gap-2.5 bg-muted px-5 py-4 text-sm shadow-[inset_2px_0_0_var(--primary)]"
      >
        <div className="flex justify-between gap-4">
          <span>Aujourd&apos;hui</span>
          <span className="font-medium tabular-nums">{end ? "0 €" : amount}</span>
        </div>
        {end && (
          <div className="flex justify-between gap-4">
            <span>{capitalize(formatLongDate(end, { year: false }))}, fin de l&apos;essai</span>
            <span className="font-medium tabular-nums">{amount}</span>
          </div>
        )}
        <p className="text-[13px] leading-[18px] text-muted-foreground">
          {end
            ? `Puis ${then(plan, end)}. Un e-mail vous prévient ${TRIAL_REMINDER_DAYS} jours avant la fin de l'essai ; résiliez d'ici là et vous ne payez rien.`
            : `Pas de nouvel essai : ${amount} sont prélevés aujourd'hui, puis ${then(plan, new Date(now)).replace(/^\S+ € /, "")}.`}
        </p>
      </section>

      {state.error && <FormMessage tone="error">{ERRORS[state.error]}</FormMessage>}

      <div className="flex flex-col gap-3">
        <SubmitButton>{end ? `Démarrer mon essai de ${TRIAL_DAYS} jours` : "Me réabonner"}</SubmitButton>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <LockIcon aria-hidden className="size-3.5" />
          {end ? "Paiement sécurisé par Stripe. Rien n'est débité aujourd'hui." : "Paiement sécurisé par Stripe."}
        </p>
      </div>
    </form>
  );
}
