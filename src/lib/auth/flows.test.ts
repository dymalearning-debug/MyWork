import { describe, expect, it, vi } from "vitest";

import {
  type AuthApi,
  changePassword,
  MESSAGES,
  normalizeEmail,
  requestPasswordReset,
  resendConfirmationEmail,
  signInWithEmail,
  signUpWithEmail,
  translateAuthError,
} from "./flows";

// Fake Supabase Auth: every method succeeds unless told otherwise.
// These tests cover the flows that send an email, which end-to-end tests never trigger.
type FakeError = { code?: string; status?: number; message?: string };

function fakeAuth(errors: Partial<Record<keyof AuthApi, FakeError>> = {}) {
  const answer = (method: keyof AuthApi) =>
    vi.fn().mockResolvedValue({ data: {}, error: errors[method] ?? null });
  return {
    signInWithPassword: answer("signInWithPassword"),
    signUp: answer("signUp"),
    resend: answer("resend"),
    resetPasswordForEmail: answer("resetPasswordForEmail"),
    updateUser: answer("updateUser"),
  };
}

const asApi = (auth: ReturnType<typeof fakeAuth>) => auth as unknown as AuthApi;
const LINK = "http://localhost:3000/auth/confirm";
const rateLimited = { code: "over_email_send_rate_limit", status: 429 };

describe("translateAuthError", () => {
  it("translates the Supabase codes into French", () => {
    expect(translateAuthError({ code: "invalid_credentials", status: 400 })).toBe(MESSAGES.invalidCredentials);
    expect(translateAuthError({ code: "over_request_rate_limit", status: 429 })).toBe(MESSAGES.tooManyAttempts);
    expect(translateAuthError({ code: "weak_password", status: 422 })).toBe(MESSAGES.weakPassword);
  });

  it("treats any 429 as too many attempts, and anything unknown as a generic error", () => {
    expect(translateAuthError({ code: "something_new", status: 429 })).toBe(MESSAGES.tooManyAttempts);
    expect(translateAuthError({ code: "something_new", status: 500 })).toBe(MESSAGES.generic);
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Ines.Robert@Exemple.FR ")).toBe("ines.robert@exemple.fr");
    expect(normalizeEmail(null)).toBe("");
  });
});

describe("signInWithEmail", () => {
  it("signs in with valid credentials", async () => {
    const auth = fakeAuth();
    const result = await signInWithEmail(asApi(auth), { email: "a@b.fr", password: "secret123" });
    expect(result.ok).toBe(true);
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "a@b.fr", password: "secret123" });
  });

  it("validates the fields before calling Supabase", async () => {
    const auth = fakeAuth();
    const result = await signInWithEmail(asApi(auth), { email: "pas-un-email", password: "" });
    expect(result.fieldErrors).toEqual({ email: MESSAGES.emailInvalid, password: MESSAGES.passwordRequired });
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("gives a single message for wrong credentials, without revealing whether the account exists", async () => {
    const auth = fakeAuth({ signInWithPassword: { code: "invalid_credentials", status: 400 } });
    const result = await signInWithEmail(asApi(auth), { email: "a@b.fr", password: "wrong-pass" });
    expect(result).toEqual({ email: "a@b.fr", error: MESSAGES.invalidCredentials });
  });

  it("offers to resend the email when the address is not confirmed", async () => {
    const auth = fakeAuth({ signInWithPassword: { code: "email_not_confirmed", status: 400 } });
    const result = await signInWithEmail(asApi(auth), { email: "a@b.fr", password: "secret123" });
    expect(result.unconfirmed).toBe(true);
    expect(result.error).toBe(MESSAGES.unconfirmed);
  });

  it("reports too many attempts", async () => {
    const auth = fakeAuth({ signInWithPassword: { code: "over_request_rate_limit", status: 429 } });
    const result = await signInWithEmail(asApi(auth), { email: "a@b.fr", password: "secret123" });
    expect(result.error).toBe(MESSAGES.tooManyAttempts);
  });
});

