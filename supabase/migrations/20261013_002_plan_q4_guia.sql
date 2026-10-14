-- Plan Q4: textos de la "Guía para el equipo" (Inicio, Etapas, Equipo, Estrategia). Aditiva; la escribe el seed.
alter table public.plan_content
  add column if not exists guia jsonb;
