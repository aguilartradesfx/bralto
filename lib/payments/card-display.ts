// Lo que muestra la tarjeta del paso de pago mientras la persona escribe. Solo en pantalla: los datos
// de verdad los lee y cifra el SDK de la pasarela desde los campos. Del número se ven únicamente los
// últimos 4 dígitos; el resto, puntos.

export type CardBrand = 'visa' | 'mastercard' | 'amex'
export type CardSlot = { ch: string; filled: boolean }

const DOT = '•'
const digitsOf = (input: string) => input.replace(/\D/g, '')

export function cardBrand(input: string): CardBrand | null {
  const d = digitsOf(input)
  if (/^4/.test(d)) return 'visa'
  if (/^3[47]/.test(d)) return 'amex'
  if (/^5[1-5]/.test(d)) return 'mastercard'
  const first4 = Number(d.slice(0, 4))
  if (d.length >= 4 && first4 >= 2221 && first4 <= 2720) return 'mastercard'
  return null
}

/** Grupos de posiciones: escritas (filled) o por escribir; los dígitos solo en las últimas 4 */
export function maskCardNumber(input: string): CardSlot[][] {
  const d = digitsOf(input).slice(0, 19)
  const amex = cardBrand(d) === 'amex'
  const total = Math.max(amex ? 15 : 16, d.length)
  const sizes: number[] = []
  if (amex && total === 15) sizes.push(4, 6, 5)
  else for (let left = total; left > 0; left -= 4) sizes.push(Math.min(4, left))

  let k = 0
  return sizes.map((size) =>
    Array.from({ length: size }, () => {
      const i = k++
      if (i >= d.length) return { ch: DOT, filled: false }
      return { ch: i >= total - 4 ? d[i] : DOT, filled: true }
    }),
  )
}

/** "1228" → "12/28" */
export function formatExpiry(input: string): string {
  const d = digitsOf(input).slice(0, 4)
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`
}
