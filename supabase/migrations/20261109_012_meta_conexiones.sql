-- «Conectar cuentas»: cada cliente recibe un enlace (invitación), entra con Facebook y escoge su página y su
-- Instagram. Las claves se guardan cifradas (lib/meta/cifrado.ts). Solo el servidor lee y escribe: RLS sin
-- políticas y sin permisos para anon ni authenticated.
create table if not exists public.meta_invitaciones (
  codigo text primary key,
  cliente text not null,
  creada_en timestamptz not null default now(),
  expira_en timestamptz not null default now() + interval '14 days',
  usada_en timestamptz
);

create table if not exists public.meta_conexiones (
  pagina_id text primary key,
  pagina_nombre text not null,
  instagram_id text,
  instagram_usuario text,
  token_cifrado text not null,
  cliente text not null,
  invitacion text references public.meta_invitaciones (codigo) on delete set null,
  estado text not null default 'activa' check (estado in ('activa', 'rota', 'desconectada')),
  avisos_activos boolean not null default false,  -- la página quedó suscrita a los avisos de la app
  conectada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

create index if not exists meta_conexiones_instagram on public.meta_conexiones (instagram_id) where instagram_id is not null;
create index if not exists meta_conexiones_invitacion on public.meta_conexiones (invitacion);

alter table public.meta_invitaciones enable row level security;
alter table public.meta_conexiones enable row level security;
revoke all on public.meta_invitaciones from anon, authenticated;
revoke all on public.meta_conexiones from anon, authenticated;
