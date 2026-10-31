-- bookings guarda el nombre, el correo y el teléfono de quien agenda el diagnóstico y no tenía RLS: la clave pública
-- del sitio podía leerla. Desde el 30/10 la agenda (lib/agenda/servidor.ts) y Knox la leen y escriben con la clave
-- de servicio, así que se cierra para anon y authenticated.
alter table public.bookings enable row level security;
revoke all on public.bookings from anon, authenticated;
