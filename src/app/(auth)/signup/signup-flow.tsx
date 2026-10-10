"use client";

import { MailIcon } from "lucide-react";
import { useActionState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/auth/flows";

import { AuthCard, AuthFooter, AuthHeader, AuthLink, OrSeparator } from "../_components/auth-shell";
import { FieldError, FieldHint, FormMessage, PasswordInput, SubmitButton } from "../_components/form-parts";
import { GoogleButton } from "../_components/google-button";
import { signup } from "../actions";
import { ResendConfirmation } from "../resend-confirmation";

// Sign-up form, then the "Vérifiez votre boîte mail" screen. The address stays in the page's
// state (never in the URL) for the "Renvoyer l'e-mail" button.
export function SignupFlow() {
  const [state, action] = useActionState(signup, {} as FormState);

  if (state.status === "sent" && state.email) return <CheckEmail email={state.email} />;

  const errors = state.fieldErrors ?? {};
  return (
    <>
      <AuthHeader eyebrow="Nouveau compte" title="Créer un compte">
        CV, rendez-vous, tâches et fichiers, dans un seul espace.
      </AuthHeader>
      <AuthCard>
        <GoogleButton />
        <OrSeparator />

        <form action={action} noValidate className="flex flex-col gap-6">
          {state.error && <FormMessage tone="error">{state.error}</FormMessage>}

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-email">E-mail</Label>
              <Input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.fr"
                defaultValue={state.email}
                aria-invalid={!!errors.email || undefined}
                aria-describedby={errors.email ? "signup-email-error" : undefined}
              />
              <FieldError id="signup-email-error" message={errors.email} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-password">Mot de passe</Label>
              <PasswordInput
                id="signup-password"
                name="password"
                autoComplete="new-password"
                invalid={!!errors.password}
                describedBy={errors.password ? "signup-password-error" : "signup-password-hint"}
              />
              {errors.password ? (
                <FieldError id="signup-password-error" message={errors.password} />
              ) : (
                <div id="signup-password-hint">
                  <FieldHint>8 caractères minimum.</FieldHint>
                </div>
              )}
            </div>

            <SubmitButton>Créer mon compte</SubmitButton>
            <p className="text-center text-xs text-muted-foreground">Un e-mail de confirmation vous sera envoyé.</p>
          </div>
        </form>
      </AuthCard>
      <AuthFooter>
        Déjà un compte ? <AuthLink href="/login">Se connecter</AuthLink>
      </AuthFooter>
    </>
  );
}

function CheckEmail({ email }: { email: string }) {
  return (
    <>
      <AuthHeader eyebrow="Nouveau compte" title="Vérifiez votre boîte mail">
        Dernière étape avant d&apos;accéder à votre espace.
      </AuthHeader>
      <AuthCard>
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center border border-border text-foreground"
          >
            <MailIcon className="size-[18px]" />
          </span>
          <div className="flex flex-col gap-1.5 text-sm">
            <p>
              Un lien de confirmation vient d&apos;être envoyé à <span className="font-medium break-all">{email}</span>.
            </p>
            <p className="text-muted-foreground">Cliquez dessus pour activer votre compte. Il est valable une heure.</p>
          </div>
        </div>
        <div className="h-px bg-border" />
        <ResendConfirmation
          email={email}
          hint={
            <p className="text-xs text-muted-foreground">
              Rien reçu ? Vérifiez vos courriers indésirables, ou renvoyez l&apos;e-mail.
            </p>
          }
        />
      </AuthCard>
      <AuthFooter>
        {/* A full page load resets the form. */}
        Mauvaise adresse ?{" "}
        <a
          href="/signup"
          className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
        >
          Recommencer l&apos;inscription
        </a>
      </AuthFooter>
    </>
  );
}
