"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { APP_PATH, LOGIN_PATH } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Buttons of the landing header. The page is static: the visitor version is drawn first, and a
// signed-in visitor gets "Ouvrir mon espace" once the browser has read the session (from the
// cookie, without asking the server). Ink buttons: the red one belongs to each block (one per screen).
export function HeaderActions() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => setSignedIn(data.session !== null));
  }, []);

  if (signedIn) {
    return (
      <Link href={APP_PATH} className={buttonVariants({ variant: "contrast", size: "sm" })}>
        Ouvrir mon espace
        <ArrowRightIcon data-icon="inline-end" />
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={LOGIN_PATH} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "max-sm:hidden")}>
        Se connecter
      </Link>
      <Link href="/signup" className={buttonVariants({ variant: "contrast", size: "sm" })}>
        Essayer 7 jours
      </Link>
    </div>
  );
}
