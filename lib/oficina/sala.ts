// La sala de la Oficina: quién va a tomarse un café, a platicar o a dormir siesta, y qué dice la ficha de quien está ahí.
// Puro: solo depende de los datos y de la hora, así que todos los que miran la oficina ven lo mismo.
import type { Agente, AgenteSnap, EstadoAgente, LineaTertulia, Rincon } from './tipos.ts'
import { CUPO } from './mundo.ts'
import { FRECUENTE_MIN } from './estado.ts'
import { aLaHoraCR, fechaCR, horaDecimalCR, siguienteCorrida } from './horario.ts'
import { lasCR } from './pagina.ts'
import { fnv1a } from './social.ts'

// rincon y sitio: dónde se sienta; con: con quién vino (solo los de la tertulia); hasta: cuándo se le acaba el rato
export type LugarSala = { rincon: Rincon, sitio: number, con: string | null, hasta: string | null, por: 'tertulia' | 'siesta' | 'turno' }

const MIN = 60_000
const AVISO_MIN = 10 // quien trabaja en 10 min o menos no va
const TERTULIA_MIN = 20 // una línea de la tertulia los junta 20 min
const TURNO_MAX = 2
const SIESTA_DESDE = 13, SIESTA_HASTA = 16 // de 1:00 a 4:00 p. m.
const LIBRES = new Set<EstadoAgente>(['descansando', 'listo', 'pedido'])

const frecuente = (a: Agente) => a.cada_minutos != null && a.cada_minutos <= FRECUENTE_MIN
const ms = (iso: string) => new Date(iso).getTime()
// orden fijo por una clave (y por id si dos claves chocan)
const porClave = <T extends { id: string }>(clave: (x: T) => string) => (x: T, y: T) => {
  const a = clave(x), b = clave(y)
  return a < b ? -1 : a > b ? 1 : x.id < y.id ? -1 : x.id > y.id ? 1 : 0
}

// Libre: descansa, te dejó algo o espera que le pidas algo, y no trabaja en los próximos 10 min. A los que revisan cada
// hora o menos no se les mira la próxima revisión: una revisión vacía no es trabajo.
export function libreParaSala(a: AgenteSnap, ahora: Date): boolean {
  if (!LIBRES.has(a.estado)) return false
  if (frecuente(a) || !a.horario) return true
  const sig = siguienteCorrida(a.horario, ahora)
  return !sig || sig.getTime() - ahora.getTime() > AVISO_MIN * MIN
}

// De noche: sin estado fijo, no frecuente, y su próxima corrida cae entre las 7:00 p. m. y las 6:59 a. m. de Costa Rica,
// o es del servidor sin horario (las piezas de la noche)
export function deNoche(a: Agente, ahora: Date): boolean {
  if (a.estado_fijo || frecuente(a)) return false
  if (!a.horario) return a.donde === 'servidor'
  const sig = siguienteCorrida(a.horario, ahora)
  if (!sig) return false
  const h = horaDecimalCR(sig)
  return h >= 19 || h < 7
}

// Un rato de la tertulia: las líneas que ya salieron de una charla (su hilo) o una línea suelta con rincón. grupo: quien
// abrió y a quien le habló (si es un Knox), en ese orden; ultima: la hora de su línea más nueva.
type Encuentro = { clave: string, rincon: 'cafe' | 'platica' | 'visita', grupo: string[], ultima: number }

function encuentros(lineas: LineaTertulia[], ahoraMs: number, ids: Set<string>): Encuentro[] {
  const porClave = new Map<string, Encuentro & { primera: number }>()
  for (const l of lineas) {
    const t = ms(l.mostrar_desde)
    // a la página, las líneas de una visita le llegan con rincon null y su «donde» (el anfitrión)
    const rincon = l.rincon ?? (l.donde ? 'visita' : null)
    if (rincon !== 'cafe' && rincon !== 'platica' && rincon !== 'visita') continue
    if (!(t <= ahoraMs)) continue
    const clave = l.hilo ? `h:${l.hilo}` : `l:${l.id}`
    const grupo = l.para && l.para !== l.de && ids.has(l.para) ? [l.de, l.para] : [l.de]
    const e = porClave.get(clave)
    if (!e) porClave.set(clave, { clave, rincon, grupo, ultima: t, primera: t })
    else {
      e.ultima = Math.max(e.ultima, t)
      // el que abrió la charla queda primero: así nadie cambia de sitio con cada línea
      if (t < e.primera) { e.primera = t; e.grupo = grupo; e.rincon = rincon }
    }
  }
  return [...porClave.values()].map(({ primera: _, ...e }) => e)
}

