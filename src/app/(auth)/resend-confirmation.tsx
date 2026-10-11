"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/auth/flows";

import { FormMessage } from "./_components/form-parts";
import { resendConfirmation } from "./actions";

// "Renvoyer l'e-mail" of the sign-up confirmation (login with an unconfirmed address,
// "Vérifiez votre boîte mail" screen). Secondary button: the red one belongs to the main action.
export function ResendConfirmation({ email, hint }: { email: string; hint?: React.ReactNode }) {
  const [state, action, pending] = useActionState(resendConfirmation, {} as FormState);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="email" value={email} />
      {state.status === "sent" ? (
        <FormMessage>Un nouvel e-mail vient d&apos;être envoyé à {email}.</FormMessage>
      ) : (
        <>
          {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
          {hint}
          <Button type="submit" variant="outline" size="lg" className="w-full" disabled={pending}>
            Renvoyer l&apos;e-mail
          </Button>
        </>
      )}
    </form>
  );
}
