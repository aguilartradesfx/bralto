-- El botón final de la ventana del candado, propio de cada guía («Aprender a instalar Jarvis»).
-- Vacío: la ventana dice «Ver la guía completa». lib/guias/contenido.ts lo limita a 40 caracteres.
alter table public.guias add column if not exists boton text;
