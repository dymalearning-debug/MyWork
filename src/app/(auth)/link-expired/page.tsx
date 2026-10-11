import type { Metadata } from "next";

import { requestNewLink } from "../actions";
import { AuthCard, AuthFooter, AuthHeader, AuthLink } from "../_components/auth-shell";
import { EmailLinkForm } from "../_components/email-link-form";

export const metadata: Metadata = { title: "Lien expiré · MyWork" };

// Opened by /auth/confirm when an email link has expired or was already used.
// The new link is of the same kind as the expired one (?type=recovery or signup).
export default function LinkExpiredPage() {
  return (
    <>
      <AuthHeader eyebrow="Lien expiré" title="Ce lien n'est plus valide">
        Il a expiré ou a déjà été utilisé. Demandez-en un nouveau : il sera valable une heure.
      </AuthHeader>
      <AuthCard>
        <EmailLinkForm
          id="expired-email"
          action={requestNewLink}
          submitLabel="Recevoir un nouveau lien"
          urlParams={["type"]}
        />
      </AuthCard>
      <AuthFooter>
        <AuthLink href="/login">Retour à la connexion</AuthLink>
      </AuthFooter>
    </>
  );
}
