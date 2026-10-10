import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

// Supabase admin API, for tests only: creates test accounts and generates email links
// without sending any email (docs/auth.md, "Tests"). Needs the secret key, which never
// reaches the browser: it lives in .env.local and in the GitHub secrets.

const TEST_EMAIL_PREFIX = "e2e-";
const TEST_EMAIL_DOMAIN = "@mywork-tests.example.com";
export const TEST_PASSWORD = "e2e-password-123";

export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("End-to-end tests need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (see .env.example).");
  }
  return createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

// A recognizable address, so that leftover test accounts can always be found and deleted.
export function testEmail() {
  return `${TEST_EMAIL_PREFIX}${randomUUID().slice(0, 12)}${TEST_EMAIL_DOMAIN}`;
}

export function isTestEmail(email: string | undefined) {
  return !!email && email.startsWith(TEST_EMAIL_PREFIX) && email.endsWith(TEST_EMAIL_DOMAIN);
}

export async function createUser({ confirmed = true } = {}) {
  const email = testEmail();
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: confirmed,
  });
  if (error) throw error;
  return { id: data.user.id, email, password: TEST_PASSWORD };
}

// Link of an email, as Supabase would have sent it: /auth/confirm with a token_hash.
// "signup" creates an unconfirmed account, like the sign-up form does.
export async function emailLink(
  type: "signup" | "recovery",
  email: string,
  password = TEST_PASSWORD,
): Promise<string> {
  const admin = adminClient().auth.admin;
  const { data, error } =
    type === "signup"
      ? await admin.generateLink({ type: "signup", email, password })
      : await admin.generateLink({ type: "recovery", email });
  if (error) throw error;
  const linkType = type === "signup" ? "email" : "recovery";
  return `/auth/confirm?token_hash=${data.properties.hashed_token}&type=${linkType}`;
}

export async function deleteTestUsers() {
  const admin = adminClient().auth.admin;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const user of data.users) {
      if (isTestEmail(user.email)) await admin.deleteUser(user.id);
    }
    if (data.users.length < 200) break;
  }
}
