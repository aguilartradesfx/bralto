-- «La Oficina de Knox»: las charlas (en el café, en la sala o de visita en la oficina de otro) y tres tertulias al día.
-- Aditiva e idempotente. Las filas que ya existen siguen valiendo: sus líneas no tienen hilo ni «donde», y sus rondas
-- quedan como la del mediodía (la única que corría hasta hoy).

-- ---------- oficina_chat ----------
-- hilo: las líneas de una misma charla llevan el mismo; una línea suelta, null.
-- donde: en una visita, el Knox al que visitan (el anfitrión); va lleno solo cuando rincon = 'visita'.
alter table public.oficina_chat add column if not exists hilo uuid;
alter table public.oficina_chat add column if not exists donde text references public.oficina_agentes(id);

-- rincon acepta también 'visita'. Se quitan los checks de rincon que haya (el de la v2 y los de una corrida anterior de
-- esta misma migración) y se ponen otra vez.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.oficina_chat'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%rincon%'
  loop
    execute format('alter table public.oficina_chat drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.oficina_chat add constraint oficina_chat_rincon_check
  check (rincon in ('cafe', 'platica', 'visita'));
-- «donde» va lleno si y solo si es una visita (con rincon null, también va vacío)
alter table public.oficina_chat add constraint oficina_chat_donde_check
  check (case when rincon = 'visita' then donde is not null else donde is null end);
-- una visita siempre es una charla: lleva su hilo
alter table public.oficina_chat add constraint oficina_chat_visita_hilo_check
  check (rincon is distinct from 'visita' or hilo is not null);

-- ---------- oficina_rondas ----------
-- Una fila por turno de cada día (mañana, mediodía y tarde) en vez de una por día. Las de antes eran la del mediodía.
alter table public.oficina_rondas add column if not exists turno text not null default 'mediodia';
alter table public.oficina_rondas alter column turno drop default;
alter table public.oficina_rondas drop constraint if exists oficina_rondas_turno_check;
alter table public.oficina_rondas add constraint oficina_rondas_turno_check check (turno in ('manana', 'mediodia', 'tarde'));
alter table public.oficina_rondas drop constraint if exists oficina_rondas_pkey;
alter table public.oficina_rondas add constraint oficina_rondas_pkey primary key (fecha, turno);
