"use client";

import { ArrowUpRightIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { PortalFlow } from "@/lib/billing/portal";

import { openBillingPortal } from "../../actions";

// A button that opens a page of Stripe's portal (card, invoices, plan, cancellation), which leads
// back to Paramètres › Abonnement. It carries an arrow: it leaves MyWork (docs/billing.md,
// decision 15). The page stays busy until the browser has left.
export function PortalButton({
  flow,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick" | "type"> & { flow: PortalFlow }) {
  const [opening, startOpening] = useTransition();

  function open() {
    startOpening(async () => {
      const { url } = await openBillingPortal(flow);
      if (url) {
        window.location.assign(url);
        // Stays busy while the browser leaves.
        await new Promise(() => {});
      } else {
        toast.error("La page de Stripe n'a pas pu s'ouvrir. Réessayez dans un instant.");
      }
    });
  }

  return (
    <Button type="button" {...props} disabled={opening || props.disabled} onClick={open}>
      {children}
      <ArrowUpRightIcon data-icon="inline-end" />
    </Button>
  );
}
