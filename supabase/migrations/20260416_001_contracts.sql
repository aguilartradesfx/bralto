-- ============================================================
-- Bralto Contract System — Migration v1
-- Run this in your Supabase SQL Editor or via `supabase db push`
-- ============================================================

-- 1. CLIENTS TABLE
-- ============================================================
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  empresa_nombre text not null,
  cedula_juridica text,
  representante_nombre text,
  correo_notificaciones text,
  notas text,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

alter table clients enable row level security;

create policy "authenticated_read_clients" on clients
  for select to authenticated using (true);

create policy "authenticated_insert_clients" on clients
  for insert to authenticated with check (true);

create policy "authenticated_update_clients" on clients
  for update to authenticated using (true);

-- 2. CONTRACTS TABLE
-- ============================================================
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'viewed', 'signed_by_client', 'signed_fully', 'cancelled')),

  -- All editable form data (see contract_schema.json)
  data jsonb not null,

  -- Template version used to render this contract (for backward compat)
  template_version text not null default 'v1',

  client_id uuid references clients(id) on delete restrict,

  -- Signature evidence (populated when client signs)
  signature_client_data text,
  signature_client_timestamp timestamptz,
  signature_client_ip inet,
  signature_client_user_agent text,
  signature_client_accepted_terms boolean default false,

  signature_bralto_data text,
  signature_bralto_timestamp timestamptz,

  -- Metadata
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  sent_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,

  -- PDF stored in Supabase Storage (Phase 2)
  signed_pdf_url text
);

create index if not exists idx_contracts_slug on contracts(slug);
create index if not exists idx_contracts_client on contracts(client_id);
create index if not exists idx_contracts_status on contracts(status);
create index if not exists idx_contracts_created_at on contracts(created_at desc);
create index if not exists idx_contracts_created_by on contracts(created_by);

alter table contracts enable row level security;

create policy "authenticated_read_contracts" on contracts
  for select to authenticated using (true);

create policy "authenticated_insert_contracts" on contracts
  for insert to authenticated with check (true);

create policy "authenticated_update_contracts" on contracts
  for update to authenticated using (true);

-- 3. CONTRACT EVENTS TABLE (audit log)
-- ============================================================
create table if not exists contract_events (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  event_type text not null
    check (event_type in ('created', 'sent', 'opened', 'viewed', 'signed', 'cancelled', 'downloaded')),
  metadata jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_events_contract on contract_events(contract_id);
create index if not exists idx_events_type on contract_events(event_type);
create index if not exists idx_events_created_at on contract_events(created_at desc);

alter table contract_events enable row level security;

create policy "authenticated_read_events" on contract_events
  for select to authenticated using (true);

create policy "authenticated_insert_events" on contract_events
  for insert to authenticated with check (true);

-- 4. updated_at TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger contracts_updated_at
  before update on contracts
  for each row execute function update_updated_at();

-- 5. RPC: get_contract_by_slug
-- Public function to fetch a single contract by slug.
-- SECURITY DEFINER bypasses RLS but the function itself restricts
-- what fields are returned — never exposes created_by, client_id,
-- signature IP/UA, or any other internal metadata.
-- Only returns contracts in publicly-accessible statuses.
-- ============================================================
create or replace function get_contract_by_slug(p_slug text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  select json_build_object(
    'slug',             c.slug,
    'status',           c.status,
    'data',             c.data,
    'template_version', c.template_version,
    'signed_pdf_url',   c.signed_pdf_url,
    'signed_at',        c.signed_at
  )
  into result
  from contracts c
  where c.slug = p_slug
    and c.status in ('sent', 'viewed', 'signed_by_client', 'signed_fully');

  return result;
end;
$$;

-- Grant anon role execute permission so public pages can call the RPC
grant execute on function get_contract_by_slug(text) to anon;
