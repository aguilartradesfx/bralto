-- CRM propio del panel (reemplaza a GoHighLevel): contactos con toda su historia, notas, tareas, pipeline de
-- oportunidades, conversaciones con sus mensajes de todos los canales, citas y adjuntos (bucket privado «crm»).
-- La fase 2 (bandeja con Zernio: Instagram, Messenger y WhatsApp) entra aquí sin migrar de nuevo: cada mensaje y
-- cada conversación lleva su canal, su origen y su id externo, y crm_identidades dice de quién es lo que entra.
-- Solo el servidor lee esto (RLS sin políticas y sin permisos para anon ni authenticated).

-- Contactos -----------------------------------------------------------------------------------------------------
create table if not exists public.crm_contactos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null default '',
  apellido text not null default '',
  telefono text,                                -- E.164, con +
  correo text,                                  -- en minúsculas
  empresa text,
  etiquetas text[] not null default '{}',       -- en minúsculas
  campos jsonb not null default '{}',           -- personalizados: { clave: { etiqueta, valor } }
  fuente text,                                  -- por dónde llegó (formulario, anuncio…), como lo anotó GoHighLevel
  no_molestar boolean not null default false,   -- pidió no recibir mensajes (para las campañas de la fase 3)
  origen text not null default 'panel' check (origen in ('ghl', 'panel', 'zernio', 'web')),
  ghl_id text unique,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  editado_en timestamptz,                       -- último cambio desde el panel: volver a importar no lo pisa
  ultima_actividad timestamptz not null default now(),
  -- Para el buscador: todo junto, en minúsculas y sin tildes
  busqueda text generated always as (
    translate(
      lower(nombre || ' ' || apellido || ' ' || coalesce(correo, '') || ' ' || coalesce(empresa, '') || ' ' || coalesce(telefono, '')),
      'áàâäãéèêëíìîïóòôöõúùûüñç',
      'aaaaaeeeeiiiiooooouuuunc'
    )
  ) stored
);

create index if not exists crm_contactos_actividad on public.crm_contactos (ultima_actividad desc, id);
create index if not exists crm_contactos_etiquetas on public.crm_contactos using gin (etiquetas);

-- Cómo se reconoce a un contacto en cada canal (fase 2: lo que entra por Zernio se asocia por aquí)
create table if not exists public.crm_identidades (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid not null references public.crm_contactos (id) on delete cascade,
  canal text not null check (canal in ('telefono', 'correo', 'whatsapp', 'instagram', 'messenger')),
  valor text not null,                          -- E.164, correo en minúsculas o el id de la plataforma
  alias text,                                   -- cómo se ve (@usuario), si la plataforma lo da
  creado_en timestamptz not null default now(),
  unique (canal, valor)
);

create index if not exists crm_identidades_contacto on public.crm_identidades (contacto_id);

-- Notas y tareas -------------------------------------------------------------------------------------------------
create table if not exists public.crm_notas (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid not null references public.crm_contactos (id) on delete cascade,
  texto text not null,
  autor text,                                   -- quién la escribió en el panel; null en las de GoHighLevel
  fijada boolean not null default false,
  origen text not null default 'panel' check (origen in ('ghl', 'panel', 'zernio', 'web')),
  ghl_id text unique,
  creado_en timestamptz not null default now()
);

create index if not exists crm_notas_contacto on public.crm_notas (contacto_id, creado_en desc);

create table if not exists public.crm_tareas (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid not null references public.crm_contactos (id) on delete cascade,
  titulo text not null,
  detalle text,
  vence_en timestamptz,
  hecha boolean not null default false,
  hecha_en timestamptz,
  origen text not null default 'panel' check (origen in ('ghl', 'panel', 'zernio', 'web')),
  ghl_id text unique,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  editado_en timestamptz
);

create index if not exists crm_tareas_pendientes on public.crm_tareas (hecha, vence_en);
create index if not exists crm_tareas_contacto on public.crm_tareas (contacto_id);

-- Pipeline -------------------------------------------------------------------------------------------------------
create table if not exists public.crm_pipelines (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  orden int not null default 0,
  ghl_id text unique,
  creado_en timestamptz not null default now()
);

create table if not exists public.crm_etapas (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.crm_pipelines (id) on delete cascade,
  nombre text not null,
  orden int not null,
  ghl_id text unique,
  creado_en timestamptz not null default now(),
  unique (id, pipeline_id)                      -- para que una oportunidad no quede en la etapa de otro pipeline
);

create index if not exists crm_etapas_pipeline on public.crm_etapas (pipeline_id, orden);

