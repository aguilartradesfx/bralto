import type { Cambio } from '../tipos'

// Tipo de cambio de referencia del dólar, del Ministerio de Hacienda (gratis y sin clave)
export async function tipoDeCambio(): Promise<Cambio> {
  const res = await fetch('https://api.hacienda.go.cr/indicadores/tc/dolar', {
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Hacienda: HTTP ${res.status}`)
  const j = (await res.json()) as { compra?: { valor?: number }; venta?: { valor?: number; fecha?: string } }
  if (typeof j.compra?.valor !== 'number' || typeof j.venta?.valor !== 'number') throw new Error('Hacienda: vino sin valores')
  return { compra: j.compra.valor, venta: j.venta.valor, fecha: j.venta.fecha ?? '' }
}
