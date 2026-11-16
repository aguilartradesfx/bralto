// Qué cuenta como «trabajo hecho» en cada tarea del sitio y la frase que queda en la oficina. Las frases van en
// primera persona: en el chat las dice el mismo Knox (lo pidió Alejandro el 16/11). Funciones puras
// (sin base de datos) para poder probarlas. `fallo` solo lo usan las tareas diarias: una corrida frecuente nunca
// llena la oficina de marcas.
export type Resumen = { hizo: boolean, resumen: string, fallo?: string }

export const plural = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`

const valores = (o: unknown): string[] =>
  o && typeof o === 'object' ? Object.values(o as Record<string, unknown>).filter((v): v is string => typeof v === 'string') : []

// publicar (zap): la cola responde { ok, [título]: 'publicado: …' | 'error: …' | 'se reintenta: …' }
export function titulosPublicados(r: Record<string, unknown>): string[] {
  return Object.entries(r).filter(([k, v]) => k !== 'ok' && typeof v === 'string' && v.startsWith('publicado:')).map(([k]) => k)
}
// Solo el error definitivo; «se reintenta:» no cuenta
export function titulosConError(r: Record<string, unknown>): string[] {
  return Object.entries(r).filter(([k, v]) => k !== 'ok' && typeof v === 'string' && v.startsWith('error:')).map(([k]) => k)
}
export function resumenPublicar(r: Record<string, unknown>, enTikTok = 0): Resumen {
  const n = titulosPublicados(r).length
  return { hizo: n > 0, resumen: `Publiqué ${plural(n, 'post', 'posts')}${enTikTok > 0 ? ` y agendé ${enTikTok} en TikTok` : ''}` }
}

// ideas (nova)
export function resumenIdeas(r: Record<string, unknown>): Resumen {
  const n = Number(r.listas) || 0
  return { hizo: n > 0, resumen: `Analicé ${plural(n, 'idea', 'ideas')}` }
}

// payments-reconcile (kash): solo cuenta lo que se cerró (confirmado o vencido), no lo que se dejó esperando
const CITAS_HECHAS = new Set(['agendada', 'vencida', 'cancelada'])
export function resumenPagos(summary: { results?: Record<string, string> }, citas: { resultados?: Record<string, string> }): Resumen {
  const pagos = valores(summary.results).filter((v) => !v.endsWith('→ keep')).length
  const nCitas = valores(citas.resultados).filter((v) => CITAS_HECHAS.has(v)).length
  const partes = [pagos > 0 && plural(pagos, 'pago', 'pagos'), nCitas > 0 && plural(nCitas, 'cita', 'citas')].filter(Boolean)
  return { hizo: partes.length > 0, resumen: partes.length ? `Cerré ${partes.join(' y ')}` : 'Revisé los pagos y no había nada por cerrar' }
}

// pruebas (vero): solo los estados en que algo avanzó
const AVANZO = /^(decidida|corriendo|cancelada|se cortó):/
export function resumenPruebas(r: Record<string, unknown>): Resumen {
  const hechos = Object.entries(r).filter((e): e is [string, string] => e[0] !== 'ok' && typeof e[1] === 'string' && AVANZO.test(e[1]))
  if (hechos.length === 1) return { hizo: true, resumen: unaPrueba(...hechos[0]) }
  return { hizo: hechos.length > 0, resumen: `Moví ${plural(hechos.length, 'prueba', 'pruebas')} de reels` }
}
// Con una sola, Vero dice qué hizo con ella
function unaPrueba(titulo: string, estado: string): string {
  const gano = /^decidida: ganó la (?:versión )?(\d+)/.exec(estado)
  if (gano) return `Ya escogí la ganadora de «${titulo}»: la versión ${gano[1]}`
  if (estado.startsWith('decidida: ninguna')) return `Cerré la prueba de «${titulo}»: ninguna versión tuvo vistas`
  if (estado.startsWith('decidida:')) return `Ya decidí la prueba de «${titulo}»`
  if (estado.startsWith('corriendo:')) return `Ya salieron todas las versiones de «${titulo}»; en 3 días escojo la ganadora`
  if (estado.startsWith('cancelada:')) return `Cancelé la prueba de «${titulo}»: no salió ninguna versión`
  return `La prueba de «${titulo}» se cortó y la vuelvo a poner a correr`
}

// pruebas-resumen (krono)
export function resumenSemanal(r: Record<string, unknown>): Resumen {
  if (r.resumen === 'enviado') return { hizo: true, resumen: 'Mandé el resumen semanal de las pruebas' }
  const por = typeof r.resumen === 'string' ? r.resumen : 'no había nada que mandar'
  return { hizo: false, resumen: `No mandé el resumen: ${por}` }
}

// analisis (quark)
export function resumenAnalisis(r: Record<string, unknown>): Resumen {
  const n = Number(r.actualizados) || 0
  const errores = Array.isArray(r.errores) ? r.errores.length : 0
  if (errores > 0 && n === 0) return { hizo: false, resumen: 'No pude leer los números de los reels', fallo: 'No pude leer los números de los reels' }
  return { hizo: n > 0, resumen: n > 0 ? `Analicé los números de ${plural(n, 'reel', 'reels')}` : 'No había reels nuevos que analizar' }
}

// knox: el reporte siempre se genera (si falla, lanza)
export function resumenReporte(): Resumen {
  return { hizo: true, resumen: 'Preparé el reporte del día' }
}

// knox-arranques (luma): { [día]: {fecha, listos} | 'ya estaban' | 'error: …', fijos: 'listos' | 'error: …' }
export function resumenArranques(r: Record<string, unknown>): Resumen {
  if (valores(r).some((v) => v.startsWith('error:'))) {
    return { hizo: false, resumen: 'No pude dejar listos los saludos de mañana', fallo: 'No pude dejar listos los saludos de mañana' }
  }
  const nuevos = Object.entries(r).filter(([k, v]) => k !== 'fijos' && typeof v === 'object' && v !== null).length
  return { hizo: nuevos > 0, resumen: nuevos > 0 ? 'Dejé listos los saludos de mañana' : 'Los saludos de mañana ya estaban listos' }
}

// contract-reminders (inko)
export function resumenContratos(enviados: number): Resumen {
  return { hizo: enviados > 0, resumen: enviados > 0 ? `Mandé ${plural(enviados, 'recordatorio', 'recordatorios')} de contrato` : 'No había contratos por recordar' }
}
