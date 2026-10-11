import type { Metadata } from "next";

import { AuthCard, AuthFooter, AuthHeader, AuthLink } from "../_components/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion · MyWork" };

export default function LoginPage() {
  return (
    <>
      <AuthHeader eyebrow="Espace privé" title="Connexion">
        Accédez à votre espace MyWork.
      </AuthHeader>
      <AuthCard>
        <LoginForm />
      </AuthCard>
      <AuthFooter>
        Pas encore de compte ? <AuthLink href="/signup">Créer un compte</AuthLink>
      </AuthFooter>
    </>
  );
}
