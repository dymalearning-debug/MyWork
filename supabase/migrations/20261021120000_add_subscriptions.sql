-- Subscriptions (docs/billing.md, "En coulisses"): one row per account, a copy of what Stripe
-- knows about its subscription. Only the server writes it, through the two functions below, which
-- ask for the billing secret (BILLING_SECRET, in Vercel only): the app never needs the Supabase
-- secret key. Only the SHA-256 of the secret is written here; to change the secret, change it in
-- Vercel and its hash in a new migration. Each user reads their own row.
--
-- Access follows the state given by Stripe: trialing, active, or past_due (Stripe tries the
-- payment again, about two weeks) open the private space and the public profile; every other
-- state closes them.
--   - The private space is checked by the app, page by page and action by action.
--   - The public profile goes offline when access ends (profiles.online_paused remembers that it
--     was online), and back online when it comes back: the public functions keep reading is_online.
--   - Writing to the boards, the Drive and the images needs a subscription (restrictive policies).

-- ——— The subscription ———
-- status: null while the account only has a Stripe customer (payment page opened, never paid).
-- cancel_at: end of the access, once a cancellation is asked for (Stripe ends the subscription
-- then). trial_used: one trial per account (docs/billing.md, "Règles"). card_*: the card of the
-- subscription, as shown in the Settings. unpaid_*: the last refused payment, while Stripe tries
-- again. livemode: a subscription of Stripe's test mode or a real one (local development and
-- production share this database).
create table public.subscriptions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  customer_id text unique,
  subscription_id text unique,
  livemode boolean not null default false,
  plan text check (plan in ('monthly', 'yearly')),
  status text check (status in (
    'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused'
  )),
  subscription_created_at timestamptz,
  trial_end timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  ended_at timestamptz,
  trial_used boolean not null default false,
  card_brand text,
  card_last4 text check (card_last4 ~ '^[0-9]{4}$'),
  card_exp_month smallint check (card_exp_month between 1 and 12),
  card_exp_year smallint,
  unpaid_amount integer check (unpaid_amount >= 0),
  unpaid_at timestamptz,
  next_payment_attempt timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscriptions is 'Copy of the Stripe subscription of each account (docs/billing.md).';

-- The webhook events already handled: each one is handled once, even when Stripe sends it again.
create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

alter table public.profiles add column online_paused boolean not null default false;

-- ——— Access ———

create function public.has_subscription_access(owner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = owner and s.status in ('trialing', 'active', 'past_due')
  );
$$;

-- The same, for the signed-in user (the policies below).
create function public.is_subscribed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_subscription_access((select auth.uid()));
$$;

-- A profile goes online only with a subscription. A profile already online stays so: the owner's
-- account, from before the subscriptions, until its first subscription.
create function public.check_profile_online()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_online and (tg_op = 'INSERT' or not old.is_online) and not public.has_subscription_access(new.id) then
    raise exception 'subscription_required' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger profiles_check_online
  before insert or update of is_online on public.profiles
  for each row execute function public.check_profile_online();

-- Writing needs a subscription: these policies are added to the existing ones (restrictive), for
-- the tables and the files the browser writes itself. Deleting stays possible.
do $$
declare
  written_table text;
begin
  foreach written_table in array array[
    'boards', 'board_lists', 'board_cards', 'board_checklist_items', 'board_card_images', 'drive_items'
  ] loop
    execute format(
      'create policy "Adding needs a subscription" on public.%I as restrictive for insert to authenticated with check ((select public.is_subscribed()))',
      written_table
    );
    execute format(
      'create policy "Changing needs a subscription" on public.%I as restrictive for update to authenticated using ((select public.is_subscribed()))',
      written_table
    );
  end loop;
end;
$$;

create policy "Adding files needs a subscription"
  on storage.objects as restrictive for insert
  to authenticated
  with check (
    bucket_id not in ('profile-images', 'board-images', 'drive-files') or (select public.is_subscribed())
  );

-- ——— Writing, by the server ———

create function public.is_billing_secret(secret text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    encode(extensions.digest(secret, 'sha256'), 'hex') = 'd4170bb35bcb8d092b63f8518ee68b74e45696b2c23e022bdf3215e300e118c5',
    false
  );
