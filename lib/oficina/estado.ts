// Lógica pura de la Oficina de Knox: estado de cada agente, números, «Para ti», «Lo próximo», su semana y el chat.
import type {
  Agente, DiaSemana, EstadoAgente, EstadoOficina, FilaSemana, LineaTertulia, LineaVisita, Marca, Numeros, Proximo, Pub, Snapshot,
} from './tipos.ts'
import { fechaCR, horaCR, siguienteCorrida } from './horario.ts'

export type FilaNumeros = { agente: string, tareas: number, segundos: number, ultima_falla: string | null, primera: string | null }
export type { Pub }

// Una revisión que corre cada hora o menos es «frecuente»: no sale en «Lo próximo» ni se corre al despertar
export const FRECUENTE_MIN = 60
const MIN = 60_000
const DIA = 24 * 60 * MIN
const t = (iso: string) => new Date(iso).getTime()

export function estadoDe(a: Agente, marcas: Marca[], ahora: Date, oficina: EstadoOficina, pendientes: Marca[]): EstadoAgente {
  const ms = marcas.filter((m) => m.agente === a.id)
  const ahoraMs = ahora.getTime()
  if (oficina.dormida && !a.despierto_siempre) return 'durmiendo'
  if (a.estado_fijo === 'pendiente') return 'pendiente'

  const ultimaDeCorrida = ms.reduce<Marca | null>(
    (mejor, m) => (m.tipo === 'empieza' || m.tipo === 'termina' || m.tipo === 'falla') && (!mejor || t(m.creado_en) > t(mejor.creado_en)) ? m : mejor, null)
  if (ultimaDeCorrida?.tipo === 'empieza') {
    return ahoraMs - t(ultimaDeCorrida.creado_en) > 2 * a.dura_min * MIN ? 'a-medias' : 'trabajando'
  }
  if (ms.some((m) => m.tipo === 'publica' && ahoraMs - t(m.creado_en) < 10 * MIN)) return 'publicando'

  const nueva = (tipo: Marca['tipo']) => ms.reduce((mx, m) => (m.tipo === tipo ? Math.max(mx, t(m.creado_en)) : mx), -Infinity)
  if (nueva('falla') > nueva('termina')) return 'fallo'
  if (pendientes.some((m) => m.agente === a.id && m.tipo === 'entrega')) return 'listo'
  if (a.estado_fijo === 'pedido') return 'pedido'
  return 'descansando'
}

export function numerosDe(fila: Omit<FilaNumeros, 'agente'> | undefined, ahora: Date): Numeros {
  if (!fila) return { tareas: 0, horas: 0, diasSinFallar: 0 }
  const desde = fila.ultima_falla ?? fila.primera
  const dias = desde ? Math.floor((ahora.getTime() - t(desde)) / DIA) : 0
  return {
    tareas: Number(fila.tareas),
    horas: Math.round(Number(fila.segundos) / 360) / 10,
    diasSinFallar: Math.max(0, dias),
  }
}

export function paraTi(entregas: Marca[], resueltas: Set<string>, ahora: Date): Marca[] {
  return entregas
    .filter((m) => {
      if (m.tipo !== 'entrega' || m.visto_en != null) return false
      const conRef = m.ref_tabla != null && m.ref_id != null
      if (conRef && resueltas.has(`${m.ref_tabla}:${m.ref_id}`)) return false
      return conRef || ahora.getTime() - t(m.creado_en) <= DIA
    })
    .sort((x, y) => t(y.creado_en) - t(x.creado_en))
}

// cuando: cómo se escribe la hora (la columna, solo la hora; en grande, con el día si no es hoy)
export function proximos(agentes: Agente[], pubs: Pub[], ahora: Date, n = 5, cuando: (d: Date) => string = horaCR): Proximo[] {
  const items: { real: Date, p: Proximo }[] = []
  for (const a of agentes) {
    if (a.cada_minutos != null && a.cada_minutos <= FRECUENTE_MIN) continue
    if (a.estado_fijo || !a.horario) continue
    const sig = siguienteCorrida(a.horario, ahora)
    if (!sig) continue
    items.push({ real: sig, p: { cuando: cuando(sig), agente: a.id, texto: a.oficio } })
  }
  for (const p of pubs) {
    const real = new Date(p.publicar_en)
    if (!(real.getTime() > ahora.getTime())) continue
    items.push({
      real,
      p: p.prueba
        ? { cuando: cuando(real), agente: 'vero', texto: `prueba de «${p.titulo}»` }
        : { cuando: cuando(real), agente: 'zap', texto: `«${p.titulo}»` },
    })
  }
  return items.sort((x, y) => x.real.getTime() - y.real.getTime()).slice(0, n).map((i) => i.p)
}

// Las etiquetas de la semana por día (domingo = 0); el último día dice «Hoy»
const INICIAL_DIA = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

