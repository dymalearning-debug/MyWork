"use client";

import { useState, useTransition } from "react";

import type { ProfileSettings } from "@/lib/account/settings";

import { signOut } from "../../actions";
import { SettingsDialog } from "../../_components/settings-dialog";

const LINK =
  "font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors outline-none hover:decoration-foreground focus-visible:decoration-foreground disabled:opacity-50";

// Under "Choisissez votre formule": the account, its Settings (to delete it, docs/billing.md,
// "Accès selon l'état de l'abonnement") and the sign-out.
export function AccountLinks({ email, profile }: { email: string; profile: ProfileSettings }) {
  const [settings, setSettings] = useState({ open: false, key: 0 });
  const [signingOut, startSignOut] = useTransition();

  return (
    <div className="border-t border-border pt-5">
      <p className="text-center text-sm text-muted-foreground">
        Connecté avec <span className="break-all">{email}</span> ·{" "}
        <button
          type="button"
          className={LINK}
          onClick={() => setSettings((current) => ({ open: true, key: current.key + 1 }))}
        >
          Paramètres du compte
        </button>{" "}
        ·{" "}
        <button type="button" className={LINK} disabled={signingOut} onClick={() => startSignOut(() => signOut())}>
          Se déconnecter
        </button>
      </p>
      <SettingsDialog
        key={settings.key}
        open={settings.open}
        onOpenChange={(open) => setSettings((current) => ({ ...current, open }))}
        email={email}
        profile={profile}
        subscribed={false}
      />
    </div>
  );
}
