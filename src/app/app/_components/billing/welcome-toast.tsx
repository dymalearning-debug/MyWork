"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

// Back from Stripe's payment page (/app?welcome=1, docs/billing.md, "Le parcours d'inscription"):
// the welcome notification, once; the address loses its ?welcome.
export function WelcomeToast({ description }: { description: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const welcome = searchParams.get("welcome") === "1";

  useEffect(() => {
    if (!welcome) return;
    // One notification, even if the effect runs twice before the address changes.
    toast.success("Bienvenue dans MyWork", { id: "welcome", description });
    router.replace(pathname, { scroll: false });
  }, [welcome, description, router, pathname]);

  return null;
}
