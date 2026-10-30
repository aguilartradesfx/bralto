-- Guías con candado (bralto.io/es/guias/<slug>): lo abierto se lee gratis y lo bloqueado se abre
-- al dejar nombre, correo y WhatsApp. Solo el servidor lee estas tablas (RLS sin políticas):
-- con la clave anónima no se puede leer la parte bloqueada ni los contactos.

create table if not exists public.guias (
  slug text primary key,
  palabra text not null,                     -- la palabra del «Comenta» (JARVIS)
  titulo text not null,
  resumen text not null,
  etiqueta text not null,
  incluye jsonb not null default '[]',       -- lo que trae la parte bloqueada, para la tarjeta del candado
  fuente_nombre text,
  fuente_url text,
  imagen_url text,
  abierto jsonb not null default '[]',       -- bloques que se ven sin registrarse
  bloqueado jsonb not null default '[]',     -- bloques que se abren con el registro
  publicada boolean not null default false,
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

create table if not exists public.guias_contactos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  correo text not null,                      -- en minúsculas
  whatsapp text not null,                    -- solo dígitos, con + al inicio
  guia text not null references public.guias (slug),
  origen text not null default 'web' check (origen in ('ig', 'fb', 'web')),
  acepta boolean not null,
  creado_en timestamptz not null default now(),
  unique (correo, guia)
);

create index if not exists guias_contactos_correo on public.guias_contactos (correo);

alter table public.guias enable row level security;
alter table public.guias_contactos enable row level security;
