// SERVER-ONLY — la agenda del diagnóstico con Google Calendar + Meet (reemplaza a GoHighLevel, que dejó de pagarse).
// Las reglas y los textos están en módulos puros con pruebas (reglas, google, cita, avisos, contacto, cola, eventos); aquí
// van las conexiones: Google, Supabase (bookings y el CRM), Redis (la cola de reintentos), Resend y Telegram.
//
// Si Google falla:
// - al dar horarios: se ofrecen los fijos sin revisar el calendario (como cuando fallaba GoHighLevel) y se avisa por
//   Telegram, una vez por hora como mucho;
// - al crear la cita de alguien que pagó: se le avisa a Alejandro, queda «pendiente» en bookings y en la cola, y el
//   barrido de pagos (cada 10 min) la reintenta hasta que quede o llegue la hora.
import { Redis } from '@upstash/redis'
import { getResend } from '@/lib/email/resend'
import { createServiceClient } from '@/lib/supabase/service'
import { avisarPorTelegram } from '@/lib/telegram'
import type { DiagnosticBooking, Unbooked } from '@/lib/diagnostic/diagnostic'
import {
  textoCitaCancelada,
  textoCitaNueva,
  textoCitaVencida,
  textoCorreoNoSalio,
  textoFallaGoogle,
  textoSigueSinCita,
  textoSinCita,
} from '@/lib/agenda/avisos'
import { correoDeConfirmacion, eventoDelDiagnostico } from '@/lib/agenda/cita'
import { ESPERA_MS, nuevaPendiente, queHacer, trasElAviso, trasFallar, yaHabiaFallado, type Pendiente } from '@/lib/agenda/cola'
import {
  actividadDeLaCita,
  citaDelCrm,
  completarContacto,
  condicionesDeBusqueda,
  contactoDelDiagnostico,
  contactoNuevo,
  elegirContacto,
  identidadesDe,
  type CitaCreada,
  type ContactoActual,
} from '@/lib/agenda/contacto'
import { citasDeEventos, type CitaDeCalendario } from '@/lib/agenda/eventos'
import { clienteGoogle, cuentaDeLaAgenda, cuentasDelEntorno, enlaceMeet, type ClienteGoogle, type CuentaGoogle, type EventoGoogle } from '@/lib/agenda/google'
import { choca, horariosPosibles, inicioYFin, MARGEN_ANTES_MIN, rangoDe, type Ocupado } from '@/lib/agenda/reglas'

const MIN = 60_000
// Los correos a clientes salen por Resend desde send.bralto.io; las respuestas llegan al correo del sitio
const REMITENTE = 'Bralto <agenda@send.bralto.io>'
const RESPONDER_A = 'cs@bralto.io'

// Redis: la cola de citas por crear (como las órdenes de pago) y lo que no se debe repetir
const COLA = 'bralto:agenda:cola'
const pendienteKey = (ref: string) => `bralto:agenda:pendiente:${ref}`
const correoKey = (ref: string) => `bralto:agenda:correo:${ref}`
const AVISO_GOOGLE = 'bralto:agenda:aviso-google'
const TTL = 60 * 60 * 24 * 60

function redis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? new Redis({ url, token }) : null
}

const mensaje = (err: unknown) => (err instanceof Error ? err.message : String(err))

// Lo que la persona espera en pantalla no aguarda a Google más de la cuenta: si no responde, cuenta como falla
async function aTiempo<T>(promesa: Promise<T>, ms: number, para: string): Promise<T> {
  let reloj: ReturnType<typeof setTimeout> | undefined
  const tope = new Promise<never>((_, rechazar) => {
    reloj = setTimeout(() => rechazar(new Error(`Google no respondió en ${ms / 1000} s (${para})`)), ms)
  })
  try {
    return await Promise.race([promesa, tope])
  } finally {
    clearTimeout(reloj)
  }
}

// Google: un cliente por instancia, que guarda los accesos en memoria ----------------------------------------------