$$;

-- The Stripe customer of an account, created the first time it opens the payment page. A
-- customer of the other mode (a test subscription, once the real keys are in place) starts the
-- row again: the test subscription and its trial do not count in the real mode.
create function public.save_billing_customer(owner uuid, customer text, live boolean, secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_billing_secret(secret) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  delete from public.subscriptions where user_id = owner and livemode <> live;
  insert into public.subscriptions (user_id, customer_id, livemode)
  values (owner, customer, live)
  on conflict (user_id) do update set customer_id = excluded.customer_id, updated_at = now();
end;
$$;

-- Saves the subscription as Stripe gives it now (snapshot, written by src/lib/billing/snapshot.ts),
-- after the payment page, a webhook event or a return from Stripe's portal, and draws the
-- consequences of the change:
--   - a new subscription: the welcome email;
--   - a cancellation asked for: the goodbye email;
--   - the end of the access: the public profile goes offline, the bookings to come are cancelled
--     (the guests get the usual email), and the email "Abonnement terminé";
--   - access back: the public profile goes back online if it was;
--   - "customer.subscription.trial_will_end" (3 days before the end of the trial): its email.
-- event_id: the webhook event, handled once (null for the other calls). A late event about an
-- older subscription than the saved one is ignored.
-- Returns the emails to send and what they need, and the booking emails prepared.
create function public.sync_subscription(owner uuid, snapshot jsonb, event_id text, event_type text, secret text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous public.subscriptions;
  saved public.subscriptions;
  owner_profile public.profiles;
  owner_name text;
  had_access boolean;
  has_access boolean;
  emails text[] := '{}';
  booking public.bookings;
  email_id uuid;
  booking_email_ids uuid[] := '{}';
begin
  if not public.is_billing_secret(secret) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if event_id is not null then
    insert into public.stripe_events (id, type) values (event_id, coalesce(event_type, '')) on conflict do nothing;
    if not found then
      return jsonb_build_object('status', 'duplicate');
    end if;
  end if;
  select * into owner_profile from public.profiles where id = owner;
  if not found then
    return jsonb_build_object('status', 'unknown_user');
  end if;

  select * into previous from public.subscriptions where user_id = owner for update;
  if previous.subscription_id is not null
    and previous.subscription_id <> snapshot ->> 'subscriptionId'
    and previous.subscription_created_at > (snapshot ->> 'createdAt')::timestamptz then
    return jsonb_build_object('status', 'stale');
  end if;
  had_access := coalesce(previous.status in ('trialing', 'active', 'past_due'), false);

  insert into public.subscriptions as s (
    user_id, customer_id, subscription_id, livemode, plan, status, subscription_created_at, trial_end,
    current_period_end, cancel_at, ended_at, trial_used, card_brand, card_last4, card_exp_month,
    card_exp_year, unpaid_amount, unpaid_at, next_payment_attempt
  )
  values (
    owner,
    snapshot ->> 'customerId',
    snapshot ->> 'subscriptionId',
    coalesce((snapshot ->> 'livemode')::boolean, false),
    snapshot ->> 'plan',
    snapshot ->> 'status',
    (snapshot ->> 'createdAt')::timestamptz,
    (snapshot ->> 'trialEnd')::timestamptz,
    (snapshot ->> 'currentPeriodEnd')::timestamptz,
    (snapshot ->> 'cancelAt')::timestamptz,
    (snapshot ->> 'endedAt')::timestamptz,
    true,
    snapshot -> 'card' ->> 'brand',
    snapshot -> 'card' ->> 'last4',
    (snapshot -> 'card' ->> 'expMonth')::smallint,
    (snapshot -> 'card' ->> 'expYear')::smallint,
    (snapshot -> 'unpaid' ->> 'amount')::integer,
    (snapshot -> 'unpaid' ->> 'at')::timestamptz,
    (snapshot -> 'unpaid' ->> 'nextAttempt')::timestamptz
  )
  on conflict (user_id) do update set
    customer_id = excluded.customer_id,
    subscription_id = excluded.subscription_id,
    livemode = excluded.livemode,
    plan = excluded.plan,
    status = excluded.status,
    subscription_created_at = excluded.subscription_created_at,
    trial_end = excluded.trial_end,
    current_period_end = excluded.current_period_end,
    cancel_at = excluded.cancel_at,
    ended_at = excluded.ended_at,
    trial_used = true,
    card_brand = excluded.card_brand,
    card_last4 = excluded.card_last4,
    card_exp_month = excluded.card_exp_month,
    card_exp_year = excluded.card_exp_year,
    unpaid_amount = excluded.unpaid_amount,
    unpaid_at = excluded.unpaid_at,
    next_payment_attempt = excluded.next_payment_attempt,
    updated_at = now()
  returning * into saved;
  has_access := saved.status in ('trialing', 'active', 'past_due');

  if has_access and previous.subscription_id is distinct from saved.subscription_id then
    emails := emails || 'welcome'::text;
  end if;
  if has_access and saved.cancel_at is not null and previous.cancel_at is null
    and previous.subscription_id = saved.subscription_id then
    emails := emails || 'goodbye'::text;
  end if;
  if has_access and event_type = 'customer.subscription.trial_will_end' and saved.status = 'trialing' then
    emails := emails || 'trial_ending'::text;
  end if;

  if had_access and not has_access then
    emails := emails || 'ended'::text;
    update public.profiles set online_paused = is_online, is_online = false where id = owner;
    owner_name := coalesce(
      nullif(btrim(coalesce(owner_profile.first_name, '') || ' ' || coalesce(owner_profile.last_name, '')), ''),
      owner_profile.handle
    );
    for booking in
      update public.bookings b
      set status = 'cancelled', cancelled_by = 'owner', cancel_message = null, cancelled_at = now(), is_seen = true
      where b.user_id = owner and b.status = 'confirmed' and b.start_at > now()
      returning b.*
    loop
      insert into public.booking_emails (user_id, booking_id, template, recipient, data)
      values (owner, booking.id, 'guest_cancelled', booking.guest_email, jsonb_build_object(
        'ownerName', owner_name, 'guestName', booking.guest_name, 'startAt', booking.start_at,
        'endAt', booking.end_at, 'timeZone', booking.guest_time_zone, 'message', null,
        'path', '/' || owner_profile.handle || '/booking/' || booking.code
      ))
      returning id into email_id;
      booking_email_ids := booking_email_ids || email_id;
    end loop;
  elsif has_access and not had_access then
    update public.profiles set is_online = true, online_paused = false where id = owner and online_paused;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'emails', to_jsonb(emails),
    'bookingEmailIds', to_jsonb(booking_email_ids),
    'recipient', owner_profile.email,
    'firstName', owner_profile.first_name,
    'handle', owner_profile.handle,
    'bookingsAfterEnd', (
      select count(*) from public.bookings b
      where b.user_id = owner and b.status = 'confirmed' and saved.cancel_at is not null and b.start_at >= saved.cancel_at
    )
  );
end;
$$;

-- ——— Rights ———
-- RLS: each user reads their own subscription; nobody writes it through the API, except the two
-- functions above. The events: no access through the API. The administrator role (end-to-end
-- tests, which give their accounts a test subscription) has full access.
alter table public.subscriptions enable row level security;
alter table public.stripe_events enable row level security;

create policy "Users can read their own subscription"
  on public.subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.subscriptions, public.stripe_events from anon, authenticated;
grant select on public.subscriptions to authenticated;
grant select, insert, update, delete on public.subscriptions, public.stripe_events to service_role;

revoke execute on function public.has_subscription_access(uuid) from public, anon, authenticated;
revoke execute on function public.is_subscribed() from public, anon;
revoke execute on function public.check_profile_online() from public, anon, authenticated;
revoke execute on function public.is_billing_secret(text) from public, anon, authenticated;
revoke execute on function public.save_billing_customer(uuid, text, boolean, text) from public;
revoke execute on function public.sync_subscription(uuid, jsonb, text, text, text) from public;
grant execute on function public.is_subscribed() to authenticated;
grant execute on function public.save_billing_customer(uuid, text, boolean, text) to anon, authenticated;
grant execute on function public.sync_subscription(uuid, jsonb, text, text, text) to anon, authenticated;
