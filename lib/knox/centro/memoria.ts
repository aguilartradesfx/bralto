// SERVER-ONLY — lo que comparten las lecturas del Centro de mando: un tope de tiempo para cada fuente y lo que se guarda
// unos minutos en memoria (por instancia del servidor; la pantalla pregunta cada 60 s).

export const MIN = 60_000
export const TOPE_MS = 8_000

export function conTope<T>(promesa: Promise<T>, ms = TOPE_MS): Promise<T> {
  let reloj: ReturnType<typeof setTimeout> | undefined
  const tope = new Promise<never>((_, rechazar) => {
    reloj = setTimeout(() => rechazar(new Error(`no respondió en ${ms / 1000} s`)), ms)
  })
  return Promise.race([promesa, tope]).finally(() => clearTimeout(reloj))
}

// Si falla, se vuelve a pedir la próxima vez
const guardado = new Map<string, { hasta: number; valor: Promise<unknown> }>()
export function memo<T>(clave: string, ms: number, leer: () => Promise<T>): Promise<T> {
  const ahora = Date.now()
  const g = guardado.get(clave)
  if (g && g.hasta > ahora) return g.valor as Promise<T>
  const valor = leer()
  guardado.set(clave, { hasta: ahora + ms, valor })
  valor.catch(() => {
    if (guardado.get(clave)?.valor === valor) guardado.delete(clave)
  })
  return valor
}

export function valor<T>(r: PromiseSettledResult<T>, nombre: string): T | null {
  if (r.status === 'fulfilled') return r.value
  console.error(`[knox-centro] no se pudo leer ${nombre}:`, r.reason instanceof Error ? r.reason.message : r.reason)
  return null
}
