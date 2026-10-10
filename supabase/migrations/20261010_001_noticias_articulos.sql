-- Artículos de Bralto en la misma sección: sin fuente, marcados con tipo = 'articulo'
alter table public.noticias
  add column if not exists tipo text not null default 'noticia' check (tipo in ('noticia', 'articulo'));

alter table public.noticias alter column fuente_url drop not null;
alter table public.noticias alter column fuente_nombre drop not null;

-- Las noticias siguen necesitando su fuente
alter table public.noticias drop constraint if exists noticias_fuente_por_tipo;
alter table public.noticias add constraint noticias_fuente_por_tipo
  check (tipo = 'articulo' or (fuente_url is not null and fuente_nombre is not null));
