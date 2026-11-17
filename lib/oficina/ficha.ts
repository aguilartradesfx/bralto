// La ficha de un Knox, en palabras: qué hace ahora, lo que marcó hoy, lo próximo (con su botón), dónde trabaja, lo
// último que escribió en el foro y sus fotos. Puro: lo usa components/oficina y se prueba con node --test.
import type { Agente, AgenteSnap, Foto, Marca, Post, Pub } from './tipos.ts'
import { textoSala, type LugarSala } from './sala.ts'
import { textoVisita } from './visitas.ts'
import { FRECUENTE_MIN } from './estado.ts'
import { siguienteCorrida } from './horario.ts'
import { cuandoCR, diaCR, enlaceSeguro, lasCR, lineaAhora, momentoCR, proximoDe } from './pagina.ts'

const t = (iso: string) => new Date(iso).getTime()
const frecuente = (a: Agente) => a.cada_minutos != null && a.cada_minutos <= FRECUENTE_MIN
const porId = (x: { id: string }, y: { id: string }) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0)

// A los «cuando lo pidas» se les pide en Claude Code, en la compu: la ficha no tiene botón para pedirles nada
const SE_LO_PIDES = 'Se lo pides a Claude en tu compu'

// «Ahora» en la ficha (y en «Ahora» al lado o en grande), en este orden: la oficina dormida; lo que tiene en marcha;
// de visita en la oficina de otro; la sala; los que todavía no empiezan o esperan que les pidas algo; los que revisan
// cada pocos minutos; hasta cuándo descansa.
export function ahoraFicha(
  a: AgenteSnap,
  d: {
    marcas: Marca[]
    paraTi: Marca[]
    ahora: Date
    dormida: boolean
    lugar: LugarSala | null
    visita?: { anfitrion: string } | null // repartirVisitas
    nombreDe(id: string): string
  },
): string {
  if (d.dormida) return !a.despierto_siempre ? 'Duerme en su escritorio' : a.id === 'echo' ? 'Atiende a la gente' : 'De guardia'
  const enMarcha = lineaAhora(a, d.marcas, d.paraTi, d.ahora)
  if (enMarcha) return enMarcha
  if (d.visita) return textoVisita(d.visita, d.nombreDe)
  if (d.lugar) return textoSala(d.lugar, d.nombreDe)
  if (a.estado_fijo === 'pendiente') return 'Todavía no trabaja. Llega pronto.'
  if (a.estado_fijo === 'pedido') return SE_LO_PIDES
  if (frecuente(a)) return proximoDe(a, d.ahora, false)
  const sig = a.horario ? siguienteCorrida(a.horario, d.ahora) : null
  if (!sig) return 'Descansa hasta que le llegue trabajo'
  return 'Descansa hasta ' + (diaCR(sig.getTime()) === diaCR(d.ahora.getTime()) ? lasCR(sig) : cuandoCR(sig, d.ahora))
}

// «Hoy»: sus marcas de hoy (el día de Costa Rica), de la más vieja a la más nueva
export function marcasDeHoy(id: string, marcas: Marca[], ahora: Date): Marca[] {
  const hoy = diaCR(ahora.getTime())
  return marcas.filter((m) => m.agente === id && diaCR(t(m.creado_en)) === hoy).sort((x, y) => t(x.creado_en) - t(y.creado_en))
}

// ---------- Lo próximo ----------
export type ProximoFicha = { cuando: string; texto: string; href: string | null; boton: 'Abrir' | 'Ver en el Calendario' | null }

const CORRIDAS = 2

// Sus 2 próximas corridas (con su oficio y «Abrir» a su lugar) y, de Zap, las publicaciones que no son prueba y, de Vero,
// las pruebas («Ver en el Calendario»), por hora y n como mucho. Nada si la oficina duerme, si todavía no empieza o si
// espera que le pidas algo. Quien revisa cada hora o menos no lista sus corridas (la ficha dice cada cuánto), pero Zap y
// Vero, que revisan cada pocos minutos, sí traen lo que sale: si no, «Ver en el Calendario» nunca saldría.
export function proximosDeAgente(a: Agente, pubs: Pub[], ahora: Date, dormida: boolean, n = 3): ProximoFicha[] {
  if (dormida || a.estado_fijo === 'pendiente' || a.estado_fijo === 'pedido') return []
  const items: { ms: number; p: ProximoFicha }[] = []
  if (a.horario && !frecuente(a)) {
    const lugar = lugarDe(a.lugar)
    let desde = ahora
    for (let i = 0; i < CORRIDAS; i++) {
      const sig = siguienteCorrida(a.horario, desde)
      if (!sig) break
      items.push({
        ms: sig.getTime(),
        p: { cuando: momentoCR(sig, ahora), texto: a.oficio, href: lugar?.href ?? null, boton: lugar ? 'Abrir' : null },
      })
      desde = sig
    }
  }
  if (a.id === 'zap' || a.id === 'vero') {
    const pruebas = a.id === 'vero'
    for (const p of pubs) {
      const ms = t(p.publicar_en)
      if (!!p.prueba !== pruebas || !(ms > ahora.getTime())) continue
      items.push({
        ms,
        p: { cuando: momentoCR(new Date(ms), ahora), texto: `Sale «${p.titulo}»`, href: `/calendario/${encodeURIComponent(p.id)}`, boton: 'Ver en el Calendario' },
      })
    }
  }
  return items.sort((x, y) => x.ms - y.ms).slice(0, n).map((i) => i.p)
}

