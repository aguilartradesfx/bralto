// La foto de grupo del foro: el tope semanal, el prompt y la corrida. Las dependencias entran por parámetro:
// aquí no se toca la base, el bucket ni Gemini (eso va en fotos-servidor.ts).
import { puedeCorrer } from './ronda.ts'

export const TOPE_FOTOS_SEMANA = 2

const MINUTO = 60_000
const DIA = 24 * 60 * MINUTO

// El lunes a las 00:00 de Costa Rica (UTC−6) de la semana de `ahora`.
export function inicioSemanaCR(ahora: Date): Date {
  const cr = new Date(ahora.getTime() - 6 * 60 * MINUTO)
  const atras = (cr.getUTCDay() + 6) % 7
  const medianoche = Date.UTC(cr.getUTCFullYear(), cr.getUTCMonth(), cr.getUTCDate())
  return new Date(medianoche - atras * DIA + 6 * 60 * MINUTO)
}

export function promptFotoGrupo(e: { titulo: string, donde: string, que: string }, nombres: string[]): string {
  const refs = nombres.map((n, i) => `reference image ${i + 1} is ${n}`).join('; ')
  return [
    `A realistic photograph taken at this place: ${e.donde}. The moment: ${e.que} (${e.titulo}).`,
    `The characters in the photo are ${nombres.join(', ')}. Each one must look exactly like its reference image, in this order: ${refs}.`,
    'Each character is about 1.5 m tall, like a person standing next to real furniture.',
    "The light of the place tints them the way it would tint real fabric: soft shadows, real folds, real texture.",
    'Never a 3D render, never CGI, never a plush toy.',
    'No text, no letters, no logos.',
  ].join('\n')
}

// Para cada id: `<id>.jpg`; si no está, la versión más alta de `<id>-v<n>.jpg`.
export function elegirArchivos(archivos: string[], ids: string[]): Record<string, string> {
  const salida: Record<string, string> = {}
  for (const id of ids) {
    if (archivos.includes(`${id}.jpg`)) { salida[id] = `${id}.jpg`; continue }
    let mejor = -1
    for (const a of archivos) {
      const m = /^(.+)-v(\d+)\.jpg$/.exec(a)
      if (m && m[1] === id && Number(m[2]) > mejor) { mejor = Number(m[2]); salida[id] = a }
    }
  }
  return salida
}

export type EscenaFoto = { de: string, titulo: string, donde: string, que: string, texto: string, likes: number }

// Una escena que espera su foto y que ninguna corrida reservó
export type EscenaEnEspera = { id: string, agentes: string[], escena: EscenaFoto, creada_en: string }

// Una escena espera su foto 7 días como mucho
const VIGENCIA_ESCENA_MS = 7 * DIA

// De las escenas que esperan su foto, toca la más nueva de los últimos 7 días; todas las demás se quedaron viejas y
// nunca se hacen, para que las fotos no se atrasen. Sin ninguna de los últimos 7 días, no toca ninguna.
// La ronda usa lo mismo para saber si ya hay una escena esperando.
export function escenaPendiente<T extends { id: string, creada_en: string }>(enEspera: T[], ahora: Date): { escena: T | null, viejas: string[] } {
  const desde = ahora.getTime() - VIGENCIA_ESCENA_MS
  const cuando = (x: T) => Date.parse(x.creada_en)
  let escena: T | null = null
  for (const x of enEspera) {
    if (!(cuando(x) >= desde)) continue
    if (!escena || cuando(x) > cuando(escena) || (cuando(x) === cuando(escena) && x.id > escena.id)) escena = x
  }
  return { escena, viejas: enEspera.filter(x => x !== escena).map(x => x.id) }
}