let cliente: ClienteGoogle | null = null

function google(): ClienteGoogle {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET')
  cliente ??= clienteGoogle({ clientId, clientSecret })
  return cliente
}

const cuentas = () => cuentasDelEntorno(process.env)

function cuentaAgenda(): CuentaGoogle {
  const c = cuentaDeLaAgenda(cuentas(), process.env)
  if (c) return c
  throw new Error(process.env.AGENDA_CUENTA ? 'AGENDA_CUENTA no es una de las cuentas de Google conectadas' : 'no hay una cuenta de Google de @bralto.io conectada')
}

// Horarios ------------------------------------------------------------------------------------------------------------

// Una vez por hora como mucho: /agendar pregunta en cada visita
async function avisarFallaGoogle(detalle: string, parcial = false) {
  console.error(`[agenda] Google Calendar falló${parcial ? ' en parte' : ''}:`, detalle)
  const r = redis()
  try {
    if (r && (await r.set(AVISO_GOOGLE, '1', { nx: true, ex: 3600 })) === null) return
  } catch {
    // sin Redis se avisa igual
  }
  await avisarPorTelegram(textoFallaGoogle(detalle, { parcial }), 'agenda')
}

/** Lo ocupado en los calendarios de todas las cuentas. Si una no responde, se usa lo de las demás y se avisa; si ninguna, lanza */
async function ocupadoEnCalendarios(desde: number, hasta: number): Promise<Ocupado[]> {
  const todas = cuentas()
  if (!todas.length) throw new Error('no hay cuentas de Google conectadas')
  const g = google()
  const r = await Promise.allSettled(todas.map((c) => g.ocupado(c, desde, hasta)))
  const fallas = r.flatMap((x, i) => (x.status === 'rejected' ? [`${todas[i].correo}: ${mensaje(x.reason)}`] : []))
  if (fallas.length === todas.length) throw new Error(fallas.join(' · '))
  if (fallas.length) await avisarFallaGoogle(fallas.join(' · '), true)
  return r.flatMap((x) => (x.status === 'fulfilled' ? x.value : []))
}

export type Disponibilidad = { disponibles: string[]; conCalendario: boolean }

/** Los horarios que /agendar ofrece ahora. Si Google no responde, los fijos sin revisar el calendario */
export async function horariosDisponibles(ahora = Date.now()): Promise<Disponibilidad> {
  const posibles = horariosPosibles(ahora)
  const rango = rangoDe(posibles)
  if (!rango) return { disponibles: [], conCalendario: true }
  try {
    const ocupados = await aTiempo(ocupadoEnCalendarios(rango.inicio, rango.fin), 8000, 'horarios de /agendar')
    return { disponibles: posibles.filter((s) => !choca(s, ocupados)), conCalendario: true }
  } catch (err) {
    await avisarFallaGoogle(mensaje(err))
    return { disponibles: posibles, conCalendario: false }
  }
}

/** Antes de cobrar: si el horario se ocupó en algún calendario mientras llenaba los datos. Si Google no responde, no frena el pago */
export async function horarioOcupado(slot: string): Promise<boolean> {
  try {
    const { inicio, fin } = inicioYFin(slot)
    return choca(slot, await aTiempo(ocupadoEnCalendarios(inicio - MARGEN_ANTES_MIN * MIN, fin), 6000, 'antes de cobrar'))
  } catch (err) {
    await avisarFallaGoogle(mensaje(err))
    return false
  }
}

// El registro: tabla bookings -----------------------------------------------------------------------------------------

/** Guarda el diagnóstico pagado (saveBooking). Una fila por pago: si ya estaba, no la repite */
export async function guardarBooking(b: DiagnosticBooking, ref: string): Promise<void> {
  const { error } = await createServiceClient()
    .from('bookings')
    .upsert(
      {
        orden: ref,
        slot_key: b.slot,
        nombre: b.firstName,
        apellido: b.lastName,
        telefono: b.phone,
        email: b.email,
        answers: b.answers,
        inicio: new Date(inicioYFin(b.slot).inicio).toISOString(),
      },
      { onConflict: 'orden', ignoreDuplicates: true },
    )
  if (error) throw new Error(`bookings: ${error.message}`)
}