// Quién está en la sala y dónde, en este orden:
// 1. dormida, nadie;
// 2. solo los libres; quien está de visita (o recibe una) se queda en esa oficina;
// 3. la tertulia: cada charla (o línea suelta) al café o a la plática con una línea de hace menos de 20 min, de la más
//    nueva a la más vieja, junta a los dos en su rincón, en el orden en que abrieron la charla, hasta 20 min después de
//    su última línea. Si uno no está libre o ya tiene lugar, si alguno ya está en un rato más nuevo (otra charla o una
//    visita), o si no caben los dos, no va ninguno: se quedan platicando desde su escritorio (tampoco van de siesta ni de
//    turno, así la pareja nunca se parte). Las visitas no van a la sala;
// 4. la siesta: de 1:00 a 4:00 p. m., los de noche que queden, en su orden del día, hasta llenar el rincón;
// 5. de turno: hasta 2 más, en el orden de su media hora; las pares a la plática y las impares al café (o al otro, si
//    está lleno). Cada uno toma el primer sitio libre de su rincón; si no hay, se queda en su escritorio.
export function repartirSala(d: {
  agentes: AgenteSnap[]
  lineas: LineaTertulia[]
  ahora: Date
  dormida: boolean
  visitas?: Record<string, { anfitrion: string }> // repartirVisitas
}): Record<string, LugarSala> {
  const lugares: Record<string, LugarSala> = {}
  if (d.dormida) return lugares
  const ahoraMs = d.ahora.getTime()
  const ids = new Set(d.agentes.map((a) => a.id))
  const deVisita = new Set(Object.entries(d.visitas ?? {}).flatMap(([id, v]) => [id, v.anfitrion]))
  const libres = new Set(d.agentes.filter((a) => libreParaSala(a, d.ahora) && !deVisita.has(a.id)).map((a) => a.id))
  const usados: Record<Rincon, Set<number>> = { cafe: new Set(), platica: new Set(), siesta: new Set() }
  const campo = (r: Rincon) => CUPO[r] - usados[r].size
  function sentar(id: string, rincon: Rincon, con: string | null, hasta: string, por: LugarSala['por']) {
    let sitio = 0
    while (usados[rincon].has(sitio)) sitio++
    usados[rincon].add(sitio)
    lugares[id] = { rincon, sitio, con, hasta, por }
  }

  // de la más nueva a la más vieja; el rato más nuevo de cada uno es el que cuenta
  const todos = encuentros(d.lineas, ahoraMs, ids).sort((x, y) => y.ultima - x.ultima || (x.clave < y.clave ? -1 : x.clave > y.clave ? 1 : 0))
  const ultimoDe = new Map<string, string>()
  for (const e of todos) for (const id of e.grupo) if (!ultimoDe.has(id)) ultimoDe.set(id, e.clave)
  const enCharla = new Set<string>() // los de un rato que no pudo ir
  for (const e of todos) {
    if (e.rincon === 'visita' || ahoraMs - e.ultima >= TERTULIA_MIN * MIN) continue
    const rincon: Rincon = e.rincon
    const { grupo } = e
    if (!grupo.every((id) => libres.has(id) && !lugares[id] && ultimoDe.get(id) === e.clave) || campo(rincon) < grupo.length) {
      grupo.forEach((id) => enCharla.add(id))
      continue
    }
    const hasta = new Date(e.ultima + TERTULIA_MIN * MIN).toISOString()
    for (const id of grupo) sentar(id, rincon, grupo.find((o) => o !== id) ?? null, hasta, 'tertulia')
  }
  const quedan = () => d.agentes.filter((a) => libres.has(a.id) && !lugares[a.id] && !enCharla.has(a.id))

  const fecha = fechaCR(d.ahora), hora = horaDecimalCR(d.ahora)
  if (hora >= SIESTA_DESDE && hora < SIESTA_HASTA) {
    const hasta = aLaHoraCR(d.ahora, SIESTA_HASTA, 0).toISOString()
    const dormilones = quedan().filter((a) => deNoche(a, d.ahora)).sort(porClave((a) => fnv1a(`${fecha}:siesta:${a.id}`)))
    for (const a of dormilones.slice(0, campo('siesta'))) sentar(a.id, 'siesta', null, hasta, 'siesta')
  }

  const media = Math.floor(hora * 2) // la media hora del día: 0 a 47
  const fin = aLaHoraCR(d.ahora, Math.floor((media + 1) / 2), ((media + 1) % 2) * 30).toISOString()
  const prefiere: Rincon = media % 2 === 0 ? 'platica' : 'cafe'
  const otro: Rincon = prefiere === 'platica' ? 'cafe' : 'platica'
  for (const a of quedan().sort(porClave((a) => fnv1a(`${fecha}:${media}:${a.id}`))).slice(0, TURNO_MAX)) {
    const rincon = campo(prefiere) > 0 ? prefiere : campo(otro) > 0 ? otro : null
    if (rincon) sentar(a.id, rincon, null, fin, 'turno')
  }
  return lugares
}

// Lo que dice la ficha de quien está en la sala: «Tomándose un café con Quark», «Descansando en los sillones»…
export function textoSala(l: LugarSala, nombreDe: (id: string) => string): string {
  switch (l.rincon) {
    case 'cafe':
      return l.con ? `Tomándose un café con ${nombreDe(l.con)}` : 'Tomándose un café'
    case 'platica':
      return l.con ? `Platicando con ${nombreDe(l.con)}` : 'Descansando en los sillones'
    case 'siesta': {
      const hasta = l.hasta ? new Date(l.hasta) : null
      return hasta && !Number.isNaN(hasta.getTime()) ? `En siesta hasta ${lasCR(hasta)}` : 'En siesta'
    }
  }
}
