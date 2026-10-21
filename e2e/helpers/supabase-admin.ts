import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
// `subscription`: the state of its test subscription (by default in its trial), "none" for an
// account that never subscribed (docs/billing.md, "Tests").
export async function createUser({
  confirmed = true,
  email = testEmail(),
  name,
  metadata,
  subscription = "trialing",
}: {
  confirmed?: boolean;
  email?: string;
  name?: string;
  metadata?: Record<string, string>;
  subscription?: TestSubscription;
} = {}) {
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: confirmed,
    user_metadata: name || metadata ? { ...(name && { full_name: name }), ...metadata } : undefined,
  });
  if (error) throw error;
  if (subscription !== "none") await setSubscription(data.user.id, subscription);
  return { id: data.user.id, email, password: TEST_PASSWORD };
}

// The test subscriptions, written straight into the database as Stripe's test mode would leave
// them, without Stripe (no customer: the buttons to Stripe's portal answer that it is unavailable).
// Every account needs one to open the private space: there is no free access.
export type TestSubscription = "trialing" | "active" | "canceling" | "past_due" | "ended" | "none";

const DAY = 86_400_000;

export async function setSubscription(id: string, state: TestSubscription, changes: Record<string, unknown> = {}) {
  const admin = adminClient();
  if (state === "none") {
    const { error } = await admin.from("subscriptions").delete().eq("user_id", id);
    if (error) throw error;
    return;
  }
  const now = Date.now();
  const iso = (days: number) => new Date(now + days * DAY).toISOString();
  const row = {
    user_id: id,
    livemode: false,
    plan: "yearly",
    status: { trialing: "trialing", active: "active", canceling: "active", past_due: "past_due", ended: "canceled" }[state],
    subscription_created_at: iso(state === "trialing" ? 0 : -30),
    trial_end: state === "trialing" ? iso(7) : null,
    current_period_end: state === "trialing" ? iso(7) : iso(335),
    cancel_at: state === "canceling" ? iso(335) : null,
    ended_at: state === "ended" ? iso(0) : null,
    trial_used: true,
    card_brand: "visa",
    card_last4: "4242",
    card_exp_month: 8,
    card_exp_year: 2030,
    unpaid_amount: state === "past_due" ? 5000 : null,
    unpaid_at: state === "past_due" ? iso(-1) : null,
    next_payment_attempt: state === "past_due" ? iso(2) : null,
    ...changes,
  };
  const { error } = await admin.from("subscriptions").upsert(row);
  if (error) throw error;
}

export async function getSubscription(id: string) {
  const { data, error } = await adminClient().from("subscriptions").select("*").eq("user_id", id).maybeSingle();
  if (error) throw error;
  return data as Record<string, unknown> | null;
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
      // Their images first: the storage is not emptied with the account (docs/profile.md and
      // docs/boards.md, "Données"), and their Drive files (docs/drive.md).
      for (const bucket of ["profile-images", "board-images", "drive-files"]) {
        const storage = adminClient().storage.from(bucket);
        const { data: files } = await storage.list(user.id, { limit: 1000 });
        if (files?.length) await storage.remove(files.map((file) => `${user.id}/${file.name}`));
      }
      await admin.deleteUser(user.id);
    }
    if (data.users.length < 200) break;
  }
}

// A Supabase client signed in as a test account, as the browser would be: for the database
// functions that act on the signed-in user (the profile content).
// Signed in once per account and reused: Supabase limits the sign-ins from one address (those of
// GitHub run every test), and some tests change the profile many times.
const signedIn = new Map<string, Promise<SupabaseClient>>();

export function signedInClient(user: { email: string; password: string }): Promise<SupabaseClient> {
  const cacheKey = `${user.email}\n${user.password}`;
  let client = signedIn.get(cacheKey);
  if (!client) {
    client = signIn(user);
    signedIn.set(cacheKey, client);
    // A failed sign-in is not kept: the next call tries again.
    client.catch(() => signedIn.delete(cacheKey));
  }
  return client;
}

async function signIn(user: { email: string; password: string }) {
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
