-- ──────────────────────────────────────────────────────────────────────
-- Schema for donation tracking — Amigos del Banco de Alimentos Durango
--
-- Three tables + one singleton aggregate:
--   donors          one row per unique donor email
--   donations       one row per successful payment (one-time or recurring charge)
--   subscriptions   one row per active/past recurring plan (Stripe Subscription)
--   totals          singleton row holding cached lifetime aggregates
--
-- Aggregates (donor.total_donated_cents, totals.raised_cents, donation_count)
-- are maintained by triggers, so the webhook only needs to insert raw rows.
--
-- RLS is enabled on all tables. Anon key can only SELECT public rows
-- (donors with list_public=true, the totals row). All writes go through
-- the service role key from the Stripe webhook handler.
-- ──────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── donors ────────────────────────────────────────────────────────────
create table public.donors (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null unique,
  display_name          text,
  list_public           boolean not null default false,
  stripe_customer_id    text unique,
  total_donated_cents   bigint not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index donors_list_public_total_idx
  on public.donors (total_donated_cents desc)
  where list_public = true;

-- ── donations ─────────────────────────────────────────────────────────
create table public.donations (
  id                            uuid primary key default gen_random_uuid(),
  donor_id                      uuid not null references public.donors(id) on delete cascade,
  amount_cents                  bigint not null check (amount_cents > 0),
  currency                      text not null default 'mxn',
  kind                          text not null check (kind in ('once','recurring')),
  status                        text not null,
  stripe_payment_intent_id      text unique,
  stripe_checkout_session_id    text,
  stripe_invoice_id             text unique,
  stripe_subscription_id        text,
  created_at                    timestamptz not null default now()
);

create index donations_donor_created_idx
  on public.donations (donor_id, created_at desc);

-- ── subscriptions ─────────────────────────────────────────────────────
create table public.subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  donor_id                  uuid not null references public.donors(id) on delete cascade,
  stripe_subscription_id    text not null unique,
  amount_cents              bigint not null,
  currency                  text not null default 'mxn',
  status                    text not null,
  current_period_end        timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ── totals (singleton) ────────────────────────────────────────────────
create table public.totals (
  id              int primary key default 1,
  raised_cents    bigint not null default 0,
  donor_count     int not null default 0,
  donation_count  int not null default 0,
  updated_at      timestamptz not null default now(),
  constraint singleton_totals check (id = 1)
);
insert into public.totals (id) values (1);

-- ── Aggregate triggers ───────────────────────────────────────────────
create or replace function public.donations_after_insert()
returns trigger language plpgsql as $$
begin
  if new.status = 'succeeded' then
    update public.donors
       set total_donated_cents = total_donated_cents + new.amount_cents,
           updated_at = now()
     where id = new.donor_id;

    update public.totals
       set raised_cents = raised_cents + new.amount_cents,
           donation_count = donation_count + 1,
           updated_at = now()
     where id = 1;
  end if;
  return new;
end;
$$;

create trigger donations_after_insert_trg
after insert on public.donations
for each row execute function public.donations_after_insert();

create or replace function public.donors_after_insert()
returns trigger language plpgsql as $$
begin
  update public.totals
     set donor_count = donor_count + 1,
         updated_at = now()
   where id = 1;
  return new;
end;
$$;

create trigger donors_after_insert_trg
after insert on public.donors
for each row execute function public.donors_after_insert();

-- ── Row Level Security ────────────────────────────────────────────────
alter table public.donors        enable row level security;
alter table public.donations     enable row level security;
alter table public.subscriptions enable row level security;
alter table public.totals        enable row level security;

-- Public leaderboard: anon can read donors that opted in
create policy "donors public list readable"
  on public.donors for select
  using (list_public = true);

-- Totals row always readable
create policy "totals readable"
  on public.totals for select
  using (true);

-- donations / subscriptions: no anon access. Service role bypasses RLS.
