-- Plan Q4: nombre corto de cada tarea para las listas (el título completo se ve al desplegarla). Aditiva; lo escribe el seed.
alter table public.plan_tasks
  add column if not exists nombre text;