async function marcarBooking(ref: string, cambio: Record<string, unknown>) {
  const { error } = await createServiceClient().from('bookings').update(cambio).eq('orden', ref)
  if (error) throw new Error(`bookings: ${error.message}`)
}

// El CRM ------------------------------------------------------------------------------------------------------------

/** La persona en el CRM (por su correo o su teléfono, o nueva), su cita con el enlace y la nota en su historial */
async function guardarEnCrm(b: DiagnosticBooking, ref: string, cita: CitaCreada): Promise<string> {
  const db = createServiceClient()
  const datos = contactoDelDiagnostico(b)
  const encontrados = await db.from('crm_identidades').select('canal, contacto_id').or(condicionesDeBusqueda(datos).join(','))
  if (encontrados.error) throw new Error(`crm_identidades: ${encontrados.error.message}`)
  let id = elegirContacto((encontrados.data ?? []) as { canal: string; contacto_id: string }[])
  if (id) {
    const actual = await db.from('crm_contactos').select('nombre, apellido, telefono, correo, etiquetas, campos').eq('id', id).maybeSingle()
    if (actual.error) throw new Error(`crm_contactos: ${actual.error.message}`)
    const cambio = actual.data ? completarContacto(actual.data as ContactoActual, datos) : null
    if (cambio) {
      const { error } = await db.from('crm_contactos').update(cambio).eq('id', id)
      if (error) throw new Error(`crm_contactos: ${error.message}`)
    }
  } else {
    const nuevo = await db.from('crm_contactos').insert(contactoNuevo(datos)).select('id').single()
    if (nuevo.error || !nuevo.data) throw new Error(`crm_contactos: ${nuevo.error?.message ?? 'sin fila'}`)
    id = nuevo.data.id as string
  }
  const pasos = await Promise.all([
    db.from('crm_identidades').upsert(identidadesDe(id, datos), { onConflict: 'canal,valor', ignoreDuplicates: true }),
    db.from('crm_citas').upsert(citaDelCrm(id, b, cita), { onConflict: 'google_id' }),
    db
      .from('crm_mensajes')
      .upsert(actividadDeLaCita(id, b, ref, new Date().toISOString()), { onConflict: 'origen,externo_id', ignoreDuplicates: true }),
  ])
  for (const p of pasos) if (p.error) throw new Error(`crm: ${p.error.message}`)
  return id
}

// El correo de confirmación -----------------------------------------------------------------------------------------

/** El correo con el enlace de Meet, por Resend. Una sola vez por pago (también si se reintenta) */
async function enviarConfirmacion(b: DiagnosticBooking, ref: string, cita: CitaCreada): Promise<void> {
  const r = redis()
  try {
    if (r && (await r.get(correoKey(ref)))) return
  } catch {
    // sin Redis, la clave de idempotencia de Resend evita el repetido
  }
  if (!process.env.RESEND_API_KEY) throw new Error('falta RESEND_API_KEY')
  const correo = correoDeConfirmacion({ idioma: b.locale, nombre: b.firstName, inicio: cita.inicio, meet: cita.meet })
  const { error } = await getResend().emails.send(
    { from: REMITENTE, to: b.email, replyTo: RESPONDER_A, subject: correo.asunto, html: correo.html, text: correo.texto },
    { idempotencyKey: `diagnostico-confirmacion/${ref}` },
  )
  if (error) throw new Error(`Resend: ${error.message}`)
  try {
    await r?.set(correoKey(ref), '1', { ex: TTL })
  } catch {
    // ya salió; a lo sumo un reintento lo frena Resend
  }
}

