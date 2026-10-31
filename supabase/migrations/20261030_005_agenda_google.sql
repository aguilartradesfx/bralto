-- Agenda propia con Google Calendar + Meet (reemplaza a GoHighLevel). Aditiva: solo columnas nuevas, nada se borra ni
-- se cambia. bookings es el registro de cada diagnóstico pagado; crm_citas, la cita en la ficha del contacto.

alter table public.bookings
  add column if not exists orden text,           -- el pago (número de orden): una fila por pago
  add column if not exists inicio timestamptz,   -- cuándo empieza la llamada
  add column if not exists enlace text,          -- la videollamada (Google Meet)
  add column if not exists evento_google text,   -- el evento en el calendario de la agenda
  -- agendada: está en el calendario; pendiente: Google falló y se reintenta; conflicto: el horario ya estaba ocupado
  add column if not exists cita text check (cita in ('agendada', 'pendiente', 'conflicto'));

create unique index if not exists bookings_orden on public.bookings (orden);

alter table public.crm_citas
  add column if not exists google_id text unique; -- el evento en Google Calendar (para moverla o cancelarla)
