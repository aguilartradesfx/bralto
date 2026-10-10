-- Noticias de IA: una nota diaria publicada sola desde n8n (docs/superpowers/specs/2026-10-09-noticias-ia-design.md)
create table if not exists public.noticias (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo_es text not null,
  resumen_es text not null,
  cuerpo_es text not null,
  imagen_alt_es text not null,
  titulo_en text not null,
  resumen_en text not null,
  cuerpo_en text not null,
  imagen_alt_en text not null,
  fuente_url text not null unique,
  fuente_nombre text not null,
  imagen_url text not null,
  publicada_en timestamptz not null default now(),
  estado text not null default 'publicada' check (estado in ('publicada', 'oculta')),
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

create index if not exists noticias_estado_fecha_idx on public.noticias (estado, publicada_en desc);

create or replace function public.noticias_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizada_en = now();
  return new;
end
$$;

drop trigger if exists noticias_touch on public.noticias;
create trigger noticias_touch before update on public.noticias
  for each row execute function public.noticias_touch();

-- El público solo ve lo publicado; escribe solo la service role (el sitio)
alter table public.noticias enable row level security;
drop policy if exists "noticias publicadas visibles" on public.noticias;
create policy "noticias publicadas visibles" on public.noticias
  for select to anon, authenticated using (estado = 'publicada');

-- Portadas: públicas, solo JPEG, hasta 5 MB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('noticias', 'noticias', true, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