// La cita -------------------------------------------------------------------------------------------------------------

class CitaCancelada extends Error {}

/**
 * Crea en Google la cita de un diagnóstico pagado (con Meet y la persona invitada) y hace lo que sigue: el enlace en
 * bookings y en el CRM, el correo de confirmación y el aviso a Alejandro. Lanza solo si Google falla. Se puede repetir
 * sin duplicar nada: el evento tiene un id fijo por pago y el correo sale una sola vez.
 */
async function crearCita(b: DiagnosticBooking, ref: string, opciones: { recuperada?: boolean } = {}): Promise<CitaCreada> {
  const evento = await google().crear(cuentaAgenda(), eventoDelDiagnostico(b, ref))
  if (evento.status === 'cancelled') throw new CitaCancelada(`la cita ${evento.id} está cancelada en Google`)
  const meet = enlaceMeet(evento)
  if (!meet) throw new Error(`la cita ${evento.id} quedó sin enlace de Meet`)
  const { inicio, fin } = inicioYFin(b.slot)
  const cita: CitaCreada = { eventoId: evento.id, meet, inicio, fin }

  const [base, crm, correo] = await Promise.allSettled([
    marcarBooking(ref, { enlace: meet, evento_google: evento.id, cita: 'agendada' }),
    guardarEnCrm(b, ref, cita),
    enviarConfirmacion(b, ref, cita),
  ])
  const ojo: string[] = []
  if (base.status === 'rejected') ojo.push(`no quedó anotada en bookings (${mensaje(base.reason)})`)
  if (crm.status === 'rejected') ojo.push(`no quedó en el CRM (${mensaje(crm.reason)})`)
  for (const o of ojo) console.error(`[agenda] la cita ${ref} ${o}`)
  const nota = ojo.length ? `\n\nOjo: ${ojo.join('; ')}` : ''
  if (correo.status === 'rejected') {
    console.error(`[agenda] no salió el correo de confirmación de ${ref}:`, mensaje(correo.reason))
    await avisarPorTelegram(textoCorreoNoSalio(b, ref, meet, mensaje(correo.reason)) + nota, 'agenda')
  } else {
    await avisarPorTelegram(textoCitaNueva(b, ref, meet, opciones) + nota, 'agenda')
  }
  return cita
}

async function sacarDeLaCola(r: Redis | null, ref: string) {
  if (!r) return
  try {
    await r.zrem(COLA, ref)
    await r.del(pendienteKey(ref))
  } catch (err) {
    console.error(`[agenda] no se pudo sacar ${ref} de la cola:`, mensaje(err))
  }
}

/**
 * pushToCalendar del diagnóstico. Primero a la cola: si la función se corta a la mitad, el barrido la termina.
 * Después a Google; si falla, lanza y finalize llama a avisarSinCita.
 */
export async function agendarCita(b: DiagnosticBooking, ref: string): Promise<void> {
  const r = redis()
  if (r) {
    try {
      const pendiente = nuevaPendiente(ref, b, Date.now())
      await r.set(pendienteKey(ref), pendiente, { ex: TTL })
      await r.zadd(COLA, { score: pendiente.creadoEn, member: ref })
    } catch (err) {
      console.error(`[agenda] no se pudo poner ${ref} en la cola:`, mensaje(err))
    }
  }
  await crearCita(b, ref)
  await sacarDeLaCola(r, ref)
}

