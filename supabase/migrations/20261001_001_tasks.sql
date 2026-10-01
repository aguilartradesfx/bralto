-- Sección Tareas del panel admin (2026-10-01). Aditiva.
alter table public.user_profiles
  add column if not exists can_view_tasks boolean not null default true;

create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (length(btrim(title)) > 0),
  description  text not null default '',
  checklist    jsonb not null default '[]'::jsonb check (jsonb_typeof(checklist) = 'array'),
  priority     text not null default 'normal' check (priority in ('baja','normal','alta','urgente')),
  status       text not null default 'pendiente' check (status in ('pendiente','en_progreso','bloqueada','en_revision','hecha')),
  assignee_id  uuid references auth.users(id) on delete set null,
  created_by   uuid references auth.users(id) on delete set null,
  due_date     date,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists tasks_assignee_status_idx on public.tasks (assignee_id, status);
create index if not exists tasks_created_by_idx on public.tasks (created_by);
drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.update_updated_at();

create table if not exists public.task_updates (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  author_id   uuid references auth.users(id) on delete set null,
  kind        text not null check (kind in ('avance','estado','devolucion','bloqueo')),
  body        text not null default '',
  from_status text,
  to_status   text,
  created_at  timestamptz not null default now()
);
create index if not exists task_updates_task_idx on public.task_updates (task_id, created_at);
create index if not exists task_updates_created_idx on public.task_updates (created_at);
create index if not exists task_updates_author_idx on public.task_updates (author_id);

-- Sin políticas: solo el service role (APIs del panel) accede.
alter table public.tasks enable row level security;
alter table public.task_updates enable row level security;
