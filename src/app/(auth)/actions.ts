"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  changePassword,
  type FormState,
  MESSAGES,
  normalizeEmail,
  requestPasswordReset,
  resendConfirmationEmail,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/auth/flows";
import { getRequestOrigin } from "@/lib/auth/origin";
import { emailLinkTarget, HOME_PATH, LOGIN_PATH, safeNextPath } from "@/lib/auth/paths";
import { getCurrentUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { REMEMBER_COOKIE, REMEMBER_COOKIE_OPTIONS } from "@/lib/supabase/session-cookies";

// Server Actions of the authentication pages. Validation happens here, on the server.

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function rememberChoice(remember: boolean) {
  const cookieStore = await cookies();
  cookieStore.set(REMEMBER_COOKIE, remember ? "1" : "0", REMEMBER_COOKIE_OPTIONS);
}

const emailLink = async () => emailLinkTarget(await getRequestOrigin());

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const remember = formData.get("remember") === "on";
  await rememberChoice(remember);

  const supabase = await createClient({ remember });
  const result = await signInWithEmail(supabase.auth, {
    email: normalizeEmail(formData.get("email")),
    password: text(formData, "password"),
  });
  if (!result.ok) return result;

  redirect(safeNextPath(formData.get("next")) ?? HOME_PATH);
}

export async function loginWithGoogle(formData: FormData) {
  // The sign-up page has no "Rester connecté" box: the default (stay signed in) applies.
  const remember = formData.get("remember") !== "off";
  await rememberChoice(remember);

  const callback = new URL(`${await getRequestOrigin()}/auth/callback`);
  const next = safeNextPath(formData.get("next"));
  if (next) callback.searchParams.set("next", next);

  const supabase = await createClient({ remember });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });
  if (error || !data.url) redirect(`${LOGIN_PATH}?error=google`);
  redirect(data.url);
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  return signUpWithEmail(
    supabase.auth,
    { email: normalizeEmail(formData.get("email")), password: text(formData, "password") },
    await emailLink(),
  );
}

export async function resendConfirmation(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  return resendConfirmationEmail(supabase.auth, normalizeEmail(formData.get("email")), await emailLink());
}

export async function forgotPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  return requestPasswordReset(supabase.auth, normalizeEmail(formData.get("email")), await emailLink());
}

// "Ce lien n'est plus valide": sends a new link of the same kind as the expired one.
export async function requestNewLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = normalizeEmail(formData.get("email"));
  const supabase = await createClient();
  if (formData.get("type") === "recovery") {
    return requestPasswordReset(supabase.auth, email, await emailLink());
  }
  const result = await resendConfirmationEmail(supabase.auth, email, await emailLink());
  // Same neutral answer as for a password reset: the screen does not reveal whether the address has an account.
  if (result.fieldErrors || result.error === MESSAGES.tooManyAttempts) return result;
  return { status: "sent", email };
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  // The email link has opened a session: without it, the link was not valid.
  if (!(await getCurrentUser())) redirect("/link-expired?type=recovery");

  const supabase = await createClient();
  const result = await changePassword(supabase.auth, text(formData, "password"));
  if (!result.ok) return result;

  redirect(HOME_PATH);
}
