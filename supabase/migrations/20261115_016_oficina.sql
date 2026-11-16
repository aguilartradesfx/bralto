-- «La Oficina de Knox»: el reloj de marcar de los agentes automáticos de Bralto.
-- Catálogo de agentes, marcas (lo que cada uno empieza, termina, entrega o falla) y el estado de la oficina (modo dormir).
-- Aditiva. Solo el servidor lee y escribe: RLS sin políticas y sin permisos para anon ni authenticated.

create table if not exists public.oficina_agentes (
  id text primary key,
  nombre text not null,
  oficio text not null,
  area text not null,
  puesto int not null,
  aspecto jsonb not null default '{}'::jsonb,
  personalidad text not null default '',
  frase text not null default '',
  horario text,
  cada_minutos int,
  ruta text,
  donde text not null check (donde in ('servidor', 'sitio', 'zernio', 'asistente', 'mano')),
  estado_fijo text check (estado_fijo in ('pendiente', 'pedido')),
  despierto_siempre boolean not null default false,
  dura_min int not null default 10,
  ultima_revision timestamptz,
  activo boolean not null default true
);

create table if not exists public.oficina_marcas (
  id uuid primary key default gen_random_uuid(),
  agente text not null references public.oficina_agentes(id),
  tipo text not null check (tipo in ('empieza', 'termina', 'falla', 'pasa', 'entrega', 'publica', 'saltada')),
  para text,
  texto text not null,
  enlace text,
  ref_tabla text,
  ref_id text,
  dura_seg int,
  extra jsonb,
  visto_en timestamptz,
  creado_en timestamptz not null default now()
);

create index if not exists oficina_marcas_creado on public.oficina_marcas (creado_en desc);
create index if not exists oficina_marcas_agente on public.oficina_marcas (agente, creado_en desc);

create table if not exists public.oficina_estado (
  id int primary key,
  dormida boolean not null default false,
  desde timestamptz,
  por text,
  actualizado_en timestamptz not null default now()
);

insert into public.oficina_estado (id) values (1), (2) on conflict (id) do nothing;

create or replace view public.oficina_numeros with (security_invoker = true) as
select
  agente,
  count(*) filter (where tipo = 'termina') as tareas,
  coalesce(sum(dura_seg) filter (where tipo = 'termina'), 0) as segundos,
  max(creado_en) filter (where tipo = 'falla') as ultima_falla,
  min(creado_en) as primera
from public.oficina_marcas
group by agente;

alter table public.oficina_agentes enable row level security;
alter table public.oficina_marcas enable row level security;
alter table public.oficina_estado enable row level security;
revoke all on public.oficina_agentes from anon, authenticated;
revoke all on public.oficina_marcas from anon, authenticated;
revoke all on public.oficina_estado from anon, authenticated;
revoke all on public.oficina_numeros from anon, authenticated;
