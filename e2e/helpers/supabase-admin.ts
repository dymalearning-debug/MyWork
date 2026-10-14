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

// `name`: the name Google would give (full_name), from which the public handle and the first and
// last name are built. `metadata`: other account data Google could give (given_name, family_name).
export async function createUser({
  confirmed = true,
  email = testEmail(),
  name,
  metadata,
}: { confirmed?: boolean; email?: string; name?: string; metadata?: Record<string, string> } = {}) {
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: confirmed,
    user_metadata: name || metadata ? { ...(name && { full_name: name }), ...metadata } : undefined,
  });
  if (error) throw error;
  return { id: data.user.id, email, password: TEST_PASSWORD };
}

// Profile of a test account: its handle, whether it is online, its first and last name.
export async function getProfile(id: string) {
  const { data, error } = await adminClient()
    .from("profiles")
    .select("handle, is_online, first_name, last_name")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as { handle: string; is_online: boolean; first_name: string | null; last_name: string | null };
}

// Whether a test account still exists (account deletion).
export async function userExists(id: string) {
  const { data, error } = await adminClient().auth.admin.getUserById(id);
  if (error && error.status !== 404) throw error;
  return !!data.user;
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
      if (!isTestEmail(user.email)) continue;
      // Their images first: the storage is not emptied with the account (docs/profile.md, "Données").
      const storage = adminClient().storage.from("profile-images");
      const { data: files } = await storage.list(user.id, { limit: 1000 });
      if (files?.length) await storage.remove(files.map((file) => `${user.id}/${file.name}`));
      await admin.deleteUser(user.id);
    }
    if (data.users.length < 200) break;
  }
}

// A Supabase client signed in as a test account, as the browser would be: for the database
// functions that act on the signed-in user (the profile content).
export async function signedInClient(user: { email: string; password: string }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("End-to-end tests need the Supabase URL and publishable key (see .env.example).");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.auth.signInWithPassword({ email: user.email, password: user.password });
  if (error) throw error;
  return client;
}

// The profile content of a test account (docs/profile.md), read and changed through the same
// database functions as "Mon profil": what is not given is kept.
export async function getProfileContent(user: { email: string; password: string }) {
  const client = await signedInClient(user);
  const { data, error } = await client.rpc("get_own_profile_content");
  if (error) throw error;
  return data as Record<string, unknown> & { handle: string };
}

export async function saveProfileContent(user: { email: string; password: string }, changes: Record<string, unknown>) {
  const client = await signedInClient(user);
  const { data: current, error: readError } = await client.rpc("get_own_profile_content");
  if (readError) throw readError;
  const content = { ...(current as Record<string, unknown>) };
  for (const key of ["handle", "isOnline", "hasContact"]) delete content[key];
  const { error } = await client.rpc("save_own_profile", { content: { ...content, ...changes } });
  if (error) throw error;
}