describe("signUpWithEmail", () => {
  it("creates the account and sends the email link back to the site of the request", async () => {
    const auth = fakeAuth();
    const result = await signUpWithEmail(asApi(auth), { email: "a@b.fr", password: "12345678" }, LINK);
    expect(result).toEqual({ status: "sent", email: "a@b.fr" });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "a@b.fr",
      password: "12345678",
      options: { emailRedirectTo: LINK },
    });
  });

  it("keeps the chosen plan with the account", async () => {
    const auth = fakeAuth();
    await signUpWithEmail(asApi(auth), { email: "a@b.fr", password: "12345678" }, LINK, { plan: "monthly" });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "a@b.fr",
      password: "12345678",
      options: { emailRedirectTo: LINK, data: { plan: "monthly" } },
    });
  });

  it("requires 8 characters, with no other rule", async () => {
    const auth = fakeAuth();
    const result = await signUpWithEmail(asApi(auth), { email: "a@b.fr", password: "1234567" }, LINK);
    expect(result.fieldErrors?.password).toBe(MESSAGES.weakPassword);
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("shows the same screen for an address that already has an account (Supabase answers without error)", async () => {
    const auth = fakeAuth();
    const result = await signUpWithEmail(asApi(auth), { email: "existing@b.fr", password: "12345678" }, LINK);
    expect(result.status).toBe("sent");
  });

  it("reports the email quota", async () => {
    const auth = fakeAuth({ signUp: rateLimited });
    const result = await signUpWithEmail(asApi(auth), { email: "a@b.fr", password: "12345678" }, LINK);
    expect(result).toEqual({ email: "a@b.fr", error: MESSAGES.tooManyAttempts });
  });

  it("reports an address the email service refuses", async () => {
    const auth = fakeAuth({ signUp: { code: "email_address_not_authorized", status: 400 } });
    const result = await signUpWithEmail(asApi(auth), { email: "a@b.fr", password: "12345678" }, LINK);
    expect(result.error).toBe(MESSAGES.emailNotAuthorized);
  });
});

describe("resendConfirmationEmail", () => {
  it("resends the sign-up email", async () => {
    const auth = fakeAuth();
    const result = await resendConfirmationEmail(asApi(auth), "a@b.fr", LINK);
    expect(result.status).toBe("sent");
    expect(auth.resend).toHaveBeenCalledWith({ type: "signup", email: "a@b.fr", options: { emailRedirectTo: LINK } });
  });

  it("reports the email quota", async () => {
    const auth = fakeAuth({ resend: rateLimited });
    const result = await resendConfirmationEmail(asApi(auth), "a@b.fr", LINK);
    expect(result.error).toBe(MESSAGES.tooManyAttempts);
  });
});

describe("requestPasswordReset", () => {
  it("sends the link back to the site of the request", async () => {
    const auth = fakeAuth();
    const result = await requestPasswordReset(asApi(auth), "a@b.fr", LINK);
    expect(result).toEqual({ status: "sent", email: "a@b.fr" });
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("a@b.fr", { redirectTo: LINK });
  });

  it("gives the same neutral answer when Supabase refuses (unknown or unauthorized address)", async () => {
    const auth = fakeAuth({ resetPasswordForEmail: { code: "email_address_not_authorized", status: 400 } });
    const result = await requestPasswordReset(asApi(auth), "unknown@b.fr", LINK);
    expect(result).toEqual({ status: "sent", email: "unknown@b.fr" });
  });

  it("reports the email quota, which reveals nothing about the address", async () => {
    const auth = fakeAuth({ resetPasswordForEmail: rateLimited });
    const result = await requestPasswordReset(asApi(auth), "a@b.fr", LINK);
    expect(result.error).toBe(MESSAGES.tooManyAttempts);
  });

  it("validates the address", async () => {
    const auth = fakeAuth();
    const result = await requestPasswordReset(asApi(auth), "", LINK);
    expect(result.fieldErrors?.email).toBe(MESSAGES.emailRequired);
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });
});

describe("changePassword", () => {
  it("saves the new password", async () => {
    const auth = fakeAuth();
    expect((await changePassword(asApi(auth), "nouveau-mdp")).ok).toBe(true);
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "nouveau-mdp" });
  });

  it("refuses the current password", async () => {
    const auth = fakeAuth({ updateUser: { code: "same_password", status: 422 } });
    const result = await changePassword(asApi(auth), "ancien-mdp");
    expect(result.fieldErrors?.password).toBe(MESSAGES.samePassword);
  });
});
