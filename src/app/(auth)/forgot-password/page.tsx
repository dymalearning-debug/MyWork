import type { Metadata } from "next";

import { forgotPassword } from "../actions";
import { AuthCard, AuthFooter, AuthHeader, AuthLink } from "../_components/auth-shell";
import { EmailLinkForm } from "../_components/email-link-form";

export const metadata: Metadata = { title: "Mot de passe oublié · MyWork" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeader eyebrow="Mot de passe" title="Mot de passe oublié">
        Indiquez votre adresse : nous vous enverrons un lien pour choisir un nouveau mot de passe.
      </AuthHeader>
      <AuthCard>
        <EmailLinkForm id="forgot-email" action={forgotPassword} submitLabel="Envoyer le lien" />
      </AuthCard>
      <AuthFooter>
        <AuthLink href="/login">Retour à la connexion</AuthLink>
      </AuthFooter>
    </>
  );
}