create table if not exists public.crm_oportunidades (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid not null references public.crm_contactos (id) on delete cascade,
  pipeline_id uuid not null references public.crm_pipelines (id),
  etapa_id uuid not null,
  nombre text not null,
  valor numeric(12, 2) not null default 0 check (valor >= 0),
  estado text not null default 'abierta' check (estado in ('abierta', 'ganada', 'perdida', 'abandonada')),
  fuente text,
  origen text not null default 'panel' check (origen in ('ghl', 'panel', 'zernio', 'web')),
  ghl_id text unique,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  editado_en timestamptz,
  cambio_etapa_en timestamptz,
  foreign key (etapa_id, pipeline_id) references public.crm_etapas (id, pipeline_id)
);

create index if not exists crm_oportunidades_tablero on public.crm_oportunidades (pipeline_id, estado, etapa_id);
create index if not exists crm_oportunidades_contacto on public.crm_oportunidades (contacto_id);

-- Conversaciones y mensajes ----------------------------------------------------------------------------------------
-- canal: whatsapp, sms, correo, messenger, instagram, llamada, sistema (eventos) u otro. Sin check: si la
-- fase 2 trae un canal nuevo, entra sin migrar
create table if not exists public.crm_conversaciones (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid not null references public.crm_contactos (id) on delete cascade,
  canal text not null,                          -- en las de GoHighLevel, el del último mensaje (ahí se mezclan)
  origen text not null check (origen in ('ghl', 'panel', 'zernio', 'web')),
  externo_id text,
  cuenta text,                                  -- la cuenta o el número del negocio (fase 2)
  ultimo_mensaje_en timestamptz,
  sin_leer int not null default 0,
  creado_en timestamptz not null default now(),
  unique (origen, externo_id)
);

create index if not exists crm_conversaciones_contacto on public.crm_conversaciones (contacto_id);
create index if not exists crm_conversaciones_recientes on public.crm_conversaciones (ultimo_mensaje_en desc);

create table if not exists public.crm_mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid references public.crm_conversaciones (id) on delete cascade, -- null en lo que anota el panel
  contacto_id uuid not null references public.crm_contactos (id) on delete cascade,
  canal text not null,
  tipo text not null check (tipo in ('mensaje', 'correo', 'llamada', 'actividad')),
  direccion text check (direccion in ('entrante', 'saliente')), -- null en las actividades
  texto text,                                   -- siempre texto plano (los correos llegan sin HTML)
  asunto text,
  adjuntos jsonb not null default '[]',         -- [{ id (crm_adjuntos), nombre, tipo, perdido? }]
  meta jsonb not null default '{}',             -- estado de entrega, error, duración de la llamada, tipo de actividad
  enviado_en timestamptz not null,
  origen text not null check (origen in ('ghl', 'panel', 'zernio', 'web')),
  externo_id text,
  creado_en timestamptz not null default now(),
  unique (origen, externo_id)
);

create index if not exists crm_mensajes_historial on public.crm_mensajes (contacto_id, enviado_en desc, id desc);
create index if not exists crm_mensajes_conversacion on public.crm_mensajes (conversacion_id, enviado_en desc);

-- Citas y adjuntos -------------------------------------------------------------------------------------------------
create table if not exists public.crm_citas (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid not null references public.crm_contactos (id) on delete cascade,
  titulo text not null,
  inicio timestamptz not null,
  fin timestamptz,
  estado text not null default 'confirmada' check (estado in ('nueva', 'confirmada', 'asistio', 'no_asistio', 'cancelada')),
  enlace text,                                  -- la videollamada
  notas text,
  origen text not null default 'panel' check (origen in ('ghl', 'panel', 'zernio', 'web')),
  ghl_id text unique,
  creado_en timestamptz not null default now()
);

create index if not exists crm_citas_contacto on public.crm_citas (contacto_id, inicio desc);
create index if not exists crm_citas_inicio on public.crm_citas (inicio);

create table if not exists public.crm_adjuntos (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid not null references public.crm_contactos (id) on delete cascade,
  mensaje_id uuid references public.crm_mensajes (id) on delete set null,
  nombre text not null,
  ruta text not null unique,                    -- en el bucket «crm»
  tipo text,                                    -- MIME
  tamano bigint,                                -- bytes
  origen text not null default 'panel' check (origen in ('ghl', 'panel', 'zernio', 'web')),
  externo_id text,                              -- GoHighLevel: <id del mensaje>:<n.º de archivo>
  creado_en timestamptz not null default now(),
  unique (origen, externo_id)
);

create index if not exists crm_adjuntos_contacto on public.crm_adjuntos (contacto_id);

-- Solo el servidor -------------------------------------------------------------------------------------------------
alter table public.crm_contactos enable row level security;
alter table public.crm_identidades enable row level security;
alter table public.crm_notas enable row level security;
alter table public.crm_tareas enable row level security;
alter table public.crm_pipelines enable row level security;
alter table public.crm_etapas enable row level security;
alter table public.crm_oportunidades enable row level security;
alter table public.crm_conversaciones enable row level security;
alter table public.crm_mensajes enable row level security;
alter table public.crm_citas enable row level security;
alter table public.crm_adjuntos enable row level security;