export type DepsFoto = {
  dormida(): Promise<boolean>
  intentosDesde(d: Date): Promise<number>
  escenasEnEspera(): Promise<EscenaEnEspera[]>
  // Las pasa a «falla» («Se quedó vieja») sin pagar ni reservar nada; solo las que siguen esperando
  vencerEscenas(ids: string[]): Promise<void>
  retratos(ids: string[]): Promise<Record<string, Uint8Array>>
  // Reserva la escena de forma atómica: false si otra corrida la tomó primero
  marcarIntento(id: string, cuando: Date): Promise<boolean>
  soltarIntento(id: string): Promise<void>
  generar(prompt: string, refs: Uint8Array[], id: string): Promise<Uint8Array>
  guardarFoto(id: string, img: Uint8Array): Promise<void>
  fallar(id: string, detalle: string): Promise<void>
}

export type SalidaFoto = { resultado: 'hecha' | 'tope' | 'nada' | 'dormida' | 'falla', detalle: string }

const nombreDe = (id: string) => id.charAt(0).toUpperCase() + id.slice(1)
const mensaje = (e: unknown) => (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim().slice(0, 200)

export async function correrFotoGrupo(deps: DepsFoto, ahora: Date, simular = false): Promise<SalidaFoto> {
  if (!simular) {
    if (!puedeCorrer(ahora)) return { resultado: 'nada', detalle: 'Fuera de hora' }
    if (await deps.dormida()) return { resultado: 'dormida', detalle: 'La oficina dormía' }
  }
  const intentos = await deps.intentosDesde(inicioSemanaCR(ahora))
  if (intentos >= TOPE_FOTOS_SEMANA) {
    return { resultado: 'tope', detalle: `Ya van ${intentos} fotos de grupo esta semana; la escena espera a la otra` }
  }
  const { escena: pendiente, viejas } = escenaPendiente(await deps.escenasEnEspera(), ahora)
  // Las viejas no se reservan ni se pagan; si anotarlas falla, se avisa y la foto de hoy sigue igual
  if (viejas.length && !simular) {
    try { await deps.vencerEscenas(viejas) } catch (e) { console.error('[oficina] vencer escenas viejas', mensaje(e)) }
  }
  if (!pendiente) return { resultado: 'nada', detalle: 'No hay escena pendiente' }

  const { id, agentes, escena } = pendiente
  const fotos = await deps.retratos(agentes)
  const falta = agentes.find(a => !fotos[a])
  if (falta) {
    const detalle = `Falta el retrato de ${nombreDe(falta)}`
    if (simular) return { resultado: 'falla', detalle }
    await deps.fallar(id, detalle)
    return { resultado: 'falla', detalle }
  }
  const prompt = promptFotoGrupo(escena, agentes.map(nombreDe))
  if (simular) return { resultado: 'nada', detalle: `Simulación: haría la foto «${escena.titulo}» con ${agentes.join(', ')} (${intentos} de ${TOPE_FOTOS_SEMANA} esta semana)` }

  if (await deps.dormida()) return { resultado: 'dormida', detalle: 'La oficina se durmió antes de la foto' }
  // El intento se anota antes de pagar: si algo se rompe después, igual cuenta contra el tope
  if (!await deps.marcarIntento(id, ahora)) return { resultado: 'nada', detalle: 'Otra corrida ya la tomó' }
  // Con la reserva hecha se cuenta otra vez: dos corridas a la vez no pueden pasar del tope
  const ahoraVan = await deps.intentosDesde(inicioSemanaCR(ahora))
  if (ahoraVan > TOPE_FOTOS_SEMANA) {
    await deps.soltarIntento(id)
    return { resultado: 'tope', detalle: `Ya van ${ahoraVan - 1} fotos de grupo esta semana; la escena espera a la otra` }
  }
  try {
    const img = await deps.generar(prompt, agentes.map(a => fotos[a]), id)
    await deps.guardarFoto(id, img)
    return { resultado: 'hecha', detalle: escena.titulo }
  } catch (e) {
    const detalle = mensaje(e)
    try { await deps.fallar(id, detalle) } catch (e2) { console.error('[oficina] fallar foto', e2) }
    return { resultado: 'falla', detalle }
  }
}
