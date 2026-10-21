"use client";

import { ArrowUpRightIcon, CreditCardIcon, DownloadIcon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DATA_RETENTION_DAYS, formatAmount, formatPrice, otherPlan, planSummary, PLANS } from "@/lib/billing/plans";
import type { BillingInvoice, BillingOverview } from "@/lib/billing/portal";
import { cardExpiry, cardLabel, formatLongDate, formatNumericDate, formatPlainDate, type SubscriptionState } from "@/lib/billing/rules";

import { cancelTrial, getBillingOverview, resumeSubscription } from "../../actions";
import { PortalButton } from "./portal-button";

// The section "Abonnement" of the Settings (docs/billing.md, "La section Abonnement des
// Paramètres"; mockups "Paramètres › Abonnement" and its states): the plan, its state and next
// date, the card, the last invoices. The operations open Stripe's portal (buttons with an arrow);
// "Résilier" asks first, in MyWork, what the cancellation will do. Nothing to save here.
// Read again from the server each time the section opens.

const BADGES: Partial<Record<SubscriptionState, { label: string; variant: "outline" | "success" | "warning" | "destructive" }>> = {
  trialing: { label: "Essai gratuit", variant: "outline" },
  active: { label: "Actif", variant: "success" },
  canceling: { label: "Résiliée", variant: "warning" },
  past_due: { label: "Paiement refusé", variant: "destructive" },
  ended: { label: "Terminé", variant: "outline" },
};

const INVOICE_STATUS: Record<BillingInvoice["status"], { label: string; variant: "success" | "destructive" | "outline" }> = {
  paid: { label: "Payée", variant: "success" },
  unpaid: { label: "Impayée", variant: "destructive" },
  void: { label: "Annulée", variant: "outline" },
};

const date = (value: string | null) => (value ? new Date(value) : null);

export function BillingSection() {
  // undefined: being read; null: the reading failed.
  const [overview, setOverview] = useState<BillingOverview | null | undefined>(undefined);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let current = true;
    getBillingOverview()
      .catch(() => null)
      .then((result) => {
        if (current) setOverview(result);
      });
    return () => {
      current = false;
    };
  }, [version]);

  function read() {
    setOverview(undefined);
    setVersion((value) => value + 1);
  }

  if (overview === undefined) return <BillingSkeleton />;
  if (overview === null) {
    return (
      <div className="flex max-w-[560px] flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground">Les informations de l&apos;abonnement n&apos;ont pas pu être lues.</p>
        <Button variant="outline" onClick={read}>
          Réessayer
        </Button>
      </div>
    );
  }
  return <Overview overview={overview} onChange={read} />;
}

function Overview({ overview, onChange }: { overview: BillingOverview; onChange: () => void }) {
  const { state, plan, card } = overview;
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [resuming, startResuming] = useTransition();
  const badge = BADGES[state];
  const subscribed = state !== "none" && state !== "ended" && !!plan;

  function resume() {
    startResuming(async () => {
      const result = await resumeSubscription();
      if (result.ok) {
        toast.success("Abonnement repris", { description: "Rien ne change : votre formule continue comme avant." });
        onChange();
      } else {
        toast.error("L'abonnement n'a pas pu être repris. Réessayez dans un instant.");
      }
    });
  }

  return (
    <div className="flex max-w-[560px] flex-col gap-7">
      <section aria-labelledby="billing-plan" className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p id="billing-plan" className="eyebrow text-muted-foreground">
              Formule
            </p>
            <p className="text-base font-medium">
              {plan && subscribed
                ? planSummary(plan)
                : state === "ended"
                  ? "Votre abonnement est terminé"
                  : "Aucun abonnement en cours"}
            </p>
          </div>
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        </div>
        {subscribed && <PlanDetails overview={overview} />}
        {(state === "trialing" || state === "active") && plan && (
          <>
            <div className="flex flex-wrap gap-2">
              <PortalButton flow="switch_plan" variant="outline">
                Passer à la formule {PLANS[otherPlan(plan)].name.toLowerCase()}
              </PortalButton>
              <Button variant="ghost" onClick={() => setConfirmCancel(true)}>
                Résilier
              </Button>
            </div>
            {state === "active" && (
              <p className="text-[13px] leading-[18px] text-muted-foreground">
                {plan === "monthly"
                  ? "À l'année : 50 € au lieu de 60 €. Le reste du mois en cours est déduit."
                  : "Au mois : le changement prend effet à la fin de l'année payée."}
              </p>
            )}
          </>
        )}
        {state === "canceling" && (
          <div>
            <Button onClick={resume} disabled={resuming}>
              Reprendre mon abonnement
            </Button>
          </div>
        )}
      </section>

      {card && subscribed && (
        <>
          <Separator />
          <section aria-labelledby="billing-card" className="flex flex-col gap-3">
            <p id="billing-card" className="eyebrow text-muted-foreground">
              Moyen de paiement
            </p>
            <div className="flex flex-wrap items-center gap-3.5">
              <span aria-hidden className="flex h-7 w-10 items-center justify-center border border-border">
                <CreditCardIcon className="size-4" />
              </span>
              <div className="flex flex-1 flex-col text-sm tabular-nums">
                <p>{cardLabel(card)}</p>
                {state === "past_due" ? (
                  <p className="text-[13px] text-destructive">Refusée</p>
                ) : (
                  <p className="text-[13px] text-muted-foreground">Expire en {cardExpiry(card)}</p>
                )}
              </div>
              <PortalButton flow="payment_method" variant={state === "past_due" ? "default" : "outline"}>
                Changer de carte
              </PortalButton>
            </div>
          </section>
        </>
      )}

      {(subscribed || overview.hasPortal) && (
        <>
          <Separator />
          <Invoices overview={overview} />
        </>
      )}

      {overview.hasPortal && (
        <p className="flex items-center gap-2 text-[13px] leading-[18px] text-muted-foreground">
          <ArrowUpRightIcon aria-hidden className="size-3.5 shrink-0" />
          Les boutons marqués d&apos;une flèche ouvrent la page sécurisée de Stripe, qui vous ramène ici.
        </p>
      )}

      <CancelDialog overview={overview} open={confirmCancel} onOpenChange={setConfirmCancel} />
    </div>
  );
}

