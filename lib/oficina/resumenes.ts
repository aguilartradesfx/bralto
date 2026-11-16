// Qué cuenta como «trabajo hecho» en cada tarea del sitio y la frase que queda en la oficina. Funciones puras
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
  return { hizo: n > 0, resumen: `Publicó ${plural(n, 'post', 'posts')}${enTikTok > 0 ? ` y agendó ${enTikTok} en TikTok` : ''}` }
}

// ideas (nova)
export function resumenIdeas(r: Record<string, unknown>): Resumen {
  const n = Number(r.listas) || 0
  return { hizo: n > 0, resumen: `Analizó ${plural(n, 'idea', 'ideas')}` }
}

// payments-reconcile (kash): solo cuenta lo que se cerró (confirmado o vencido), no lo que se dejó esperando
const CITAS_HECHAS = new Set(['agendada', 'vencida', 'cancelada'])
export function resumenPagos(summary: { results?: Record<string, string> }, citas: { resultados?: Record<string, string> }): Resumen {
  const pagos = valores(summary.results).filter((v) => !v.endsWith('→ keep')).length
  const nCitas = valores(citas.resultados).filter((v) => CITAS_HECHAS.has(v)).length
  const partes = [pagos > 0 && plural(pagos, 'pago', 'pagos'), nCitas > 0 && plural(nCitas, 'cita', 'citas')].filter(Boolean)
  return { hizo: partes.length > 0, resumen: partes.length ? `Cerró ${partes.join(' y ')}` : 'Revisó los pagos y no había nada por cerrar' }
}

// pruebas (vero): solo los estados en que algo avanzó
const AVANZO = /^(decidida|corriendo|cancelada|se cortó):/
export function resumenPruebas(r: Record<string, unknown>): Resumen {
  const n = Object.entries(r).filter(([k, v]) => k !== 'ok' && typeof v === 'string' && AVANZO.test(v)).length
  return { hizo: n > 0, resumen: `Movió ${plural(n, 'prueba', 'pruebas')} de reels` }
}

// pruebas-resumen (krono)
export function resumenSemanal(r: Record<string, unknown>): Resumen {
  if (r.resumen === 'enviado') return { hizo: true, resumen: 'Mandó el resumen semanal de las pruebas' }
  const por = typeof r.resumen === 'string' ? r.resumen : 'no había nada que mandar'
  return { hizo: false, resumen: `No mandó el resumen: ${por}` }
}

// analisis (quark)
export function resumenAnalisis(r: Record<string, unknown>): Resumen {
  const n = Number(r.actualizados) || 0
  const errores = Array.isArray(r.errores) ? r.errores.length : 0
  if (errores > 0 && n === 0) return { hizo: false, resumen: 'No pudo leer los números de los reels', fallo: 'No pude leer los números de los reels' }
  return { hizo: n > 0, resumen: n > 0 ? `Analizó los números de ${plural(n, 'reel', 'reels')}` : 'No había reels nuevos que analizar' }
}

// knox: el reporte siempre se genera (si falla, lanza)
export function resumenReporte(): Resumen {
  return { hizo: true, resumen: 'Preparó el reporte del día' }
}

// knox-arranques (luma): { [día]: {fecha, listos} | 'ya estaban' | 'error: …', fijos: 'listos' | 'error: …' }
export function resumenArranques(r: Record<string, unknown>): Resumen {
  if (valores(r).some((v) => v.startsWith('error:'))) {
    return { hizo: false, resumen: 'No pudo dejar listos los saludos de mañana', fallo: 'No pude dejar listos los saludos de mañana' }
  }
  const nuevos = Object.entries(r).filter(([k, v]) => k !== 'fijos' && typeof v === 'object' && v !== null).length
  return { hizo: nuevos > 0, resumen: nuevos > 0 ? 'Dejó listos los saludos de mañana' : 'Los saludos de mañana ya estaban listos' }
}

// contract-reminders (inko)
export function resumenContratos(enviados: number): Resumen {
  return { hizo: enviados > 0, resumen: enviados > 0 ? `Mandó ${plural(enviados, 'recordatorio', 'recordatorios')} de contrato` : 'No había contratos por recordar' }
}
