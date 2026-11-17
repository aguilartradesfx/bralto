-- La bandeja de dos paneles: la misma lista que crm_bandeja, más filtrar por red (instagram, messenger, whatsapp) y
-- buscar por nombre, @ o número. Es una función nueva: crm_bandeja queda igual para lo que ya la usa
create or replace function public.crm_bandeja_lista(filtro text default 'por_responder', red text default null, buscar text default null, limite int default 50)
  returns table (
    id uuid,
    canal text,
    contacto_id uuid,
    contacto_nombre text,
    participante_nombre text,
    participante_usuario text,
    participante_foto text,
    tipo text,
    ultimo_mensaje_en timestamptz,
    leido_en timestamptz,
    knox_pausado_hasta timestamptz,
    ultimo_texto text,
    ultimo_autor text,
    ultimo_direccion text,
    ultimo_adjunto text,
    ultimo_entrante_en timestamptz,
    pendiente_id uuid,
    pendiente_respuesta text,
    pendiente_aviso text
  )
  language sql stable set search_path = '' as $$
  with patron as (
    select '%' || replace(replace(replace(nullif(trim(buscar), ''), '\', '\\'), '%', '\%'), '_', '\_') || '%' as p
  )
  select v.id, v.canal, v.contacto_id, nullif(trim(coalesce(c.nombre, '') || ' ' || coalesce(c.apellido, '')), ''),
    v.participante_nombre, v.participante_usuario, v.participante_foto, v.tipo, v.ultimo_mensaje_en, v.leido_en,
    v.knox_pausado_hasta, m.texto, m.autor, m.direccion, m.meta ->> 'adjunto', e.enviado_en,
    d.id, d.respuesta, d.decision ->> 'aviso'
  from public.crm_conversaciones v
  cross join patron
  left join public.crm_contactos c on c.id = v.contacto_id
  join lateral (
    select x.texto, x.autor, x.direccion, x.meta from public.crm_mensajes x
    where x.conversacion_id = v.id and x.tipo <> 'actividad'
    order by x.enviado_en desc, x.id desc limit 1
  ) m on true
  left join lateral (
    select x.enviado_en from public.crm_mensajes x
    where x.conversacion_id = v.id and x.direccion = 'entrante'
    order by x.enviado_en desc limit 1
  ) e on true
  left join lateral (
    select k.id, k.respuesta, k.decision from public.crm_knox_decisiones k
    where k.conversacion_id = v.id and k.estado = 'pendiente'
    order by k.creado_en desc limit 1
  ) d on true
  where v.origen = 'zernio'
    and (red is null or v.canal = red)
    and (
      patron.p is null
      or concat_ws(' ', c.nombre, c.apellido, v.participante_nombre, v.participante_usuario, v.participante_id) ilike patron.p
    )
    and case filtro
      when 'por_responder' then m.direccion = 'entrante' and v.tipo is distinct from 'spam'
      when 'trabajo' then v.tipo = 'trabajo'
      when 'personales' then v.tipo = 'personal'
      else true
    end
  order by v.ultimo_mensaje_en desc nulls last, v.id
  limit least(greatest(limite, 1), 500)
$$;

revoke execute on function public.crm_bandeja_lista(text, text, text, int) from public, anon, authenticated;
grant execute on function public.crm_bandeja_lista(text, text, text, int) to service_role;
