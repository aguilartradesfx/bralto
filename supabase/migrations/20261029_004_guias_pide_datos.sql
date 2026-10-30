-- Decisión de Alejandro (29/10): las guías piden datos solo si traen algo para descargar. Las demás
-- (tutoriales, listas de herramientas) se abren enteras y lo que se pide es seguirlo en Instagram.
-- Por defecto no piden datos: así quedan Jarvis y Herramientas.
alter table public.guias add column if not exists pide_datos boolean not null default false;
