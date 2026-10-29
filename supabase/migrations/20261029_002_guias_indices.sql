-- Ajustes de la revisión de las guías: el índice por correo repetía la primera columna del
-- unique (correo, guia); en cambio la llave foránea guia no tenía índice. Y además de RLS sin
-- políticas, las claves anon y authenticated no tienen ningún permiso sobre estas tablas.

drop index if exists public.guias_contactos_correo;
create index if not exists guias_contactos_guia on public.guias_contactos (guia);

revoke all on public.guias from anon, authenticated;
revoke all on public.guias_contactos from anon, authenticated;
