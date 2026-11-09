import { diaCR, horaCR } from '../../calendario/fechas.ts'
import { hora12 } from '../asistente.ts'
import type { TipoGancho } from '../publicacion/tipos.ts'

// El resumen de los domingos por Telegram (lógica pura): qué tipo de gancho gana más y a qué hora rinden mejor las
// pruebas cada día. Solo propone: nada cambia hasta que Alejandro lo apruebe.

export type GrupoDecidido = {
  ganadora: string
  decidida_en: string
  versiones: { id: string; publicar_en: string; tipo: TipoGancho; puntaje: number }[]
}

const MINIMO_MS = 14 * 86_400_000 // desde la segunda semana con datos
const PROPONER_MS = 28 * 86_400_000 // las primeras 4 semanas se prueba todo, sin preferencias
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const NOMBRE: Record<TipoGancho, string> = {
  sorpresa: 'sorpresa',
  mito: 'mito',
  advertencia: 'advertencia',
  pregunta: 'pregunta',
  lista: 'lista',
  otro: 'otro tipo',
}

export type UnaVez = {
  tomar(dia: string): Promise<boolean> // true solo para la primera corrida del día
  soltar(dia: string): Promise<void>
  avisar(texto: string): Promise<void>
}

// Vercel a veces entrega un cron dos veces: el resumen de cada día sale una sola vez. Si el aviso falla, el día se
// suelta para que se pueda volver a mandar
export async function mandarUnaVez(dia: string, texto: string, e: UnaVez): Promise<boolean> {
  if (!(await e.tomar(dia))) return false
  try {
    await e.avisar(texto)
  } catch (err) {
    await e.soltar(dia).catch(() => {})
    throw err
  }
  return true
}

const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)
const diaSemana = (instante: string) => new Date(`${diaCR(instante)}T12:00:00Z`).getUTCDay()

export function resumenSemanal(grupos: GrupoDecidido[], ahora: Date): string | null {
  if (!grupos.length) return null
  const primera = Math.min(...grupos.map((g) => Date.parse(g.decidida_en)))
  if (ahora.getTime() - primera < MINIMO_MS) return null

  // Qué tipo de gancho ganó cada prueba
  const ganes = new Map<TipoGancho, number>()
  for (const g of grupos) {
    const tipo = g.versiones.find((v) => v.id === g.ganadora)?.tipo
    if (tipo) ganes.set(tipo, (ganes.get(tipo) ?? 0) + 1)
  }
  const ranking = [...ganes.entries()].sort((a, b) => b[1] - a[1])

  // Puntaje relativo: el de cada versión dividido entre el mejor de su grupo, para que un reel flojo no hunda su
  // hora. Por día y hora, el promedio; una hora cuenta solo con 2 datos o más
  const porDia = new Map<number, Map<number, number[]>>()
  for (const g of grupos) {
    const mejor = Math.max(...g.versiones.map((v) => v.puntaje))
    if (mejor <= 0) continue
    for (const v of g.versiones) {
      const d = diaSemana(v.publicar_en)
      const h = Number(horaCR(v.publicar_en).slice(0, 2))
      const horas = porDia.get(d) ?? new Map<number, number[]>()
      horas.set(h, [...(horas.get(h) ?? []), v.puntaje / mejor])
      porDia.set(d, horas)
    }
  }
  const mejoresHoras: string[] = []
  for (const d of [1, 2, 3, 4, 5, 6, 0]) {
    const horas = [...(porDia.get(d) ?? new Map<number, number[]>()).entries()].filter(([, xs]) => xs.length >= 2)
    if (!horas.length) continue
    const promedio = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    const [hora] = horas.sort((a, b) => promedio(b[1]) - promedio(a[1]))[0]
    mejoresHoras.push(`• ${mayuscula(DIAS[d])}: ${hora12(`${String(hora).padStart(2, '0')}:00`)}`)
  }

  const partes = [`📊 Cómo van las pruebas (${grupos.length} reels probados)`, '', 'Los ganchos que más ganan:']
  for (const [tipo, n] of ranking) partes.push(`• El gancho de ${NOMBRE[tipo]} ganó ${n} de ${grupos.length}`)
  if (mejoresHoras.length) partes.push('', 'La mejor hora de cada día:', ...mejoresHoras)
  if (ranking.length && ahora.getTime() - primera >= PROPONER_MS) {
    partes.push(
      '',
      `Propuesta: que las próximas pruebas lleven 2 versiones con gancho de ${NOMBRE[ranking[0][0]]} y 3 para seguir probando. Contéstame si la aplico.`,
    )
  }
  return partes.join('\n')
}
