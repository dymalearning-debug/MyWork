import type { Metadata } from "next";
import { Suspense } from "react";

import { safeNextPath } from "@/lib/auth/paths";

import { AuthCard, AuthFooter, AuthHeader, AuthLink } from "../_components/auth-shell";
import { LoginForm, type Notice } from "./login-form";

export const metadata: Metadata = { title: "Connexion · MyWork" };

// Messages announced by the URL (?error=… or ?notice=…), after a return from Google or an email link.
const NOTICES: Record<string, Notice> = {
  google: { tone: "error", text: "La connexion avec Google n'a pas abouti. Réessayez." },
  confirmed: { tone: "info", text: "Votre adresse est confirmée. Connectez-vous pour accéder à votre espace." },
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <AuthHeader eyebrow="Espace privé" title="Connexion">
        Accédez à votre espace MyWork.
      </AuthHeader>
      <AuthCard>
        {/* The URL parameters are only known at request time: the static form is shown meanwhile. */}
        <Suspense fallback={<LoginForm />}>
          <LoginFormWithParams searchParams={searchParams} />
        </Suspense>
      </AuthCard>
      <AuthFooter>
        Pas encore de compte ? <AuthLink href="/signup">Créer un compte</AuthLink>
      </AuthFooter>
    </>
  );
}

async function LoginFormWithParams({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = safeNextPath(params.next) ?? undefined;
  const key = params.error ?? params.notice;
  const notice = typeof key === "string" ? NOTICES[key] : undefined;
  return <LoginForm next={next} notice={notice} />;
}
