import type { Metadata } from "next";
import { Suspense } from "react";

import { requestNewLink } from "../actions";
import { AuthCard, AuthFooter, AuthHeader, AuthLink } from "../_components/auth-shell";
import { EmailLinkForm } from "../_components/email-link-form";

export const metadata: Metadata = { title: "Lien expiré · MyWork" };

// Opened by /auth/confirm when an email link has expired or was already used.
export default function LinkExpiredPage({ searchParams }: PageProps<"/link-expired">) {
  return (
    <>
      <AuthHeader eyebrow="Lien expiré" title="Ce lien n'est plus valide">
        Il a expiré ou a déjà été utilisé. Demandez-en un nouveau : il sera valable une heure.
      </AuthHeader>
      <AuthCard>
        <Suspense fallback={<NewLinkForm type="signup" />}>
          <NewLinkFormWithParams searchParams={searchParams} />
        </Suspense>
      </AuthCard>
      <AuthFooter>
        <AuthLink href="/login">Retour à la connexion</AuthLink>
      </AuthFooter>
    </>
  );
}

async function NewLinkFormWithParams({ searchParams }: Pick<PageProps<"/link-expired">, "searchParams">) {
  const { type } = await searchParams;
  return <NewLinkForm type={type === "recovery" ? "recovery" : "signup"} />;
}

// The new link is of the same kind as the expired one: password reset or sign-up confirmation.
function NewLinkForm({ type }: { type: "signup" | "recovery" }) {
  return (
    <EmailLinkForm id="expired-email" action={requestNewLink} submitLabel="Recevoir un nouveau lien" hidden={{ type }} />
  );
}
