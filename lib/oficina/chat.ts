// El chat de la Oficina: lo que pasó de verdad hoy (las marcas que cuentan algo), la tertulia del día y lo que dicen
// dormidos (las frases de sueño las arma la página mientras la oficina duerme: tipo 'sueno'), por hora.
// Puro: lo usa components/oficina y se prueba con node --test.
import type { LineaTertulia, Marca, RinconChat } from './tipos.ts'
import { fechaCR } from './horario.ts'

export type LineaChat = {
  id: string
  de: string
  para: string | null // otro Knox, 'ale' o nadie
  texto: string
  cuando: string // ISO
  tipo: 'marca' | 'tertulia' | 'sueno'
  idea_id: string | null
  // dónde se dijo (solo en la tertulia): el café, la plática de la sala o, con `donde`, de visita en la oficina de ese
  // Knox (en la página, las líneas de una visita llegan con rincon null y su `donde`)
  rincon: RinconChat | null
  donde: string | null
}

// «empieza» y «saltada» no se cuentan: no dicen nada que haya pasado
const CUENTAN = new Set<Marca['tipo']>(['pasa', 'entrega', 'termina', 'falla', 'publica'])
// Tope de seguridad: el chat se queda con las líneas más nuevas (un día normal no llega ni cerca)
export const CHAT_MAX = 120
const ms = (iso: string) => new Date(iso).getTime()

// suenos: las de la página, tal como vienen (son de este rato y ya traen su tope)
export function lineasDelChat(marcas: Marca[], tertulia: LineaTertulia[], ahora: Date, suenos: LineaChat[] = []): LineaChat[] {
  const hoy = fechaCR(ahora)
  const deHoy = (iso: string) => fechaCR(new Date(iso)) === hoy
  const deMarcas: LineaChat[] = marcas
    .filter((m) => CUENTAN.has(m.tipo) && deHoy(m.creado_en))
    .map((m) => ({
      id: m.id,
      de: m.agente,
      // lo que te dejan es para ti; lo que se pasan, para quien lo recibe
      para: m.tipo === 'entrega' ? 'ale' : m.tipo === 'pasa' ? m.para : null,
      texto: m.texto,
      cuando: m.creado_en,
      tipo: 'marca',
      idea_id: null,
      rincon: null,
      donde: null,
    }))
  const deTertulia: LineaChat[] = tertulia
    .filter((l) => deHoy(l.mostrar_desde) && ms(l.mostrar_desde) <= ahora.getTime())
    .map((l) => ({
      id: l.id, de: l.de, para: l.para, texto: l.texto, cuando: l.mostrar_desde, tipo: 'tertulia', idea_id: l.idea_id,
      rincon: l.rincon ?? null, donde: l.donde ?? null,
    }))
  // el orden es estable: a la misma hora, la marca va antes que lo que comentan de ella
  return [...deMarcas, ...deTertulia, ...suenos].sort((a, b) => ms(a.cuando) - ms(b.cuando)).slice(-CHAT_MAX)
}

// Dónde fue, discreto, al lado de quién habla: «en la oficina de Lynx» (si trae `donde`), «en el café» o «en la sala»
// (null: sin lugar)
export function dondeLinea(l: Pick<LineaChat, 'rincon' | 'donde'>, nombreDe: (id: string) => string): string | null {
  if (l.donde) return `en la oficina de ${nombreDe(l.donde)}`
  if (l.rincon === 'cafe') return 'en el café'
  if (l.rincon === 'platica') return 'en la sala'
  return null
}
