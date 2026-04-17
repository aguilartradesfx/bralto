// Spanish number-to-words for USD amounts (range: 0–999,999)

const ones = [
  '', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis',
  'diecisiete', 'dieciocho', 'diecinueve',
]

const tens = [
  '', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta',
  'sesenta', 'setenta', 'ochenta', 'noventa',
]

const hundreds = [
  '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
  'seiscientos', 'setecientos', 'ochocientos', 'novecientos',
]

const veintis = [
  'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro',
  'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve',
]

function below100(n: number): string {
  if (n < 20) return ones[n]
  if (n < 30) return veintis[n - 20]
  const t = Math.floor(n / 10)
  const o = n % 10
  return o === 0 ? tens[t] : `${tens[t]} y ${ones[o]}`
}

function below1000(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'cien'
  if (n < 100) return below100(n)
  const h = Math.floor(n / 100)
  const rest = n % 100
  return rest === 0 ? hundreds[h] : `${hundreds[h]} ${below100(rest)}`
}

export function numberToWords(n: number): string {
  const int = Math.floor(n)
  if (int === 0) return 'cero'
  if (int < 0) return `menos ${numberToWords(-int)}`

  if (int < 1000) return below1000(int)

  if (int < 1000000) {
    const thousands = Math.floor(int / 1000)
    const rest = int % 1000
    const prefix = thousands === 1 ? 'mil' : `${below1000(thousands)} mil`
    return rest === 0 ? prefix : `${prefix} ${below1000(rest)}`
  }

  // Fallback for amounts >= 1,000,000 (unlikely for contracts)
  return int.toLocaleString('es-CR')
}
