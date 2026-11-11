-- Reels de prueba con hasta 10 versiones. Los reels hechos con IA siguen saliendo en 5, y algunos videos propios salen
-- en 10, cada uno con su propio gancho y su portada. Solo se amplía el límite: no cambia ningún dato.
alter table public.redes_publicaciones drop constraint if exists redes_publicaciones_version_check;
alter table public.redes_publicaciones add constraint redes_publicaciones_version_check check (version between 1 and 10);