// Sus últimos 7 días de Costa Rica, el último hoy: tareas terminadas y si hubo falla (0 y sin falla si no hay fila)
export function semanaDe(filas: FilaSemana[], agente: string, ahora: Date): DiaSemana[] {
  const mias = filas.filter((f) => f.agente === agente)
  return Array.from({ length: 7 }, (_, i) => {
    const dia = fechaCR(new Date(ahora.getTime() - (6 - i) * DIA))
    const delDia = mias.filter((f) => f.dia === dia)
    return {
      dia,
      etiqueta: i === 6 ? 'Hoy' : INICIAL_DIA[new Date(`${dia}T12:00:00Z`).getUTCDay()],
      tareas: delDia.reduce((s, f) => s + Number(f.tareas), 0),
      falla: delDia.some((f) => f.falla),
    }
  })
}

const ESCRIBIENDO_MS = 3 * MIN

// Mientras la oficina duerme no sale nada programado (el chat, el foro y las ideas) desde la hora en que se durmió:
// sale solo lo de antes de este corte. Despierta, no hay corte; dormida sin esa hora, no sale nada.
export function corteDormida(oficina: EstadoOficina): number {
  if (!oficina.dormida) return Infinity
  const desde = oficina.desde ? t(oficina.desde) : NaN
  return Number.isFinite(desde) ? desde : -Infinity
}

// La tertulia que se ve: las líneas de hoy que ya salieron, por hora. Dormida, nada desde que se durmió y nadie escribe;
// despierta, «escribiendo» es quien dice la próxima línea si sale en 3 min o menos.
export function chatVisible(lineas: LineaTertulia[], ahora: Date, oficina: EstadoOficina): { chat: LineaTertulia[], escribiendo: string | null } {
  const ahoraMs = ahora.getTime()
  const hoy = fechaCR(ahora)
  const corte = corteDormida(oficina)
  const porHora = [...lineas].sort((x, y) => t(x.mostrar_desde) - t(y.mostrar_desde))
  const chat = porHora.filter((l) => {
    const ms = t(l.mostrar_desde)
    return ms <= ahoraMs && ms < corte && fechaCR(new Date(ms)) === hoy
  })
  const proxima = oficina.dormida ? undefined : porHora.find((l) => t(l.mostrar_desde) > ahoraMs)
  const escribiendo = proxima && t(proxima.mostrar_desde) - ahoraMs <= ESCRIBIENDO_MS ? proxima.de : null
  return { chat, escribiendo }
}

// Las líneas de las visitas de hoy, también las que salen más tarde, sin su texto: la página mueve al visitante desde
// un minuto antes de que hable (repartirVisitas). Dormida, solo las de antes de dormirse (lo de después no sale).
export function visitasDelDia(lineas: LineaTertulia[], ahora: Date, oficina: EstadoOficina): LineaVisita[] {
  const hoy = fechaCR(ahora)
  const corte = corteDormida(oficina)
  return lineas
    .filter((l) => l.rincon === 'visita' && !!l.donde && !!l.hilo && fechaCR(new Date(l.mostrar_desde)) === hoy && t(l.mostrar_desde) < corte)
    .sort((x, y) => t(x.mostrar_desde) - t(y.mostrar_desde))
    .map(({ id, de, para, rincon, donde, hilo, mostrar_desde }) => ({ id, de, para, rincon, donde, hilo, mostrar_desde }))
}

// Las líneas de una visita van al chat de la página con rincon null (con su «donde» y su hilo): una página de antes
// (una pestaña abierta desde antes del cambio o la app de la Mac) no conoce el rincón 'visita' y su sala se caía con
// él. Quién está de visita sale de `visitas`, que lleva el rincón de verdad.
export function lineaParaLaPagina(l: LineaTertulia): LineaTertulia {
  return l.rincon === 'visita' ? { ...l, rincon: null } : l
}

export function armarSnapshot(d: {
  agentes: Agente[]
  marcas: Marca[]
  entregas: Marca[]
  numeros: FilaNumeros[]
  oficina: EstadoOficina
  pubs: Pub[]
  resueltas: Set<string>
  tertulia: LineaTertulia[]
  semana: FilaSemana[]
}, ahora: Date): Snapshot {
  const ids = new Set(d.agentes.map((a) => a.id))
  const marcas = d.marcas.filter((m) => ids.has(m.agente))
  const pendientes = paraTi(d.entregas.filter((m) => ids.has(m.agente)), d.resueltas, ahora)
  const tertulia = d.tertulia.filter((l) => ids.has(l.de))
  const { chat, escribiendo } = chatVisible(tertulia, ahora, d.oficina)
  return {
    ahora: ahora.toISOString(),
    oficina: d.oficina,
    agentes: d.agentes.map((a) => ({
      ...a,
      estado: estadoDe(a, marcas.filter((m) => m.agente === a.id), ahora, d.oficina, pendientes),
      numeros: numerosDe(d.numeros.find((f) => f.agente === a.id), ahora),
      semana: semanaDe(d.semana, a.id, ahora),
    })),
    marcas,
    paraTi: pendientes,
    proximos: proximos(d.agentes, d.pubs, ahora),
    chat: chat.map(lineaParaLaPagina),
    escribiendo,
    pubs: d.pubs
      .filter((p) => t(p.publicar_en) > ahora.getTime())
      .sort((x, y) => t(x.publicar_en) - t(y.publicar_en))
      .slice(0, 10),
    visitas: visitasDelDia(tertulia, ahora, d.oficina),
  }
}
