// Lógica pura de la Oficina de Knox: estado de cada agente, números, «Para ti» y «Lo próximo».
import type { Agente, EstadoAgente, EstadoOficina, Marca, Numeros, Proximo, Snapshot } from './tipos.ts'
import { horaCR, siguienteCorrida } from './horario.ts'

export type FilaNumeros = { agente: string, tareas: number, segundos: number, ultima_falla: string | null, primera: string | null }
export type Pub = { id: string, titulo: string, publicar_en: string, prueba: boolean }

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

export function proximos(agentes: Agente[], pubs: Pub[], ahora: Date, n = 5): Proximo[] {
  const items: { real: Date, p: Proximo }[] = []
  for (const a of agentes) {
    if (a.cada_minutos != null && a.cada_minutos <= FRECUENTE_MIN) continue
    if (a.estado_fijo || !a.horario) continue
    const sig = siguienteCorrida(a.horario, ahora)
    if (!sig) continue
    items.push({ real: sig, p: { cuando: horaCR(sig), agente: a.id, texto: a.oficio } })
  }
  for (const p of pubs) {
    const real = new Date(p.publicar_en)
    if (!(real.getTime() > ahora.getTime())) continue
    items.push({
      real,
      p: p.prueba
        ? { cuando: horaCR(real), agente: 'vero', texto: `prueba de «${p.titulo}»` }
        : { cuando: horaCR(real), agente: 'zap', texto: `«${p.titulo}»` },
    })
  }
  return items.sort((x, y) => x.real.getTime() - y.real.getTime()).slice(0, n).map((i) => i.p)
}

export function armarSnapshot(d: {
  agentes: Agente[]
  marcas: Marca[]
  entregas: Marca[]
  numeros: FilaNumeros[]
  oficina: EstadoOficina
  pubs: Pub[]
  resueltas: Set<string>
}, ahora: Date): Snapshot {
  const ids = new Set(d.agentes.map((a) => a.id))
  const marcas = d.marcas.filter((m) => ids.has(m.agente))
  const pendientes = paraTi(d.entregas.filter((m) => ids.has(m.agente)), d.resueltas, ahora)
  return {
    ahora: ahora.toISOString(),
    oficina: d.oficina,
    agentes: d.agentes.map((a) => ({
      ...a,
      estado: estadoDe(a, marcas.filter((m) => m.agente === a.id), ahora, d.oficina, pendientes),
      numeros: numerosDe(d.numeros.find((f) => f.agente === a.id), ahora),
    })),
    marcas,
    paraTi: pendientes,
    proximos: proximos(d.agentes, d.pubs, ahora),
  }
}
