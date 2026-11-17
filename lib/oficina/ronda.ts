// Una ronda de la tertulia (hay tres al día: mañana, mediodía y tarde; el turno sale de la hora): lee los datos, le
// pide el JSON a Claude, lo limpia, lo guarda y anota cómo salió. Un turno que ya salió bien hoy no se repite.
// Las dependencias entran por parámetro: aquí no se toca la base ni se lanza Claude (eso va en servidor.ts y tertulia.ts del script).
import { fechaCR, horaDecimalCR } from './horario.ts'
import type { Ronda, Turno } from './tipos.ts'
import { armarContexto, ctxValidar, leerRespuesta, pedidoTertulia, type DatosRonda } from './tertulia.ts'
import { TURNOS, turnoDe } from './turnos.ts'
import { validarRonda, type RondaLimpia } from './validar.ts'

export type DepsRonda = {
  dormida(): Promise<boolean>
  rondaDe(fecha: string, turno: Turno): Promise<Ronda | null>
  leerDatos(ahora: Date): Promise<DatosRonda>
  preguntar(pedido: string): Promise<string>
  guardar(l: RondaLimpia, ahora: Date): Promise<void>
  anotar(r: Ronda): Promise<void>
}

export type OpRonda = { modo: 'real' | 'probar' | 'simular', respuesta?: string }
export type SalidaRonda = { resultado: Ronda['resultado'] | 'nada', turno: Turno, detalle: string, pedido?: string, limpia?: RondaLimpia }

// De 7:00 a. m. a 6:59 p. m. de Costa Rica: la noche es de la producción.
export function puedeCorrer(ahora: Date): boolean {
  const h = horaDecimalCR(ahora)
  return h >= 7 && h < 19
}

// `claude` recibe el pedido por la entrada estándar; sin herramientas que escriban, salgan a la red, lean o busquen
// archivos ni lancen otros agentes: todo lo que necesita viene en el pedido. «Agent» va junto a «Task» por si la
// versión de claude llama así a la de lanzar agentes (negar un nombre que no existe no hace nada).
export function argsClaude(): string[] {
  return ['-p', '--model', 'sonnet', '--output-format', 'json', '--max-turns', '3',
    '--disallowedTools', 'Bash', 'Edit', 'Write', 'NotebookEdit', 'WebFetch', 'WebSearch', 'Read', 'Glob', 'Grep', 'Task', 'Agent']
}

// Sin llave de API: el costo va al plan de Alejandro (CLAUDE_CODE_OAUTH_TOKEN), nunca a una llave aparte.
export function entornoClaude(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const { ANTHROPIC_API_KEY: _a, ANTHROPIC_AUTH_TOKEN: _b, ...resto } = env
  return resto
}

const unaLinea = (t: string) => t.replace(/\s+/g, ' ').trim().slice(0, 200)
const mensaje = (e: unknown) => unaLinea(e instanceof Error ? e.message : String(e))
const cuenta = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

function resumen(l: RondaLimpia): string {
  const lineas = l.charlas.reduce((s, c) => s + c.lineas.length, 0)
  const charlas = l.charlas.length ? `${cuenta(l.charlas.length, 'charla', 'charlas')} (${cuenta(lineas, 'línea', 'líneas')})` : '0 charlas'
  const base = `${cuenta(l.posts.length, 'publicación', 'publicaciones')}, ${cuenta(l.comentarios.length, 'comentario', 'comentarios')}, ${charlas}, ${cuenta(l.chat.length, 'línea suelta', 'líneas sueltas')} y ${cuenta(l.ideas.length, 'idea', 'ideas')}`
  return l.botadas.length ? `${base} · ${cuenta(l.botadas.length, 'botada', 'botadas')}` : base
}

export async function correrRonda(deps: DepsRonda, ahora: Date, op: OpRonda): Promise<SalidaRonda> {
  const real = op.modo === 'real'
  const fecha = fechaCR(ahora)
  const turno = turnoDe(ahora)
  const anotar = async (resultado: Ronda['resultado'], detalle: string): Promise<SalidaRonda> => {
    try { await deps.anotar({ fecha, turno, resultado, detalle }) } catch (e) { console.error('[tertulia] anotar', mensaje(e)) }
    return { resultado, turno, detalle }
  }

  if (real) {
    if (!puedeCorrer(ahora)) return { resultado: 'nada', turno, detalle: 'Fuera de hora' }
    // Si ya salió bien, correrla otra vez no duplica nada; una que falló o se saltó se puede volver a correr a mano
    if ((await deps.rondaDe(fecha, turno))?.resultado === 'ok') return { resultado: 'nada', turno, detalle: `Ya hubo tertulia ${TURNOS[turno].de} hoy` }
    if (await deps.dormida()) return anotar('saltada', 'La oficina dormía')
  }

  let pedido: string
  let limpia: RondaLimpia
  try {
    const datos = await deps.leerDatos(ahora)
    const contexto = armarContexto(datos, ahora, turno)
    pedido = pedidoTertulia(contexto)
    if (op.modo === 'simular' && op.respuesta === undefined) return { resultado: 'ok', turno, detalle: 'Solo el pedido', pedido }
    const salida = op.modo === 'simular' ? op.respuesta! : await deps.preguntar(pedido)
    const v = validarRonda(leerRespuesta(salida), ctxValidar(datos, contexto, ahora))
    if ('error' in v) throw new Error(v.error)
    limpia = v
  } catch (e) {
    const detalle = mensaje(e)
    return real ? anotar('falla', detalle) : { resultado: 'falla', turno, detalle }
  }

  if (!real) return { resultado: 'ok', turno, detalle: resumen(limpia), pedido, limpia }

  if (await deps.dormida()) return anotar('saltada', 'La oficina se durmió a media ronda')
  try {
    await deps.guardar(limpia, ahora)
  } catch (e) {
    return anotar('falla', unaLinea(`No se pudo guardar: ${mensaje(e)}`))
  }
  return anotar('ok', resumen(limpia))
}
