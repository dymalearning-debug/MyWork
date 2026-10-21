import type { AuthError, SupabaseClient } from "@supabase/supabase-js";

// Authentication flows, written against the Supabase Auth API only, so that unit tests can
// replace it with a fake (src/lib/auth/flows.test.ts). Server Actions call these functions.

export type AuthApi = Pick<
  SupabaseClient["auth"],
  "signInWithPassword" | "signUp" | "resend" | "resetPasswordForEmail" | "updateUser"
>;

export const MIN_PASSWORD_LENGTH = 8;

export type FieldErrors = { email?: string; password?: string };

// State returned to the forms (React useActionState).
export type FormState = {
  status?: "sent";
  email?: string;
  error?: string;
  fieldErrors?: FieldErrors;
  // Login refused because the address is not confirmed yet: offer to resend the email.
  unconfirmed?: boolean;
};

export const MESSAGES = {
  invalidCredentials: "E-mail ou mot de passe incorrect.",
  unconfirmed: "Votre adresse e-mail n'est pas encore confirmée. Cliquez sur le lien reçu par e-mail, ou demandez-en un nouveau.",
  tooManyAttempts: "Trop de tentatives, réessayez dans quelques minutes.",
  weakPassword: `Mot de passe trop court : ${MIN_PASSWORD_LENGTH} caractères minimum.`,
  samePassword: "Choisissez un mot de passe différent de l'actuel.",
  emailRequired: "Indiquez votre adresse e-mail.",
  emailInvalid: "Cette adresse e-mail n'est pas valide.",
  passwordRequired: "Indiquez votre mot de passe.",
  emailNotAuthorized: "Impossible d'envoyer un e-mail à cette adresse pour le moment.",
  generic: "Une erreur est survenue. Réessayez dans un instant.",
} as const;

// Supabase error messages are in English: translate them from their code.
export function translateAuthError(error: Pick<AuthError, "code" | "status">): string {
  switch (error.code) {
    case "invalid_credentials":
      return MESSAGES.invalidCredentials;
    case "email_not_confirmed":
      return MESSAGES.unconfirmed;
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return MESSAGES.tooManyAttempts;
    case "weak_password":
      return MESSAGES.weakPassword;
    case "same_password":
      return MESSAGES.samePassword;
    case "email_address_invalid":
      return MESSAGES.emailInvalid;
    case "email_address_not_authorized":
      return MESSAGES.emailNotAuthorized;
  }
  if (error.status === 429) return MESSAGES.tooManyAttempts;
  return MESSAGES.generic;
}

function isRateLimit(error: Pick<AuthError, "code" | "status">) {
  return translateAuthError(error) === MESSAGES.tooManyAttempts;
}

export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function validateEmail(email: string): string | undefined {
  if (!email) return MESSAGES.emailRequired;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return MESSAGES.emailInvalid;
}

export function validateNewPassword(password: string): string | undefined {
  if (password.length < MIN_PASSWORD_LENGTH) return MESSAGES.weakPassword;
}

type Credentials = { email: string; password: string };

export async function signInWithEmail(
  auth: AuthApi,
  { email, password }: Credentials,
): Promise<FormState & { ok?: true }> {
  const fieldErrors: FieldErrors = {
    email: validateEmail(email),
    password: password ? undefined : MESSAGES.passwordRequired,
  };
  if (fieldErrors.email || fieldErrors.password) return { email, fieldErrors };

  const { error } = await auth.signInWithPassword({ email, password });
  if (!error) return { ok: true };
  if (error.code === "email_not_confirmed") {
    return { email, error: MESSAGES.unconfirmed, unconfirmed: true };
  }
  return { email, error: translateAuthError(error) };
}

// An address that already has an account gets the same "check your inbox" screen:
// Supabase does not reveal which addresses are registered. `metadata`: kept with the account
// (user_metadata), such as the plan chosen on the sign-up page (docs/billing.md).
export async function signUpWithEmail(
  auth: AuthApi,
  { email, password }: Credentials,
  emailRedirectTo: string,
  metadata?: Record<string, string>,
): Promise<FormState> {
  const fieldErrors: FieldErrors = {
    email: validateEmail(email),
    password: validateNewPassword(password),
  };
  if (fieldErrors.email || fieldErrors.password) return { email, fieldErrors };

  const { error } = await auth.signUp({ email, password, options: { emailRedirectTo, ...(metadata && { data: metadata }) } });
  if (error) {
    if (error.code === "weak_password") return { email, fieldErrors: { password: MESSAGES.weakPassword } };
    return { email, error: translateAuthError(error) };
  }
  return { status: "sent", email };
}

export async function resendConfirmationEmail(
  auth: AuthApi,
  email: string,
  emailRedirectTo: string,
): Promise<FormState> {
  const emailError = validateEmail(email);
  if (emailError) return { email, fieldErrors: { email: emailError } };

  const { error } = await auth.resend({ type: "signup", email, options: { emailRedirectTo } });
  if (error) return { email, error: translateAuthError(error) };
  return { status: "sent", email };
}

// The answer is the same whether the account exists or not. Only a rate limit is reported,
// since it does not reveal anything about the address.
export async function requestPasswordReset(
  auth: AuthApi,
  email: string,
  redirectTo: string,
): Promise<FormState> {
  const emailError = validateEmail(email);
  if (emailError) return { email, fieldErrors: { email: emailError } };

  const { error } = await auth.resetPasswordForEmail(email, { redirectTo });
  if (error && isRateLimit(error)) return { email, error: MESSAGES.tooManyAttempts };
  return { status: "sent", email };
}

export async function changePassword(auth: AuthApi, password: string): Promise<FormState & { ok?: true }> {
  const passwordError = validateNewPassword(password);
  if (passwordError) return { fieldErrors: { password: passwordError } };

  const { error } = await auth.updateUser({ password });
  if (error) {
    if (error.code === "weak_password" || error.code === "same_password") {
      return { fieldErrors: { password: translateAuthError(error) } };
    }
    return { error: translateAuthError(error) };
  }
  return { ok: true };
}
