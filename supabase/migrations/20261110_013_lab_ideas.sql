-- «Ideas» del panel: enlaces de videos de Instagram o TikTok que se analizan (números, por qué pegó y una
-- versión propia). Los pega él desde admin.bralto.io/ideas; más adelante también los exploradores.
-- Aditiva. Solo el servidor lee y escribe: RLS sin políticas y sin permisos para anon ni authenticated.
create table if not exists public.lab_ideas (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,                 -- normalizada (lib/ideas/enlaces.ts): una sola fila por video
  red text not null check (red in ('instagram', 'tiktok')),
  origen text not null default 'tu' check (origen in ('tu', 'explorador')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'analizando', 'lista', 'error')),
  metricas jsonb,                           -- vistas, me gusta, comentarios, compartidos, guardados, seguidores…
  analisis jsonb,                           -- de qué trata, por qué pegó y la versión propia
  decision text check (decision in ('knox', 'yo', 'descartada')),
  decidida_en timestamptz,
  tema_id uuid,                             -- la fila de redes_temas que se creó con «Que lo haga Knox»
  error text,                               -- el último error, para mostrarlo con «Reintentar»
  intentos integer not null default 0 check (intentos >= 0),
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now(),
  analizada_en timestamptz
);

-- La cola: lo pendiente o trabado, del más viejo al más nuevo
create index if not exists lab_ideas_cola_idx on public.lab_ideas (creada_en) where estado in ('pendiente', 'analizando');
-- La lista del panel: por decisión, lo más nuevo primero
create index if not exists lab_ideas_lista_idx on public.lab_ideas (decision, creada_en desc);

alter table public.lab_ideas enable row level security;
revoke all on public.lab_ideas from anon, authenticated;
