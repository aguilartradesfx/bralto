-- «La Oficina de Knox» v2: fotos, foro, ideas, chat de la sala, rondas de la tertulia, lugar de cada Knox y semana.
-- Aditiva e idempotente. Solo el servidor lee y escribe: RLS sin políticas y sin permisos para anon ni authenticated.

alter table public.oficina_agentes add column if not exists lugar text check (lugar is null or lugar ~ '^(/[a-z0-9]|https://)');
alter table public.lab_ideas add column if not exists grabada_en timestamptz;

create table if not exists public.oficina_fotos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('retrato','grupo')),
  agentes text[] not null check (cardinality(agentes) between 1 and 4),
  ruta text unique,
  escena jsonb,
  estado text not null default 'lista' check (estado in ('pendiente','lista','falla')),
  detalle text,
  intentada_en timestamptz,
  creada_en timestamptz not null default now()
);

create table if not exists public.oficina_posts (
  id uuid primary key default gen_random_uuid(),
  de text not null references public.oficina_agentes(id),
  tipo text not null check (tipo in ('nota','foto','debate','idea')),
  titulo text not null,
  texto text not null,
  foto_id uuid references public.oficina_fotos(id) on delete set null,
  likes int not null default 0 check (likes >= 0),
  te_gusta boolean not null default false,
  idea_id uuid, -- sin llave foránea: oficina_ideas.post_id ya apunta al revés
  mostrar_desde timestamptz not null,
  creado_en timestamptz not null default now()
);

create table if not exists public.oficina_ideas (
  id uuid primary key default gen_random_uuid(),
  texto text not null,
  por_que text not null,
  de text not null references public.oficina_agentes(id),
  post_id uuid references public.oficina_posts(id) on delete set null,
  estado text not null default 'nueva' check (estado in ('nueva','sirve','no_va')),
  mostrar_desde timestamptz not null,
  creada_en timestamptz not null default now(),
  decidida_en timestamptz
);

create table if not exists public.oficina_comentarios (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.oficina_posts(id) on delete cascade,
  de text not null references public.oficina_agentes(id),
  texto text not null,
  en_respuesta_a uuid references public.oficina_comentarios(id) on delete cascade,
  idea_id uuid references public.oficina_ideas(id) on delete set null,
  mostrar_desde timestamptz not null,
  creado_en timestamptz not null default now()
);

create table if not exists public.oficina_chat (
  id uuid primary key default gen_random_uuid(),
  de text not null references public.oficina_agentes(id),
  para text,
  texto text not null,
  rincon text check (rincon in ('cafe','platica')),
  idea_id uuid references public.oficina_ideas(id) on delete set null,
  mostrar_desde timestamptz not null,
  creado_en timestamptz not null default now()
);

create table if not exists public.oficina_rondas (
  fecha date primary key,
  resultado text not null check (resultado in ('ok','falla','saltada')),
  detalle text not null default '',
  creado_en timestamptz not null default now()
);

create index if not exists oficina_chat_mostrar on public.oficina_chat (mostrar_desde);
create index if not exists oficina_posts_mostrar on public.oficina_posts (mostrar_desde desc);
create index if not exists oficina_comentarios_post on public.oficina_comentarios (post_id, mostrar_desde);
create index if not exists oficina_ideas_estado on public.oficina_ideas (estado, mostrar_desde desc);
create index if not exists oficina_fotos_cola on public.oficina_fotos (tipo, estado, intentada_en);

create or replace view public.oficina_semana with (security_invoker = true) as
select
  agente,
  (creado_en at time zone 'America/Costa_Rica')::date as dia,
  count(*) filter (where tipo = 'termina') as tareas,
  bool_or(tipo = 'falla') as falla
from public.oficina_marcas
where tipo in ('termina', 'falla') and creado_en >= now() - interval '8 days'
group by agente, (creado_en at time zone 'America/Costa_Rica')::date;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('oficina', 'oficina', false, 10485760, array['image/jpeg'])
on conflict (id) do nothing;

alter table public.oficina_fotos enable row level security;
alter table public.oficina_posts enable row level security;
alter table public.oficina_ideas enable row level security;
alter table public.oficina_comentarios enable row level security;
alter table public.oficina_chat enable row level security;
alter table public.oficina_rondas enable row level security;

revoke all on public.oficina_fotos, public.oficina_posts, public.oficina_ideas, public.oficina_comentarios, public.oficina_chat, public.oficina_rondas from anon, authenticated;
revoke all on public.oficina_semana from anon, authenticated;
