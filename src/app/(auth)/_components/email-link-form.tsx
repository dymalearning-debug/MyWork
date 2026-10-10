"use client";

import { useActionState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/auth/flows";

import { FieldError, FormMessage, SubmitButton } from "./form-parts";

// An email field that asks for a link ("Mot de passe oublié", "Ce lien n'est plus valide").
// Once sent, the form gives way to a neutral message: it never tells whether the account exists.
export function EmailLinkForm({
  id,
  action: serverAction,
  submitLabel,
  hidden,
}: {
  id: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  hidden?: Record<string, string>;
}) {
  const [state, action] = useActionState(serverAction, {} as FormState);
  const emailError = state.fieldErrors?.email;

  if (state.status === "sent") {
    return (
      <>
        <FormMessage title="E-mail envoyé">
          Si un compte existe pour <span className="break-all">{state.email}</span>, un e-mail vient de lui être
          envoyé. Le lien est valable une heure.
        </FormMessage>
        <p className="text-xs text-muted-foreground">
          Rien reçu ? Vérifiez vos courriers indésirables, ou recommencez dans quelques minutes.
        </p>
      </>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>E-mail</Label>
        <Input
          id={id}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.fr"
          defaultValue={state.email}
          aria-invalid={!!emailError || undefined}
          aria-describedby={emailError ? `${id}-error` : undefined}
        />
        <FieldError id={`${id}-error`} message={emailError} />
      </div>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
