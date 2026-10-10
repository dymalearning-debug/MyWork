import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/auth/user";

import { AuthCard, AuthFooter, AuthHeader, AuthLink } from "../_components/auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe · MyWork" };

// Reached from the password reset email: /auth/confirm has already opened the session.
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPassword />
    </Suspense>
  );
}

async function ResetPassword() {
  const user = await getCurrentUser();
  if (!user) redirect("/link-expired?type=recovery");

  return (
    <>
      <AuthHeader eyebrow="Mot de passe" title="Nouveau mot de passe">
        Choisissez un nouveau mot de passe pour <span className="break-all">{user.email}</span>.
      </AuthHeader>
      <AuthCard>
        <ResetPasswordForm />
      </AuthCard>
      <AuthFooter>
        <AuthLink href="/login">Retour à la connexion</AuthLink>
      </AuthFooter>
    </>
  );
}