// La línea sin hora de «Lo próximo»: a los «cuando lo pidas» se les pide en la compu; quien revisa cada pocos minutos
// dice cada cuánto (Zap y Vero, encima de lo que sale), sin «última vez»: eso ya pasó y sale en «Ahora»; sin lista, lo
// de proximoDe. null: solo va la lista.
export function notaProximo(a: Agente, lista: ProximoFicha[], ahora: Date, dormida: boolean): string | null {
  if (a.estado_fijo === 'pedido') return SE_LO_PIDES
  if (frecuente(a)) return proximoDe({ ...a, ultima_revision: null }, ahora, dormida)
  return lista.length ? null : proximoDe(a, ahora, dormida)
}

// ---------- Dónde trabaja ----------
const RUTAS: Record<string, [string, string]> = {
  '/calendario': ['el Calendario', 'Abrir el Calendario'],
  '/analisis': ['Análisis de reels', 'Abrir Análisis'],
  '/ideas': ['Ideas', 'Abrir Ideas'],
  '/crm/mensajes': ['Mensajes', 'Abrir Mensajes'],
  '/contratos': ['Contratos', 'Abrir Contratos'],
}
const CENTRO = /^https:\/\/knox\.bralto\.io(?=$|[/?#])/i
const INSTAGRAM = /^https:\/\/(?:www\.)?instagram\.com\//i

// El botón a su lugar (texto: cómo se dice en «Lo que hace queda en …»). null: sin lugar o con uno que no es seguro,
// y entonces no sale botón. Como en el catálogo, una ruta del panel o un enlace https (http no).
export function lugarDe(lugar: string | null): { texto: string; boton: string; href: string } | null {
  if (!enlaceSeguro(lugar) || /^http:/i.test(lugar)) return null
  const fijo = Object.hasOwn(RUTAS, lugar) ? RUTAS[lugar] : null
  if (fijo) return { texto: fijo[0], boton: fijo[1], href: lugar }
  if (CENTRO.test(lugar)) return { texto: 'el centro de Knox', boton: 'Abrir el centro de Knox', href: lugar }
  if (INSTAGRAM.test(lugar)) return { texto: 'Instagram', boton: 'Abrir Instagram', href: lugar }
  return { texto: 'su lugar', boton: 'Abrir', href: lugar }
}

// ---------- En el foro ----------
// cuando: la hora de lo que escribió (ISO). De un post se dice su título; de un comentario, su texto.
export type EnElForo = { postId: string; texto: string; como: 'Publicó' | 'Comentó'; cuando: string }

export function ultimoEnForo(id: string, foro: Post[]): EnElForo | null {
  let mejor: EnElForo | null = null
  let mejorMs = -Infinity
  for (const p of foro) {
    const suyos: EnElForo[] = []
    if (p.de === id) suyos.push({ postId: p.id, texto: p.titulo || p.texto, como: 'Publicó', cuando: p.mostrar_desde })
    for (const c of p.comentarios) if (c.de === id) suyos.push({ postId: p.id, texto: c.texto, como: 'Comentó', cuando: c.mostrar_desde })
    for (const x of suyos) {
      const ms = t(x.cuando)
      if (ms > mejorMs) {
        mejor = x
        mejorMs = ms
      }
    }
  }
  return mejor
}

// ---------- Sus fotos ----------
// Fotos de la más nueva a la más vieja. Las fotos no traen fecha: cuenta la del post del foro que la publicó (foto_id).
// Una foto sin post (ya no está entre los del foro) va al final, por id.
export function masNuevasPrimero(fotos: Foto[], foro: Post[]): Foto[] {
  const publicada = new Map<string, number>()
  for (const p of foro) {
    const ms = t(p.mostrar_desde)
    if (!p.foto_id || !Number.isFinite(ms)) continue
    const antes = publicada.get(p.foto_id)
    if (antes == null || ms < antes) publicada.set(p.foto_id, ms)
  }
  return [...fotos].sort((x, y) => {
    const a = publicada.get(x.id), b = publicada.get(y.id)
    if (a != null && b != null) return b - a || porId(x, y)
    return a != null ? -1 : b != null ? 1 : porId(x, y)
  })
}

// Su retrato primero y después las de grupo donde sale, de la más nueva a la más vieja
export function fotosDe(id: string, fotos: Foto[], foro: Post[]): Foto[] {
  const retrato = fotos.filter((f) => f.tipo === 'retrato' && f.agentes[0] === id)
  return [...retrato, ...masNuevasPrimero(fotos.filter((f) => f.tipo === 'grupo' && f.agentes.includes(id)), foro)]
}