revoke all on public.crm_contactos, public.crm_identidades, public.crm_notas, public.crm_tareas, public.crm_pipelines,
  public.crm_etapas, public.crm_oportunidades, public.crm_conversaciones, public.crm_mensajes, public.crm_citas,
  public.crm_adjuntos from anon, authenticated;

-- actualizado_en al día en cada cambio
create or replace function public.crm_actualizado() returns trigger
  language plpgsql set search_path = '' as $$
begin
  new.actualizado_en = now();
  return new;
end
$$;

drop trigger if exists crm_contactos_actualizado on public.crm_contactos;
create trigger crm_contactos_actualizado before update on public.crm_contactos
  for each row execute function public.crm_actualizado();
drop trigger if exists crm_tareas_actualizado on public.crm_tareas;
create trigger crm_tareas_actualizado before update on public.crm_tareas
  for each row execute function public.crm_actualizado();
drop trigger if exists crm_oportunidades_actualizado on public.crm_oportunidades;
create trigger crm_oportunidades_actualizado before update on public.crm_oportunidades
  for each row execute function public.crm_actualizado();

-- Un mensaje nuevo (venga de donde venga) sube al contacto en la lista y fecha su conversación.
-- Por sentencia: una importación de miles de mensajes toca cada contacto una vez
create or replace function public.crm_mensajes_nuevos() returns trigger
  language plpgsql set search_path = '' as $$
begin
  update public.crm_contactos c set ultima_actividad = n.ultimo
  from (select contacto_id, max(enviado_en) as ultimo from nuevos group by contacto_id) n
  where c.id = n.contacto_id and c.ultima_actividad < n.ultimo;

  update public.crm_conversaciones v set ultimo_mensaje_en = n.ultimo
  from (
    select conversacion_id, max(enviado_en) as ultimo from nuevos
    where conversacion_id is not null and tipo <> 'actividad' group by conversacion_id
  ) n
  where v.id = n.conversacion_id and (v.ultimo_mensaje_en is null or v.ultimo_mensaje_en < n.ultimo);
  return null;
end
$$;

drop trigger if exists crm_mensajes_nuevos on public.crm_mensajes;
create trigger crm_mensajes_nuevos after insert on public.crm_mensajes
  referencing new table as nuevos for each statement execute function public.crm_mensajes_nuevos();

-- Una nota nueva también cuenta como actividad
create or replace function public.crm_notas_nuevas() returns trigger
  language plpgsql set search_path = '' as $$
begin
  update public.crm_contactos c set ultima_actividad = n.ultimo
  from (select contacto_id, max(creado_en) as ultimo from nuevas group by contacto_id) n
  where c.id = n.contacto_id and c.ultima_actividad < n.ultimo;
  return null;
end
$$;

drop trigger if exists crm_notas_nuevas on public.crm_notas;
create trigger crm_notas_nuevas after insert on public.crm_notas
  referencing new table as nuevas for each statement execute function public.crm_notas_nuevas();

-- Para la lista de contactos: el canal por el que más se habla con cada uno y cuántas oportunidades tiene abiertas
create or replace function public.crm_resumen_contactos(ids uuid[])
  returns table (contacto_id uuid, canal text, abiertas int)
  language sql stable set search_path = '' as $$
  select c.id,
    (select m.canal from public.crm_mensajes m
      where m.contacto_id = c.id and m.tipo <> 'actividad'
      group by m.canal order by count(*) desc, max(m.enviado_en) desc limit 1),
    (select count(*)::int from public.crm_oportunidades o where o.contacto_id = c.id and o.estado = 'abierta')
  from unnest(ids) as c (id)
$$;

-- Las etiquetas que se usan, con cuántos contactos tiene cada una (el filtro de la lista)
create or replace function public.crm_etiquetas()
  returns table (etiqueta text, total int)
  language sql stable set search_path = '' as $$
  select e, count(*)::int from public.crm_contactos, unnest(etiquetas) as e group by e order by count(*) desc, e
$$;

revoke execute on function public.crm_actualizado(), public.crm_mensajes_nuevos(), public.crm_notas_nuevas(),
  public.crm_resumen_contactos(uuid[]), public.crm_etiquetas() from public, anon, authenticated;
grant execute on function public.crm_resumen_contactos(uuid[]), public.crm_etiquetas() to service_role;

-- Adjuntos: bucket privado, se bajan con URL firmada desde el panel
insert into storage.buckets (id, name, public, file_size_limit)
values ('crm', 'crm', false, 52428800)
on conflict (id) do nothing;
