-- Knox, el asistente del panel: cada reporte guarda los datos del día, lo que Knox dice (por tarjeta) y
-- en qué segundo empieza cada parte del audio. El audio va en el bucket privado «knox».
-- Solo el servidor lee esto (RLS sin políticas y sin permisos para anon ni authenticated).

create table if not exists public.knox_reportes (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,                          -- día de Costa Rica
  datos jsonb not null,
  secciones jsonb not null,                     -- [{ tarjeta, texto }]
  inicios jsonb not null default '[]',          -- segundo del audio en que empieza cada sección
  audio_path text,                              -- en el bucket «knox»; null si la voz falló
  escrito_por text not null check (escrito_por in ('claude', 'plantilla')),
  creado_en timestamptz not null default now()
);

create index if not exists knox_reportes_fecha on public.knox_reportes (fecha desc, creado_en desc);

alter table public.knox_reportes enable row level security;
revoke all on public.knox_reportes from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('knox', 'knox', false, 10485760, array['audio/mpeg'])
on conflict (id) do nothing;
