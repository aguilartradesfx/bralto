-- Fase 2 del CRM: una sola bandeja con los mensajes de Instagram, Messenger y WhatsApp (entran por Zernio) y
-- Knox, que los lee y deja una respuesta (o la manda, en modo automático). Es aditiva: columnas nuevas en
-- crm_conversaciones y crm_mensajes y dos tablas nuevas. Solo el servidor lee esto (RLS sin políticas y sin
-- permisos para anon ni authenticated), igual que la 003.

-- Una conversación de Zernio llega antes de que la persona sea contacto, y sus mensajes también
alter table public.crm_conversaciones alter column contacto_id drop not null;
alter table public.crm_mensajes alter column contacto_id drop not null;

alter table public.crm_conversaciones
  add column if not exists cuenta_id text,                -- la cuenta de Zernio que recibe (para contestar)
  add column if not exists participante_id text,          -- el id de la persona en la red; en WhatsApp, su número
  add column if not exists participante_nombre text,
  add column if not exists participante_usuario text,     -- el @ de Instagram, sin la @
  add column if not exists participante_foto text,        -- URL de la red (puede vencer)
  add column if not exists knox_pausado_hasta timestamptz, -- Knox no contesta hasta entonces ('infinity': apagado aquí)
  add column if not exists tipo text check (tipo in ('trabajo', 'personal', 'spam')), -- lo último que decidió Knox
  add column if not exists leido_en timestamptz,          -- cuándo la abrió Ale en el panel (o le contestó)
  add column if not exists avisado_en timestamptz,        -- último aviso por Telegram: uno cada 30 min como mucho
  add column if not exists otra_app_en timestamptz;       -- último mensaje que otra app (GoHighLevel) tenía en control

-- Quién escribió cada mensaje. null en lo de GoHighLevel (se sabe solo si entró o salió)
alter table public.crm_mensajes
  add column if not exists autor text check (autor in ('persona', 'ale', 'knox', 'automatizacion', 'sistema'));

-- Lo que decidió Knox con cada mensaje. pendiente: Ale tiene que mirarlo (un borrador o un aviso); solo una
-- pendiente por conversación, la más nueva
create table if not exists public.crm_knox_decisiones (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references public.crm_conversaciones (id) on delete cascade,
  mensaje_id uuid references public.crm_mensajes (id) on delete set null, -- el mensaje que la disparó
  decision jsonb,                               -- lo que devolvió Knox (DecisionKnox); null si falló
  respuesta text,                               -- lo que se le manda a la persona (Ale lo puede editar)
  estado text not null check (estado in ('pendiente', 'enviada', 'descartada', 'silencio', 'error')),
  modo text not null check (modo in ('ensayo', 'automatico')),
  error text,
  enviado_mensaje_id uuid references public.crm_mensajes (id) on delete set null,
  creado_en timestamptz not null default now(),
  resuelto_en timestamptz
);

create index if not exists crm_knox_decisiones_conversacion on public.crm_knox_decisiones (conversacion_id, creado_en desc);
create index if not exists crm_knox_decisiones_recientes on public.crm_knox_decisiones (creado_en desc);
create unique index if not exists crm_knox_decisiones_una_pendiente on public.crm_knox_decisiones (conversacion_id)
  where estado = 'pendiente';

-- Cómo trabaja Knox: una sola fila. La ficha (lo que Knox puede decir) la escribe Ale desde el panel
create table if not exists public.knox_ajustes (
  id boolean primary key default true check (id),
  modo text not null default 'ensayo' check (modo in ('apagado', 'ensayo', 'automatico')),
  ficha text not null default '',
  actualizado_en timestamptz not null default now()
);

insert into public.knox_ajustes (id) values (true) on conflict (id) do nothing;

alter table public.crm_knox_decisiones enable row level security;
alter table public.knox_ajustes enable row level security;
revoke all on public.crm_knox_decisiones, public.knox_ajustes from anon, authenticated;

