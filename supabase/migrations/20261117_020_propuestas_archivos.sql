-- Propuestas: los PDF se guardan en el panel, cada propuesta tiene estado, monto y a quién se envió, y la tabla se
-- cierra al público.

-- La tabla tenía RLS apagado y anon con todos los permisos: con la clave pública cualquiera podía leer (o borrar)
-- las propuestas. El panel, la API y la página pública leen con service role, que no pasa por RLS. Sin políticas:
-- nadie más entra.
alter table public.generated_proposals enable row level security;

-- Una propuesta puede ser solo PDF (sin página web)
alter table public.generated_proposals alter column html_content drop not null;

alter table public.generated_proposals
  add column if not exists status text not null default 'enviada',
  add column if not exists amount text,
  add column if not exists sent_to text,
  -- Para la lista del panel sin traer todo el HTML
  add column if not exists has_page boolean generated always as (html_content is not null) stored;

alter table public.generated_proposals drop constraint if exists generated_proposals_status_check;
alter table public.generated_proposals
  add constraint generated_proposals_status_check check (status in ('borrador', 'enviada', 'aceptada', 'rechazada'));

-- Los PDF de cada propuesta (en el bucket privado «propuestas»)
create table if not exists public.proposal_files (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.generated_proposals (id) on delete cascade,
  name text not null,
  label text not null,
  path text not null unique,
  bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists proposal_files_proposal_idx on public.proposal_files (proposal_id, created_at);

alter table public.proposal_files enable row level security;
revoke all on public.proposal_files from anon, authenticated;

-- Privado, hasta 50 MB por archivo y solo PDF. El navegador sube directo con una URL firmada.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('propuestas', 'propuestas', false, 52428800, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
