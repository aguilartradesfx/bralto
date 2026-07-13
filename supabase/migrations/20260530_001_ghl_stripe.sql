-- ============================================================
-- Bralto: GHL OAuth tokens + Stripe webhook idempotency
-- Run via `supabase db push` or paste into Supabase SQL editor.
-- ============================================================

-- 1. GHL OAuth tokens
--    Two app types live here:
--    - Agency app  → user_type='Company', location_id=null   (1 row per company)
--    - Sub-account → user_type='Location', location_id=<loc> (1 row per installed location)
-- ============================================================
create table if not exists ghl_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  location_id text,
  user_type text not null
    check (user_type in ('Company', 'Location')),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique per (company, user_type, location_id). Postgres treats NULL as
-- distinct in plain unique constraints, so we use a partial-index pattern:
-- one Company row per company, one Location row per (company, location).
create unique index if not exists uq_ghl_company_token
  on ghl_oauth_tokens(company_id) where user_type = 'Company';
create unique index if not exists uq_ghl_location_token
  on ghl_oauth_tokens(company_id, location_id) where user_type = 'Location';

create index if not exists idx_ghl_tokens_company on ghl_oauth_tokens(company_id);
create index if not exists idx_ghl_tokens_location on ghl_oauth_tokens(location_id);

alter table ghl_oauth_tokens enable row level security;
-- No policies on purpose: only service_role (which bypasses RLS) should touch tokens.

-- 2. Stripe events log (idempotency + audit trail)
-- ============================================================
create table if not exists stripe_events (
  id text primary key,                          -- Stripe event id (evt_*)
  type text not null,
  livemode boolean not null default false,
  payload jsonb not null,
  product_kind text,                            -- inferred from metadata.product_kind
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz default now()
);

create index if not exists idx_stripe_events_type on stripe_events(type);
create index if not exists idx_stripe_events_processed on stripe_events(processed_at);
create index if not exists idx_stripe_events_kind on stripe_events(product_kind);

alter table stripe_events enable row level security;
-- No policies on purpose: only service_role should write/read events.

-- 3. SaaS customers (links Stripe customer ↔ GHL sub-account)
-- ============================================================
create table if not exists saas_customers (
  id uuid primary key default gen_random_uuid(),
  stripe_customer_id text not null,
  stripe_subscription_id text,
  ghl_location_id text,
  ghl_contact_id text,
  ghl_plan_id text,
  email text,
  business_name text,
  status text not null default 'active'
    check (status in ('active', 'past_due', 'cancelled', 'failed')),
  raw_checkout_session jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (stripe_customer_id, stripe_subscription_id)
);

create index if not exists idx_saas_stripe_cust on saas_customers(stripe_customer_id);
create index if not exists idx_saas_ghl_loc on saas_customers(ghl_location_id);

alter table saas_customers enable row level security;
create policy "authenticated_read_saas_customers" on saas_customers
  for select to authenticated using (true);

-- 4. updated_at trigger (reuse function if it already exists)
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists ghl_oauth_tokens_updated_at on ghl_oauth_tokens;
create trigger ghl_oauth_tokens_updated_at
  before update on ghl_oauth_tokens
  for each row execute function update_updated_at();

drop trigger if exists saas_customers_updated_at on saas_customers;
create trigger saas_customers_updated_at
  before update on saas_customers
  for each row execute function update_updated_at();
