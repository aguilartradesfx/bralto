-- Publicaciones programadas de redes: carruseles y reels de Instagram (con su collab, sus historias y su
-- «Comenta» por Zernio) y lo mismo en Facebook. Las publica /api/cron/publicar cada 5 minutos, así que
-- salen a su hora sin depender de una compu prendida. Solo el servidor toca la tabla (RLS sin políticas).

create table if not exists public.redes_publicaciones (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,                         -- para el aviso de Telegram («Jarvis»)
  tipo text not null check (tipo in ('carrusel', 'reel')),
  estado text not null default 'programado'
    check (estado in ('borrador', 'programado', 'publicando', 'publicado', 'error', 'cancelado')),
  publicar_en timestamptz not null,
  texto text not null,                          -- el texto del post, con sus hashtags
  laminas text[] not null default '{}',         -- carrusel: URLs públicas de las imágenes, en orden
  video_url text,                               -- reel: URL pública del video
  portada_url text,                             -- reel: portada opcional
  historias text[] not null default '{}',       -- URLs de las historias que salen después del post
  colaborador text,                             -- usuario de Instagram invitado como collab (bralto.io)
  hecho_con_ia boolean not null default true,   -- la etiqueta «Hecho con IA» de Instagram
  facebook boolean not null default true,       -- también en la página de Facebook (por Zernio)
  comenta jsonb,                                -- el «Comenta X» (palabras, mensajes, botones, seguir)
  resultado jsonb not null default '{}',        -- lo que ya se hizo, paso por paso: así un reintento no duplica
  intentos int not null default 0,
  ultimo_error text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint redes_publicaciones_medios check (
    (tipo = 'carrusel' and cardinality(laminas) between 2 and 10) or (tipo = 'reel' and video_url is not null)
  )
);

create index if not exists redes_publicaciones_cola on public.redes_publicaciones (estado, publicar_en);

alter table public.redes_publicaciones enable row level security;
revoke all on public.redes_publicaciones from anon, authenticated;

-- actualizado_en al día en cada cambio: el rescate de una publicación trabada en «publicando» lo usa
create or replace function public.redes_publicaciones_actualizado() returns trigger
  language plpgsql set search_path = '' as $$
begin
  new.actualizado_en = now();
  return new;
end
$$;

drop trigger if exists redes_publicaciones_actualizado on public.redes_publicaciones;
create trigger redes_publicaciones_actualizado before update on public.redes_publicaciones
  for each row execute function public.redes_publicaciones_actualizado();