// The dates of the plan, by state.
function PlanDetails({ overview }: { overview: BillingOverview }) {
  const { state, plan } = overview;
  const price = plan ? formatPrice(PLANS[plan].amount) : "";
  const trialEnd = date(overview.trialEnd);
  const nextCharge = date(overview.nextChargeAt);
  const end = date(overview.accessEnd);
  const since = date(overview.createdAt);
  const rows: [string, string][] = [];
  let note: string | null = null;

  if (state === "trialing" && trialEnd) {
    rows.push(["Essai gratuit", `jusqu'au ${formatLongDate(trialEnd)}`], ["Premier prélèvement", `${price} le ${formatPlainDate(trialEnd)}`]);
  } else if (state === "active") {
    if (nextCharge) rows.push(["Prochain prélèvement", `${price} le ${formatPlainDate(nextCharge)}`]);
    if (since) rows.push(["Abonné depuis", formatPlainDate(since)]);
  } else if (state === "canceling") {
    if (end) rows.push(["Accès ouvert jusqu'au", formatLongDate(end)]);
    rows.push(["Prochain prélèvement", "Aucun"]);
    const bookings = overview.bookingsAfterEnd;
    note = `Ensuite, votre profil public passera hors ligne${
      bookings > 0 ? ` et ${bookings === 1 ? "votre rendez-vous prévu" : `vos ${bookings} rendez-vous prévus`} après cette date ${bookings === 1 ? "sera annulé" : "seront annulés"}` : ""
    }. Vos données seront gardées ${DATA_RETENTION_DAYS} jours.`;
  } else if (state === "past_due") {
    const unpaid = overview.unpaid;
    if (unpaid) {
      rows.push(["Prélèvement refusé", `${formatPrice(unpaid.amount)} le ${formatPlainDate(new Date(unpaid.at), { year: false })}`]);
      if (unpaid.nextAttempt) rows.push(["Nouvelle tentative", formatLongDate(new Date(unpaid.nextAttempt), { year: false })]);
    }
    note =
      "Stripe réessaie pendant environ deux semaines. Sans paiement d'ici là, l'abonnement s'arrêtera et votre espace sera mis en pause.";
  }

  return (
    <>
      {rows.length > 0 && (
        <dl className="border-t border-border text-sm">
          {rows.map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4 border-b border-border py-2.5">
              <dt className="text-muted-foreground">{key}</dt>
              <dd className="text-right tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {note && <p className="bg-muted px-3.5 py-3 text-[13px] leading-[18px] shadow-[inset_2px_0_0_var(--primary)]">{note}</p>}
    </>
  );
}

function Invoices({ overview }: { overview: BillingOverview }) {
  const { invoices, state } = overview;
  const trialEnd = date(overview.trialEnd);
  return (
    <section aria-labelledby="billing-invoices" className="flex flex-col gap-1">
      <p id="billing-invoices" className="eyebrow pb-2 text-muted-foreground">
        Factures
      </p>
      {invoices === null ? (
        <p className="text-sm text-muted-foreground">Les factures n&apos;ont pas pu être lues.</p>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {state === "trialing" && trialEnd
            ? `Aucune facture pour l'instant. La première arrivera le ${formatPlainDate(trialEnd)}, à la fin de l'essai.`
            : "Aucune facture pour l'instant."}
        </p>
      ) : (
        <ul className="text-sm tabular-nums">
          {invoices.map((invoice) => {
            const status = INVOICE_STATUS[invoice.status];
            const day = formatNumericDate(new Date(invoice.date));
            return (
              <li key={invoice.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-border py-2">
                <span>{day}</span>
                <span>{formatAmount(invoice.amount)}</span>
                <Badge variant={status.variant}>{status.label}</Badge>
                {invoice.pdf ? (
                  <a
                    href={invoice.pdf}
                    target="_blank"
                    rel="noopener"
                    aria-label={`Télécharger la facture du ${day}`}
                    className="text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground"
                  >
                    <DownloadIcon className="size-4" />
                  </a>
                ) : (
                  <span className="size-4" />
                )}
              </li>
            );
          })}
        </ul>
      )}
      {overview.hasPortal && (
        <div className="pt-2">
          <PortalButton flow="invoices" variant="link" size="sm" className="h-auto px-0">
            Voir toutes les factures
          </PortalButton>
        </div>
      )}
    </section>
  );
}

// "Résilier" (docs/billing.md, decision 14): what the cancellation does, then Stripe's page, where
// it is confirmed. During the trial, nothing has been paid: it stops at once, here, without Stripe's
// page, and the space is paused (decision of 2026-10-21).
function CancelDialog({
  overview,
  open,
  onOpenChange,
}: {
  overview: BillingOverview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [cancelling, startCancelling] = useTransition();
  const trial = overview.state === "trialing";
  const end = date(overview.accessEnd);
  const bookings = overview.bookingsAfterEnd;
  const opening = trial
    ? "Votre essai s'arrête tout de suite et rien ne vous sera prélevé. Dès maintenant :"
    : `Votre accès reste ouvert jusqu'au ${end ? formatLongDate(end) : "bout de la période payée"}, la fin de la période payée. Rien ne vous sera plus prélevé. À cette date :`;
  const bookingsWhen = trial ? "à venir" : `${bookings === 1 ? "prévu" : "prévus"} après le ${end ? formatPlainDate(end, { year: false }) : "terme"}`;

  function cancelNow() {
    startCancelling(async () => {
      // On success, the action leads to "Choisissez votre formule".
      const result = await cancelTrial();
      if (result && !result.ok) toast.error("L'essai n'a pas pu être arrêté. Réessayez dans un instant.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !cancelling && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <p className="eyebrow text-muted-foreground">Résiliation</p>
          <DialogTitle>Résilier votre abonnement ?</DialogTitle>
          <DialogDescription render={<div />} className="flex flex-col gap-2">
            <p>{opening}</p>
            <ul className="flex list-disc flex-col gap-1 pl-[18px]">
              {trial && <li>votre espace est mis en pause : seuls les Paramètres restent ouverts ;</li>}
              <li>
                {trial
                  ? "votre profil public passe hors ligne et vos réservations ferment ;"
                  : "votre profil public passera hors ligne et vos réservations fermeront ;"}
              </li>
              {bookings > 0 && (
                <li>
                  {bookings === 1 ? "votre " : "vos "}
                  <strong className="font-medium text-foreground">{bookings} rendez-vous</strong> {bookingsWhen}{" "}
                  {trial
                    ? bookings === 1
                      ? "est annulé, et votre invité prévenu"
                      : "sont annulés, et vos invités prévenus"
                    : bookings === 1
                      ? "sera annulé, et votre invité prévenu"
                      : "seront annulés, et vos invités prévenus"}{" "}
                  par e-mail ;
                </li>
              )}
              <li>
                {trial
                  ? `vos données sont gardées ${DATA_RETENTION_DAYS} jours, le temps de vous réabonner (sans nouvel essai).`
                  : `vos données seront gardées ${DATA_RETENTION_DAYS} jours, le temps de vous réabonner.`}
              </li>
            </ul>
            {!trial && <p className="text-[13px] leading-[18px]">Vous confirmerez sur la page sécurisée de Stripe.</p>}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={cancelling} onClick={() => onOpenChange(false)}>
            Garder mon abonnement
          </Button>
          {trial ? (
            <Button variant="destructive" disabled={cancelling} onClick={cancelNow}>
              Résilier maintenant
            </Button>
          ) : (
            <PortalButton flow="cancel" variant="destructive">
              Continuer
            </PortalButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BillingSkeleton() {
  return (
    <div className="flex max-w-[560px] flex-col gap-4" aria-busy="true" aria-label="Chargement de l'abonnement">
      <Skeleton className="h-12" />
      <Skeleton className="h-24" />
      <Skeleton className="h-16" />
      <Skeleton className="h-24" />
    </div>
  );
}
