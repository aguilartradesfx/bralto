import type { Correo, Correos } from './tipos.ts'

// Lo que Knox mira del correo: lo sin leer del último día, sin promociones, redes ni foros (Gmail ya los separa).
export const CONSULTA_GMAIL = 'is:unread newer_than:1d -category:promotions -category:social -category:forums'
const MAX_RECIENTES = 25 // el escritor elige los importantes; más que esto solo gasta palabras

export type CorreosDeUnaCuenta = {
  cuenta: string
  total: number // lo que Gmail estima que hay sin leer con esa consulta
  mensajes: { de: string; asunto: string; resumen: string; en: string }[]
}

// «Ana Pérez <ana@x.com>» → «Ana Pérez»; si solo hay correo, el correo
export function remitente(de: string): string {
  const t = de.trim()
  if (!t) return 'Alguien'
  const nombre = t.replace(/<[^>]*>/, '').replace(/"/g, '').trim()
  return nombre || t.replace(/[<>]/g, '')
}

export function resumirCorreos(cuentas: CorreosDeUnaCuenta[]): Correos {
  const todos: Correo[] = cuentas.flatMap((c) =>
    c.mensajes.map((m) => ({
      cuenta: c.cuenta,
      de: remitente(m.de),
      asunto: m.asunto.trim().slice(0, 140),
      resumen: m.resumen.trim().slice(0, 160),
      en: m.en,
    })),
  )
  return {
    cuentas: cuentas.map((c) => c.cuenta),
    sinLeer: cuentas.reduce((a, c) => a + c.total, 0),
    recientes: todos.sort((a, b) => b.en.localeCompare(a.en)).slice(0, MAX_RECIENTES),
  }
}
