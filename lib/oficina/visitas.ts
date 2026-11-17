// Las visitas de la Oficina: cuando una charla de la tertulia es «visita», el que llega camina a la oficina del otro,
// se queda mientras platican y después vuelve a su lugar. Puro: solo depende de los datos y de la hora, así que todos
// los que miran la oficina ven lo mismo (como la sala).
// Las líneas de visita las arma el servidor (visitasDelDia, en estado.ts): las de hoy, también las que salen más tarde.
import type { AgenteSnap, LineaVisita } from './tipos.ts'
import { libreParaSala } from './sala.ts'

// anfitrion: en la oficina de quién está; desde y hasta: el rato de la visita (ISO)
export type Visita = { anfitrion: string, hilo: string, desde: string, hasta: string }

const MIN = 60_000
export const ANTES_MIN = 1 // llega un minuto antes de la primera línea
export const DESPUES_MIN = 4 // y se queda hasta 4 minutos después de la última

const ms = (iso: string) => new Date(iso).getTime()

// Quién está de visita y en qué oficina, ahora: desde 1 minuto antes de la primera línea del hilo hasta 4 minutos
// después de la última. Solo si la oficina no duerme, el anfitrión existe y el visitante está libre con la regla de la
// sala (descansa, te dejó algo o espera que le pidas algo, y no trabaja en los próximos 10 min). Una visita por
// visitante: la más nueva.
export function repartirVisitas(d: { lineas: LineaVisita[], agentes: AgenteSnap[], ahora: Date, dormida: boolean }): Record<string, Visita> {
  const visitas: Record<string, Visita> = {}
  if (d.dormida) return visitas
  const porId = new Map(d.agentes.map((a) => [a.id, a]))
  const hilos = new Map<string, { anfitrion: string, visitante: string, primera: number, ultima: number }>()
  for (const l of d.lineas) {
    if (l.rincon !== 'visita' || !l.hilo || !l.donde) continue
    const t = ms(l.mostrar_desde)
    if (!Number.isFinite(t)) continue
    const h = hilos.get(l.hilo)
    if (h) {
      h.primera = Math.min(h.primera, t)
      h.ultima = Math.max(h.ultima, t)
      continue
    }
    // el visitante es el de la charla que no es el anfitrión
    const visitante = l.de !== l.donde ? l.de : l.para
    if (!visitante || visitante === l.donde) continue
    hilos.set(l.hilo, { anfitrion: l.donde, visitante, primera: t, ultima: t })
  }
  const ahoraMs = d.ahora.getTime()
  const elegida = new Map<string, { hilo: string, primera: number }>()
  for (const [hilo, h] of hilos) {
    const desde = h.primera - ANTES_MIN * MIN, hasta = h.ultima + DESPUES_MIN * MIN
    if (ahoraMs < desde || ahoraMs >= hasta) continue
    const quien = porId.get(h.visitante)
    if (!quien || !porId.has(h.anfitrion) || !libreParaSala(quien, d.ahora)) continue
    const antes = elegida.get(h.visitante)
    if (antes && (antes.primera > h.primera || (antes.primera === h.primera && antes.hilo > hilo))) continue
    elegida.set(h.visitante, { hilo, primera: h.primera })
    visitas[h.visitante] = { anfitrion: h.anfitrion, hilo, desde: new Date(desde).toISOString(), hasta: new Date(hasta).toISOString() }
  }
  return visitas
}

// Lo que dice la ficha de quien está de visita
export function textoVisita(v: Pick<Visita, 'anfitrion'>, nombreDe: (id: string) => string): string {
  return `De visita en la oficina de ${nombreDe(v.anfitrion)}`
}
