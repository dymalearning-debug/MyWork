import type { Metadata } from "next";
import { Suspense } from "react";

import { safeNextPath } from "@/lib/auth/paths";

import { AuthCard, AuthFooter, AuthHeader, AuthLink } from "../_components/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion · MyWork" };

const NOTICES: Record<string, string> = {
  google: "La connexion avec Google n'a pas abouti. Réessayez.",
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
  const notice = typeof params.error === "string" ? NOTICES[params.error] : undefined;
  return <LoginForm next={next} notice={notice} />;
}
