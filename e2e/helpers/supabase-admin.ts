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

// `name`: the name Google would give (full_name), from which the public handle is built.
export async function createUser({
  confirmed = true,
  email = testEmail(),
  name,
}: { confirmed?: boolean; email?: string; name?: string } = {}) {
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: confirmed,
    user_metadata: name ? { full_name: name } : undefined,
  });
  if (error) throw error;
  return { id: data.user.id, email, password: TEST_PASSWORD };
}

// Public profile of a test account: its handle and whether it is online.
export async function getProfile(id: string) {
  const { data, error } = await adminClient().from("profiles").select("handle, is_online").eq("id", id).single();
  if (error) throw error;
  return data as { handle: string; is_online: boolean };
}

export async function setProfileOnline(id: string, online: boolean) {
  const { error } = await adminClient().from("profiles").update({ is_online: online }).eq("id", id);
  if (error) throw error;
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
