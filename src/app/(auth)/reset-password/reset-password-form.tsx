"use client";

import { useActionState } from "react";

import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/auth/flows";

import { resetPassword } from "../actions";
import { FieldError, FieldHint, FormMessage, PasswordInput, SubmitButton } from "../_components/form-parts";

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPassword, {} as FormState);
  const passwordError = state.fieldErrors?.password;

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-password">Nouveau mot de passe</Label>
        <PasswordInput
          id="reset-password"
          name="password"
          autoComplete="new-password"
          invalid={!!passwordError}
          describedBy={passwordError ? "reset-password-error" : "reset-password-hint"}
        />
        {passwordError ? (
          <FieldError id="reset-password-error" message={passwordError} />
        ) : (
          <div id="reset-password-hint">
            <FieldHint>8 caractères minimum.</FieldHint>
          </div>
        )}
      </div>
      <SubmitButton>Enregistrer et me connecter</SubmitButton>
    </form>
  );
}