/** onUnbooked del diagnóstico: alguien pagó y quedó sin cita. Aviso a Alejandro, registro en bookings y, si fue Google, a reintentar */
export async function avisarSinCita(p: Unbooked): Promise<void> {
  const error = p.error === undefined ? undefined : mensaje(p.error)
  const pasos: Promise<unknown>[] = [
    avisarPorTelegram(textoSinCita(p.kind === 'conflict' ? 'conflicto' : 'calendario', p.booking, p.ref, error), 'agenda'),
    marcarBooking(p.ref, { cita: p.kind === 'conflict' ? 'conflicto' : 'pendiente' }),
  ]
  const r = redis()
  if (p.kind === 'calendar' && r) {
    pasos.push(
      (async () => {
        const previa = await r.get<Pendiente>(pendienteKey(p.ref))
        const pendiente = trasElAviso(previa, p.ref, p.booking, Date.now(), error)
        await r.set(pendienteKey(p.ref), pendiente, { ex: TTL })
        await r.zadd(COLA, { score: pendiente.creadoEn, member: p.ref })
      })(),
    )
  }
  for (const x of await Promise.allSettled(pasos)) {
    if (x.status === 'rejected') console.error(`[agenda] ${p.ref} quedó sin cita y algo del aviso falló:`, mensaje(x.reason))
  }
}

/**
 * El barrido de la cola (cada 10 min, con el de pagos): crea las citas que Google no dejó crear. Si llega la hora sin
 * cita, deja de intentar y avisa. Mientras siga fallando, vuelve a avisar cada 2 horas.
 */
export async function reintentarCitas(opciones: { limite?: number; minEdadMs?: number } = {}) {
  const r = redis()
  const resultados: Record<string, string> = {}
  if (!r) return { revisadas: 0, resultados }
  const ahora = Date.now()
  const refs = await r.zrange<string[]>(COLA, 0, ahora - (opciones.minEdadMs ?? ESPERA_MS), {
    byScore: true,
    offset: 0,
    count: opciones.limite ?? 10,
  })
  for (const ref of refs) {
    const p = await r.get<Pendiente>(pendienteKey(ref))
    if (!p) {
      await r.zrem(COLA, ref)
      continue
    }
    if (queHacer(p, ahora) === 'vencida') {
      await sacarDeLaCola(r, ref)
      await avisarPorTelegram(textoCitaVencida(p.booking, ref), 'agenda')
      resultados[ref] = 'vencida'
      continue
    }
    try {
      await crearCita(p.booking, ref, { recuperada: yaHabiaFallado(p) })
      await sacarDeLaCola(r, ref)
      resultados[ref] = 'agendada'
    } catch (err) {
      if (err instanceof CitaCancelada) {
        await sacarDeLaCola(r, ref)
        await avisarPorTelegram(textoCitaCancelada(p.booking, ref), 'agenda')
        resultados[ref] = 'cancelada'
        continue
      }
      const { pendiente, aviso } = trasFallar(p, ahora, mensaje(err))
      await r.set(pendienteKey(ref), pendiente, { ex: TTL })
      await marcarBooking(ref, { cita: 'pendiente' }).catch(() => {})
      if (aviso === 'primero') await avisarPorTelegram(textoSinCita('calendario', p.booking, ref, mensaje(err)), 'agenda')
      if (aviso === 'recordatorio') await avisarPorTelegram(textoSigueSinCita(p.booking, ref, pendiente.intentos, mensaje(err)), 'agenda')
      resultados[ref] = `falló: ${mensaje(err)}`
    }
  }
  return { revisadas: refs.length, resultados }
}

// Knox ----------------------------------------------------------------------------------------------------------------

/** Las citas de los calendarios entre dos momentos. La cuenta de la agenda tiene que responder; otra que falle se deja fuera */
export async function citasDeGoogle(desde: Date, hasta: Date): Promise<CitaDeCalendario[]> {
  const agenda = cuentaAgenda()
  const todas = cuentas()
  const g = google()
  const r = await Promise.allSettled(todas.map((c) => g.eventos(c, desde.getTime(), hasta.getTime())))
  const listas: EventoGoogle[][] = []
  for (const [i, x] of r.entries()) {
    if (x.status === 'fulfilled') listas.push(x.value)
    else if (todas[i].correo === agenda.correo) throw x.reason
    else console.error(`[agenda] no se pudo leer el calendario de ${todas[i].correo}:`, mensaje(x.reason))
  }
  return citasDeEventos(listas)
}
