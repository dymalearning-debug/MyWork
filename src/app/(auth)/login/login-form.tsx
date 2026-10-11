"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/auth/flows";

import { OrSeparator } from "../_components/auth-shell";
import { FieldError, FormMessage, PasswordInput, SubmitButton } from "../_components/form-parts";
import { GoogleButton } from "../_components/google-button";
import { login } from "../actions";
import { UrlParamInputs } from "../_components/url-params";
import { ResendConfirmation } from "../resend-confirmation";

// Messages announced by the address (?error=… or ?notice=…), after a return from Google or an email link.
const NOTICES: Record<string, { tone: "info" | "error"; text: string }> = {
  google: { tone: "error", text: "La connexion avec Google n'a pas abouti. Réessayez." },
  confirmed: { tone: "info", text: "Votre adresse est confirmée. Connectez-vous pour accéder à votre espace." },
};

export function LoginForm() {
  const [state, action] = useActionState(login, {} as FormState);
  // Shared with the Google button, which is a separate form.
  const [remember, setRemember] = useState(true);
  const errors = state.fieldErrors ?? {};


  return (
    <>
      <GoogleButton remember={remember} />
      <OrSeparator />

      <form action={action} noValidate className="flex flex-col gap-6">
        <UrlParamInputs names={["next"]} />
        {state.error ? (
          <FormMessage tone="error">{state.error}</FormMessage>
        ) : (
          <Suspense fallback={null}>
            <UrlNotice />
          </Suspense>
        )}

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="login-email">E-mail</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.fr"
              defaultValue={state.email}
              aria-invalid={!!errors.email || undefined}
              aria-describedby={errors.email ? "login-email-error" : undefined}
            />
            <FieldError id="login-email-error" message={errors.email} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="login-password">Mot de passe</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              name="password"
              autoComplete="current-password"
              invalid={!!errors.password}
              describedBy={errors.password ? "login-password-error" : undefined}
            />
            <FieldError id="login-password-error" message={errors.password} />
          </div>

          <div className="flex items-center gap-2.5">
            <Checkbox
              id="login-remember"
              name="remember"
              value="on"
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked)}
            />
            <Label htmlFor="login-remember">Rester connecté</Label>
          </div>

          <SubmitButton>Se connecter</SubmitButton>
        </div>
      </form>

      {state.unconfirmed && state.email && <ResendConfirmation email={state.email} />}
    </>
  );
}

function UrlNotice() {
  const params = useSearchParams();
  const notice = NOTICES[params.get("error") ?? params.get("notice") ?? ""];
  return notice ? <FormMessage tone={notice.tone}>{notice.text}</FormMessage> : null;
}
