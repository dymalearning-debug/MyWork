"use client";

import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { DEFAULT_PLAN, formatPrice, parsePlan, PLANS, TRIAL_DAYS } from "@/lib/billing/plans";

import { AuthLink } from "../_components/auth-shell";

// Above the sign-up form: the plan of the address (?plan=monthly, from the cards of the landing
// page; the yearly one otherwise), and the trial (docs/billing.md, "Le parcours d'inscription").
// "Changer" leads back to the plans of the landing page.
export function PlanRecap() {
  const plan = PLANS[parsePlan(useSearchParams().get("plan")) ?? DEFAULT_PLAN];
  return (
    <section aria-label="Formule choisie" className="flex flex-col gap-1.5 border border-border bg-muted px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow text-muted-foreground">Votre formule</p>
        <span className="text-[13px]">
          <AuthLink href="/#tarif">Changer</AuthLink>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <p className="text-base font-medium">
          {plan.name} · <span className="tabular-nums">{formatPrice(plan.amount)}</span> {plan.per}
        </p>
        {plan.id === "yearly" && <Badge variant="outline">2 mois offerts</Badge>}
      </div>
      <p className="text-[13px] leading-[18px] text-muted-foreground">
        {TRIAL_DAYS} jours d&apos;essai gratuit : rien n&apos;est prélevé avant le {TRIAL_DAYS + 1}e jour.
      </p>
    </section>
  );
}

// While the address is read (the page itself is static).
export function PlanRecapSkeleton() {
  return <div aria-hidden className="h-[106px] border border-border bg-muted" />;
}
