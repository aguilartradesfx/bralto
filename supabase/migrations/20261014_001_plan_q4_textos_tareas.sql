-- Plan Q4: qué es y cómo hacerlo de cada tarea. Aditiva; las del plan las escribe el seed, las del panel el formulario.
alter table public.plan_tasks
  add column if not exists descripcion text,
  add column if not exists instrucciones text;
