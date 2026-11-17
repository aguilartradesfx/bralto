-- «Guiones» del panel (admin.bralto.io/guiones): el guion que la tarea de la noche escribe para que Alejandro lo grabe a
-- cámara (uno por tema del día), con sus 5 ganchos, y los videos que él sube desde el teléfono al bucket privado
-- «crudos» (directo a Storage con una URL firmada). Después el servidor los edita y programa las versiones de prueba.
-- Lo carga scripts/guiones/cargar.ts; las reglas están en lib/guiones.
-- Aditiva e idempotente. Solo el servidor lee y escribe: RLS sin políticas y sin permisos para anon ni authenticated.

create table if not exists public.redes_guiones (
  id uuid primary key default gen_random_uuid(),
  dia date not null,                            -- el día del tema (publicaciones/<AAAA-MM-DD>/guion/guion.json)
  titulo text not null check (btrim(titulo) <> ''),
  tema text not null default '',
  comenta text,                                 -- la palabra del «Comenta», en mayúsculas
  guia text,                                    -- el slug de la guía
  duracion_s int check (duracion_s > 0),
  lineas jsonb not null default '[]'::jsonb check (jsonb_typeof(lineas) = 'array'),   -- [{ vista, dice, pantalla }]
  ganchos jsonb not null default '[]'::jsonb check (jsonb_typeof(ganchos) = 'array'), -- [{ tipo, dice }]
  estado text not null default 'listo'
    check (estado in ('listo', 'subido', 'editando', 'programado', 'error', 'descartado')),
  videos jsonb not null default '[]'::jsonb check (jsonb_typeof(videos) = 'array'),   -- [{ ruta, nombre, bytes, subido_en }], ruta adentro de «crudos»
  carpeta text,                                 -- la carpeta del guion en el servidor
  detalle text,                                 -- por qué falló, o una nota
  grabado_en timestamptz,
  subido_en timestamptz,                        -- cuándo llegó el último video
  editado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint redes_guiones_dia_titulo unique (dia, titulo)
);

-- «Te toca» de la Oficina: los «listo», el más nuevo primero (la lista del panel usa el índice del unique, por día)
create index if not exists redes_guiones_estado on public.redes_guiones (estado, dia desc);

alter table public.redes_guiones enable row level security;
revoke all on public.redes_guiones from anon, authenticated;

-- actualizado_en al día en cada cambio: lo usan las escrituras condicionales (dos videos que terminan a la vez se suman
-- uno encima del otro) y el comando de la noche para saber si el guion era nuevo
create or replace function public.redes_guiones_actualizado() returns trigger
  language plpgsql set search_path = '' as $$
begin
  new.actualizado_en = now();
  return new;
end
$$;

drop trigger if exists redes_guiones_actualizado on public.redes_guiones;
create trigger redes_guiones_actualizado before update on public.redes_guiones
  for each row execute function public.redes_guiones_actualizado();

revoke execute on function public.redes_guiones_actualizado() from public, anon, authenticated;

-- Los videos crudos: privado, hasta 2 GB por archivo y solo video. El límite general de subida del proyecto
-- (configuración de Storage) se sube aparte.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('crudos', 'crudos', false, 2147483648, array['video/quicktime', 'video/mp4', 'video/x-m4v', 'video/webm'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
