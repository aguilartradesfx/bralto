// Montos del convertidor de /payment-info: se escriben como en Costa Rica o en EE. UU.
// ("100,50", "55 000", "1,234.50") y se muestran con Intl, como en Costa Rica.

/** Texto escrito → monto positivo; 0 si no es un monto */
export function parseAmount(text: string): number {
  let value = text.replace(/\s/g, '')
  if (!/^\d[\d.,]*$/.test(value)) return 0
  const lastDot = value.lastIndexOf('.')
  const lastComma = value.lastIndexOf(',')
  if (lastDot >= 0 && lastComma >= 0) {
    // Con los dos, el que va último es el decimal
    const decimal = lastDot > lastComma ? '.' : ','
    value = value.split(decimal === '.' ? ',' : '.').join('')
    if (value.split(decimal).length > 2) return 0
    value = value.replace(decimal, '.')
  } else if (lastDot >= 0 || lastComma >= 0) {
    const parts = value.split(lastDot >= 0 ? '.' : ',')
    // Un separador con uno o dos dígitos después es el decimal; si no, separa miles
    if (parts.length === 2 && parts[1].length <= 2) value = parts.join('.')
    else if (parts.slice(1).every((part) => part.length === 3)) value = parts.join('')
    else return 0
  }
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

/** Colones sin decimales y dólares con dos, con su símbolo */
export function formatMoney(value: number, currency: 'CRC' | 'USD'): string {
  const digits = currency === 'CRC' ? 0 : 2
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}
