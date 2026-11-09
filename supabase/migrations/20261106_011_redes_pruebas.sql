-- Reels de prueba de Instagram (Trial Reels): cada reel sale en 5 versiones que se le enseñan primero a gente
-- que no sigue la cuenta. A las 72 h, /api/cron/pruebas lee cómo le fue a cada una, se queda con la ganadora,
-- borra las demás y avisa por Telegram. Una prueba es un grupo (redes_pruebas) de 5 filas de
-- redes_publicaciones. Aditiva. Solo el servidor toca las tablas (RLS sin políticas).

create table if not exists public.redes_pruebas (
  grupo uuid primary key default gen_random_uuid(),
  titulo text not null,
  origen text not null default 'ia' check (origen in ('ia', 'propio')),  -- reel hecho con IA o video propio
  estado text not null default 'programada'
    check (estado in ('programada', 'corriendo', 'decidiendo', 'decidida', 'error', 'cancelada')),
  facebook boolean not null default true,       -- la ganadora también sale en la página de Facebook
  decidir_en timestamptz,                       -- 72 h después de que salió la última versión
  ganadora uuid,                                -- la fila de redes_publicaciones que ganó
  resultado jsonb not null default '{}',        -- métricas, borradas, Facebook y aviso: un reintento no repite
  intentos int not null default 0,
  ultimo_error text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists redes_pruebas_estado on public.redes_pruebas (estado, decidir_en);

alter table public.redes_pruebas enable row level security;
revoke all on public.redes_pruebas from anon, authenticated;

create or replace function public.redes_pruebas_actualizado() returns trigger
  language plpgsql set search_path = '' as $$
begin
  new.actualizado_en = now();
  return new;
end
$$;

drop trigger if exists redes_pruebas_actualizado on public.redes_pruebas;
create trigger redes_pruebas_actualizado before update on public.redes_pruebas
  for each row execute function public.redes_pruebas_actualizado();

alter table public.redes_publicaciones
  add column if not exists prueba boolean not null default false,
  add column if not exists grupo uuid references public.redes_pruebas (grupo),
  add column if not exists version smallint check (version between 1 and 5),
  add column if not exists gancho jsonb;          -- {tipo, frase, pantalla}: qué cambia en el inicio

-- Una versión de prueba es un reel de un grupo, sin collab, sin Facebook y sin historias
alter table public.redes_publicaciones drop constraint if exists redes_publicaciones_prueba;
alter table public.redes_publicaciones add constraint redes_publicaciones_prueba check (
  not prueba or (
    tipo = 'reel' and grupo is not null and version is not null
    and colaborador is null and facebook = false and cardinality(historias) = 0
  )
);

create unique index if not exists redes_publicaciones_grupo_version
  on public.redes_publicaciones (grupo, version) where grupo is not null;

-- Un resumen de los domingos por día: si Vercel entrega el cron dos veces, el segundo no manda nada
create table if not exists public.redes_pruebas_resumenes (
  dia date primary key,
  enviado_en timestamptz not null default now()
);

alter table public.redes_pruebas_resumenes enable row level security;
revoke all on public.redes_pruebas_resumenes from anon, authenticated;
