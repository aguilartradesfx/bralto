-- El arranque de Knox: lo que dice mientras revisa al abrir el centro de mando (un saludo y algo que trae en la
-- cabeza). Se preparan la noche anterior, varios por día, y cada uno suena una sola vez. El audio va en el bucket
-- privado «knox». Solo el servidor lee esto (RLS sin políticas y sin permisos para anon ni authenticated).

create table if not exists public.knox_arranques (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,                          -- día de Costa Rica en que se usa
  orden int not null,                           -- en qué orden salen ese día
  tipo text not null check (tipo in ('idea', 'ciencia', 'empujon')),
  secciones jsonb not null,                     -- [saludo, frase]
  inicios jsonb not null default '[]',          -- segundo del audio en que empieza cada sección
  audio_path text not null,                     -- en el bucket «knox»
  usado_en timestamptz,                         -- cuándo sonó; null si todavía no
  creado_en timestamptz not null default now(),
  unique (fecha, orden)
);

create index if not exists knox_arranques_sin_usar on public.knox_arranques (fecha desc, orden) where usado_en is null;

alter table public.knox_arranques enable row level security;
revoke all on public.knox_arranques from anon, authenticated;
