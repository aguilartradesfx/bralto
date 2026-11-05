-- Los avisos (webhooks) que Meta manda a la app «Bralto.io»: comentarios y mensajes de Instagram y
-- Facebook, y mensajes de WhatsApp. Uno por fila, tal como llegan, para que el «Comenta» propio y la
-- bandeja de Knox los lean. Solo el servidor (service role) lee y escribe: RLS sin políticas.
create table if not exists public.meta_eventos (
  id uuid primary key default gen_random_uuid(),
  objeto text not null,          -- instagram, page o whatsapp_business_account
  cuenta text not null,          -- id de la cuenta de Instagram, la página o la cuenta de WhatsApp
  campo text not null,           -- comments, messages, feed…; los DMs de Instagram y Messenger: messaging
  datos jsonb,
  atendido_en timestamptz,       -- cuando algo ya lo procesó (el «Comenta», la bandeja)
  recibido_en timestamptz not null default now()
);

create index if not exists meta_eventos_pendientes on public.meta_eventos (campo, recibido_en) where atendido_en is null;
create index if not exists meta_eventos_recibido on public.meta_eventos (recibido_en desc);

alter table public.meta_eventos enable row level security;
