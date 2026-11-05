-- Solicitudes para borrar datos (bralto.io/eliminar-datos). Llegan del formulario de la página o de Meta
-- (cuando alguien quita la app desde Facebook, Meta llama a /api/meta/eliminar-datos). Cada una tiene un
-- código que la persona usa para ver cómo va. Solo el servidor lee esta tabla (RLS sin políticas).

create table if not exists public.solicitudes_eliminacion (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,                       -- BR-XXXXXXXX, el que ve la persona
  origen text not null check (origen in ('formulario', 'meta')),
  nombre text,                                       -- del formulario
  contacto text,                                     -- correo o WhatsApp, del formulario
  cuenta text,                                       -- usuario de Instagram o Facebook, si lo dio
  detalle text,                                      -- lo que quiera agregar
  meta_usuario text,                                 -- el id que Meta da para la app, si vino de Meta
  estado text not null default 'recibida' check (estado in ('recibida', 'completada')),
  creada_en timestamptz not null default now(),
  completada_en timestamptz
);

create index if not exists solicitudes_eliminacion_estado on public.solicitudes_eliminacion (estado, creada_en);

alter table public.solicitudes_eliminacion enable row level security;
