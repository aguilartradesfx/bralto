// Horarios de la Oficina de Knox: próxima corrida de un cron de 5 campos (en UTC) y hora de Costa Rica.

const MINUTO = 60_000
const DIA = 24 * 60 * MINUTO
const TOPES = [
  { min: 0, max: 59 }, // minuto
  { min: 0, max: 23 }, // hora
  { min: 1, max: 31 }, // día del mes
  { min: 1, max: 12 }, // mes
  { min: 0, max: 6 }, // día de la semana (domingo = 0)
]

// Convierte un campo (`*`, `*/n`, `a`, `a-b`, separados por comas) en el conjunto de valores que cubre.
// Devuelve null si el campo no se entiende o trae valores fuera de rango.
function valoresDelCampo(campo: string, { min, max }: { min: number; max: number }): Set<number> | null {
  const valores = new Set<number>()
  for (const item of campo.split(',')) {
    const paso = /^\*\/(\d+)$/.exec(item)
    if (item === '*') {
      for (let v = min; v <= max; v++) valores.add(v)
    } else if (paso) {
      const n = Number(paso[1])
      if (n < 1) return null
      for (let v = min; v <= max; v++) if ((v - min) % n === 0) valores.add(v)
    } else if (/^\d+-\d+$/.test(item)) {
      const [a, b] = item.split('-').map(Number)
      if (a < min || b > max || a > b) return null
      for (let v = a; v <= b; v++) valores.add(v)
    } else if (/^\d+$/.test(item)) {
      const v = Number(item)
      if (v < min || v > max) return null
      valores.add(v)
    } else {
      return null
    }
  }
  return valores
}

// Próxima fecha en la que el cron coincide, a partir del minuto siguiente a `desde`; null si no hay en 8 días.
export function siguienteCorrida(expr: string, desde: Date): Date | null {
  const campos = expr.trim().split(/\s+/)
  if (campos.length !== 5) return null
  const conjuntos: Set<number>[] = []
  for (let i = 0; i < 5; i++) {
    const c = valoresDelCampo(campos[i], TOPES[i])
    if (!c) return null
    conjuntos.push(c)
  }
  const [minutos, horas, diasMes, meses, diasSemana] = conjuntos

  // Como en cron estándar: si el día del mes o el de la semana es un comodín ("*..."), cuentan con AND;
  // si ambos están restringidos, basta que coincida uno de los dos.
  const comodinMes = campos[2].startsWith('*')
  const comodinSemana = campos[4].startsWith('*')

  let t = Math.floor(desde.getTime() / MINUTO) * MINUTO + MINUTO
  const limite = t + 8 * DIA
  for (; t <= limite; t += MINUTO) {
    const f = new Date(t)
    if (!meses.has(f.getUTCMonth() + 1)) continue
    const diaOk = diasMes.has(f.getUTCDate())
    const semanaOk = diasSemana.has(f.getUTCDay())
    const dia = comodinMes || comodinSemana ? diaOk && semanaOk : diaOk || semanaOk
    if (!dia) continue
    if (horas.has(f.getUTCHours()) && minutos.has(f.getUTCMinutes())) return f
  }
  return null
}

// Hora de Costa Rica (UTC−6 todo el año) en formato de 12 horas, p. ej. '7:30 p. m.'.
export function horaCR(fecha: Date): string {
  const d = new Date(fecha.getTime() - 6 * 60 * MINUTO)
  const h = d.getUTCHours()
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${h % 12 || 12}:${mm} ${h < 12 ? 'a. m.' : 'p. m.'}`
}
