-- «Análisis» del panel: cada reel con lo que predijo Higgsfield (Virality Predictor, primeros 15 s) al lado de lo
-- que pasó de verdad en Instagram, y las lecciones que se van sacando para los reels siguientes.
-- Aditiva. Solo el servidor lee y escribe: RLS sin políticas y sin permisos para anon ni authenticated.

create table if not exists public.redes_analisis (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,               -- 2026-11-06-reel-lo-legal (y -v3 para una versión de prueba)
  publicacion_id uuid references public.redes_publicaciones(id) on delete set null,
  titulo text not null,
  tipo text not null default 'normal' check (tipo in ('normal', 'prueba', 'rehecho')),
  rehecho_de text,                          -- la clave del reel que se rehizo, si es un rehecho
  grupo uuid,                               -- el grupo de pruebas (redes_publicaciones.grupo)
  version integer check (version between 1 and 10),
  gancho text,                              -- la frase o el texto grande del inicio
  video_url text,
  primer_cuadro_url text,                   -- lo que se ve en el segundo 0
  duracion_s numeric(6, 1),
  prediccion jsonb,                         -- Higgsfield: general, gancho, cerebro, viral, sostiene, por segundo…
  real jsonb,                               -- Instagram: vistas, alcance, salto, promedio, guardados…
  revision jsonb,                           -- lo que se ve al inicio: cuadro 0, cara, texto, cuándo aparece algo…
  publicado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists redes_analisis_fecha_idx on public.redes_analisis (publicado_en desc nulls first);
create index if not exists redes_analisis_publicacion_idx on public.redes_analisis (publicacion_id);

alter table public.redes_analisis enable row level security;
revoke all on public.redes_analisis from anon, authenticated;

-- Lo que vamos aprendiendo. La tarea de la noche lee las confirmadas y las que se están probando antes de hacer
-- un reel; cada una dice por qué en palabras simples y qué reels la respaldan.
create table if not exists public.redes_lecciones (
  id uuid primary key default gen_random_uuid(),
  regla text not null unique,
  por_que text,
  estado text not null default 'probando' check (estado in ('probando', 'confirmada', 'descartada')),
  evidencia text[] not null default '{}',   -- claves de redes_analisis
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

alter table public.redes_lecciones enable row level security;
revoke all on public.redes_lecciones from anon, authenticated;
