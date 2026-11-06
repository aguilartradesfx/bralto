import { diaCR, horaCR } from '../../calendario/fechas.ts'

// A qué hora sale cada versión de prueba (lógica pura). Las pruebas salen de 8:00 a 22:00 de Costa Rica, en horas
// en punto, y las horas van rotando: cada día de la semana se prefieren las que menos se han usado, para que con
// las semanas se pruebe cada hora y se vea cuál rinde más. Qué versión va a cada hora se sortea, para que la
// hora no favorezca siempre al mismo tipo de gancho.

export const HORAS_PRUEBA = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
const VERSIONES = 5

const diaSemana = (dia: string) => new Date(`${dia}T12:00:00Z`).getUTCDay() // 0 domingo … 6 sábado
const clave = (dia: number, hora: number) => `${dia}-${hora}`

// Cuántas veces salió una prueba en cada día de la semana y hora, contado en hora de Costa Rica (una versión de
// las 22:00 ya es el día siguiente en UTC)
export function usoPorHora(historial: string[]): Map<string, number> {
  const uso = new Map<string, number>()
  for (const instante of historial) {
    const k = clave(diaSemana(diaCR(instante)), Number(horaCR(instante).slice(0, 2)))
    uso.set(k, (uso.get(k) ?? 0) + 1)
  }
  return uso
}

// 5 horas para el día `dia` (AAAA-MM-DD de Costa Rica), fuera de las que ya tomó otra prueba ese día. La
// posición i es la hora de la versión i + 1. Entre versiones quedan al menos 2 horas; si no caben, 1
export function repartirHoras(dia: string, ocupadas: number[], uso: Map<string, number>, azar: () => number): number[] {
  const d = diaSemana(dia)
  const libres = HORAS_PRUEBA.filter((h) => !ocupadas.includes(h)).map((h) => ({ h, usos: uso.get(clave(d, h)) ?? 0, sorteo: azar() }))
  const orden = libres.sort((a, b) => a.usos - b.usos || a.sorteo - b.sorteo).map((x) => x.h)

  let elegidas: number[] = []
  for (const separacion of [2, 1]) {
    elegidas = []
    for (const h of orden) {
      if (elegidas.length === VERSIONES) break
      if (elegidas.every((e) => Math.abs(e - h) >= separacion)) elegidas.push(h)
    }
    if (elegidas.length === VERSIONES) break
  }

  // Fisher–Yates: qué versión va a cada hora
  for (let i = elegidas.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[elegidas[i], elegidas[j]] = [elegidas[j], elegidas[i]]
  }
  return elegidas
}
