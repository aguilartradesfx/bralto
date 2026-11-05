-- El tipo del post de cada guía (el mismo de redes_temas), para repartirlas en bralto.io/es/recursos:
-- las de noticia van a la pestaña Noticias y las demás a Guías (las que piden datos, a Descargables).
-- Sin tipo, la guía cae en Guías: nunca se pierde.
alter table public.guias add column if not exists tipo text
  check (tipo in ('tutorial', 'noticia', 'dato', 'herramientas', 'recursos'));
