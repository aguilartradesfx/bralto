-- Sección Plan Q4 del panel admin (2026-10-13). Aditiva.
alter table public.user_profiles
  add column if not exists can_view_plan boolean not null default false;

create table if not exists public.plan_team (
  slug    text primary key check (slug in ('ale', 'soshil', 'alina')),
  nombre  text not null,
  rol     text not null default '',
  user_id uuid unique references auth.users(id) on delete set null
);

-- Contenido de las pestañas (Parte 2 del archivo del plan) y encabezado del Resumen. Una sola fila; la escribe el seed.
create table if not exists public.plan_content (
  id             smallint primary key default 1 check (id = 1),
  markdown       text not null,
  resumen        jsonb not null default '{"encabezado": [], "hitos": []}'::jsonb,
  actualizado_en timestamptz not null default now()
);

create table if not exists public.plan_tasks (
  id              text primary key check (id ~ '^B[0-9]+-[0-9]{2,}$'),
  bloque          text not null check (bloque ~ '^b[0-9]+$'),
  titulo          text not null check (length(btrim(titulo)) > 0),
  responsable     text not null references public.plan_team(slug),
  apoyo           text references public.plan_team(slug),
  fecha           date not null,
  tipo            text not null check (tipo in ('unica', 'semanal')),
  estado          text check (estado in ('pendiente', 'en_curso', 'hecho')),
  nota            text,
  origen          text not null default 'plan' check (origen in ('plan', 'panel')),
  actualizado_por text references public.plan_team(slug),
  actualizado_en  timestamptz,
  created_at      timestamptz not null default now(),
  constraint plan_tasks_estado_segun_tipo check ((tipo = 'unica') = (estado is not null)),
  constraint plan_tasks_apoyo_distinto check (apoyo is null or apoyo <> responsable)
);
create index if not exists plan_tasks_bloque_idx on public.plan_tasks (bloque);
create index if not exists plan_tasks_responsable_idx on public.plan_tasks (responsable);

create table if not exists public.plan_task_weeks (
  task_id    text not null references public.plan_tasks(id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  done       boolean not null default false,
  done_by    text references public.plan_team(slug),
  done_at    timestamptz,
  primary key (task_id, week_start)
);

-- Sin políticas: solo el service role (APIs del panel y el seed) accede.
alter table public.plan_team enable row level security;
alter table public.plan_content enable row level security;
alter table public.plan_tasks enable row level security;
alter table public.plan_task_weeks enable row level security;
