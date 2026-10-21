import { PortalButton } from "./portal-button";

// Banner at the top of the private space after a refused payment (docs/billing.md, "Accès selon
// l'état de l'abonnement"), while Stripe tries again: the access stays open meanwhile.
export function PaymentBanner({ text }: { text: string }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-destructive/25 bg-[color-mix(in_oklab,var(--destructive)_10%,var(--background))] px-8 py-3 text-sm sm:px-16"
    >
      <p className="min-w-0 flex-[1_1_360px]">
        <strong className="font-medium text-destructive">Paiement refusé.</strong> {text} Mettez à jour votre carte pour
        garder votre accès.
      </p>
      <PortalButton flow="payment_method" variant="contrast" size="sm">
        Mettre à jour ma carte
      </PortalButton>
    </div>
  );
}