-- La bandeja: cada conversación de Zernio con su último mensaje, cuándo escribió la persona por última vez y el
-- borrador de Knox, si hay. filtro: por_responder (el último mensaje es de la persona), trabajo, personales o todas
create or replace function public.crm_bandeja(filtro text default 'por_responder', limite int default 50)
  returns table (
    id uuid,
    canal text,
    contacto_id uuid,
    contacto_nombre text,
    participante_nombre text,
    participante_usuario text,
    participante_foto text,
    tipo text,
    ultimo_mensaje_en timestamptz,
    leido_en timestamptz,
    knox_pausado_hasta timestamptz,
    ultimo_texto text,
    ultimo_autor text,
    ultimo_direccion text,
    ultimo_adjunto text,
    ultimo_entrante_en timestamptz,
    pendiente_id uuid,
    pendiente_respuesta text,
    pendiente_aviso text
  )
  language sql stable set search_path = '' as $$
  select v.id, v.canal, v.contacto_id, nullif(trim(coalesce(c.nombre, '') || ' ' || coalesce(c.apellido, '')), ''),
    v.participante_nombre, v.participante_usuario, v.participante_foto, v.tipo, v.ultimo_mensaje_en, v.leido_en,
    v.knox_pausado_hasta, m.texto, m.autor, m.direccion, m.meta ->> 'adjunto', e.enviado_en,
    d.id, d.respuesta, d.decision ->> 'aviso'
  from public.crm_conversaciones v
  left join public.crm_contactos c on c.id = v.contacto_id
  join lateral (
    select x.texto, x.autor, x.direccion, x.meta from public.crm_mensajes x
    where x.conversacion_id = v.id and x.tipo <> 'actividad'
    order by x.enviado_en desc, x.id desc limit 1
  ) m on true
  left join lateral (
    select x.enviado_en from public.crm_mensajes x
    where x.conversacion_id = v.id and x.direccion = 'entrante'
    order by x.enviado_en desc limit 1
  ) e on true
  left join lateral (
    select k.id, k.respuesta, k.decision from public.crm_knox_decisiones k
    where k.conversacion_id = v.id and k.estado = 'pendiente'
    order by k.creado_en desc limit 1
  ) d on true
  where v.origen = 'zernio'
    and case filtro
      when 'por_responder' then m.direccion = 'entrante' and v.tipo is distinct from 'spam'
      when 'trabajo' then v.tipo = 'trabajo'
      when 'personales' then v.tipo = 'personal'
      else true
    end
  order by v.ultimo_mensaje_en desc nulls last, v.id
  limit least(greatest(limite, 1), 500)
$$;

-- Los números de arriba de la bandeja
create or replace function public.crm_bandeja_resumen()
  returns table (por_responder int, sin_leer int, pendientes int)
  language sql stable set search_path = '' as $$
  with u as (
    select v.tipo, v.leido_en,
      (select x.direccion from public.crm_mensajes x
        where x.conversacion_id = v.id and x.tipo <> 'actividad' order by x.enviado_en desc, x.id desc limit 1) as direccion,
      (select max(x.enviado_en) from public.crm_mensajes x where x.conversacion_id = v.id and x.direccion = 'entrante') as entrante
    from public.crm_conversaciones v
    where v.origen = 'zernio'
  )
  select
    (count(*) filter (where direccion = 'entrante' and tipo is distinct from 'spam'))::int,
    (count(*) filter (where entrante > coalesce(leido_en, '-infinity'::timestamptz)))::int,
    (select count(*)::int from public.crm_knox_decisiones k where k.estado = 'pendiente')
  from u
$$;

-- Pausa a Knox en una conversación hasta `hasta`, sin acortar una pausa más larga (ni el «apagado aquí»)
create or replace function public.crm_pausar_knox(conversacion uuid, hasta timestamptz)
  returns void
  language sql set search_path = '' as $$
  update public.crm_conversaciones
  set knox_pausado_hasta = greatest(coalesce(knox_pausado_hasta, hasta), hasta)
  where id = conversacion
$$;

revoke execute on function public.crm_bandeja(text, int), public.crm_bandeja_resumen(), public.crm_pausar_knox(uuid, timestamptz)
  from public, anon, authenticated;
grant execute on function public.crm_bandeja(text, int), public.crm_bandeja_resumen(), public.crm_pausar_knox(uuid, timestamptz)
  to service_role;
