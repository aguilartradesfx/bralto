// La ronda diaria de la tertulia: lee los datos, le pide el JSON a Claude, lo limpia, lo guarda y anota cómo salió.
// Las dependencias entran por parámetro: aquí no se toca la base ni se lanza Claude (eso va en servidor.ts y tertulia.ts del script).
import { fechaCR, horaDecimalCR } from './horario.ts'
import type { Ronda } from './tipos.ts'
import { armarContexto, ctxValidar, leerRespuesta, pedidoTertulia, type DatosRonda } from './tertulia.ts'
import { validarRonda, type RondaLimpia } from './validar.ts'

export type DepsRonda = {
  dormida(): Promise<boolean>
  rondaDe(fecha: string): Promise<Ronda | null>
  leerDatos(ahora: Date): Promise<DatosRonda>
  preguntar(pedido: string): Promise<string>
  guardar(l: RondaLimpia, ahora: Date): Promise<void>
  anotar(r: Ronda): Promise<void>
}

export type OpRonda = { modo: 'real' | 'probar' | 'simular', respuesta?: string }
export type SalidaRonda = { resultado: Ronda['resultado'] | 'nada', detalle: string, pedido?: string, limpia?: RondaLimpia }

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
  const base = `${cuenta(l.posts.length, 'publicación', 'publicaciones')}, ${cuenta(l.comentarios.length, 'comentario', 'comentarios')}, ${cuenta(l.chat.length, 'línea', 'líneas')} y ${cuenta(l.ideas.length, 'idea', 'ideas')}`
  return l.botadas.length ? `${base} · ${cuenta(l.botadas.length, 'botada', 'botadas')}` : base
}

export async function correrRonda(deps: DepsRonda, ahora: Date, op: OpRonda): Promise<SalidaRonda> {
  const real = op.modo === 'real'
  const fecha = fechaCR(ahora)
  const anotar = async (resultado: Ronda['resultado'], detalle: string): Promise<SalidaRonda> => {
    try { await deps.anotar({ fecha, resultado, detalle }) } catch (e) { console.error('[tertulia] anotar', mensaje(e)) }
    return { resultado, detalle }
  }

  if (real) {
    if (!puedeCorrer(ahora)) return { resultado: 'nada', detalle: 'Fuera de hora' }
    if (await deps.rondaDe(fecha)) return { resultado: 'nada', detalle: 'Ya hubo ronda hoy' }
    if (await deps.dormida()) return anotar('saltada', 'La oficina dormía')
  }

  let pedido: string
  let limpia: RondaLimpia
  try {
    const datos = await deps.leerDatos(ahora)
    const contexto = armarContexto(datos, ahora)
    pedido = pedidoTertulia(contexto)
    if (op.modo === 'simular' && op.respuesta === undefined) return { resultado: 'ok', detalle: 'Solo el pedido', pedido }
    const salida = op.modo === 'simular' ? op.respuesta! : await deps.preguntar(pedido)
    const v = validarRonda(leerRespuesta(salida), ctxValidar(datos, contexto, ahora))
    if ('error' in v) throw new Error(v.error)
    limpia = v
  } catch (e) {
    const detalle = mensaje(e)
    return real ? anotar('falla', detalle) : { resultado: 'falla', detalle }
  }

  if (!real) return { resultado: 'ok', detalle: resumen(limpia), pedido, limpia }

  if (await deps.dormida()) return anotar('saltada', 'La oficina se durmió a media ronda')
  try {
    await deps.guardar(limpia, ahora)
  } catch (e) {
    return anotar('falla', unaLinea(`No se pudo guardar: ${mensaje(e)}`))
  }
  return anotar('ok', resumen(limpia))
}
