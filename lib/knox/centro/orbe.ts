// El orbe del Centro de mando (components/knox-centro/orbe.tsx): lo que lo mueve según lo que hace Knox. Tranquilo
// cuando no habla, agitado mientras revisa y encendido con su voz. Cada cuadro, avanzar() acerca la voz y la
// agitación a su meta poco a poco y suma las fases (velocidad × tiempo que pasó): así un cambio acelera o frena el
// orbe, nunca lo hace brincar (Ale no quiere movimientos bruscos). Los números son los del orbe que eligió (1/11,
// Bralto-redes/knox-centro/orbe/capas.html). Puro, con pruebas.

export const FRANJAS = 12

// La voz de un cuadro. bandas: las 12 franjas (del analizador); sin analizador, null y salen del nivel
export type VozOrbe = { nivel: number; bandas: ArrayLike<number> | null }

export type EstadoOrbe = {
  reloj: number // segundos (Phosphor 30 y los temblores corren con él)
  nivel: number // la voz ahora: sube rápido y baja más despacio
  nivelLento: number // la voz más suave: el núcleo y los rayos se encienden sin parpadear
  agita: number // 0 tranquilo, 1 revisando
  fase: number // el remolino de los rayos de plasma (capa 4)
  giroAura: number // capas 1 y 6
  giroEspectro: number
  giro: number // el aura entera
  ola: number // la malla de puntos (capa 8)
  bandas: Float32Array
}

export function nuevoEstado(): EstadoOrbe {
  return { reloj: 0, nivel: 0, nivelLento: 0, agita: 0, fase: 0, giroAura: 0, giroEspectro: 0, giro: 0, ola: 0, bandas: new Float32Array(FRANJAS) }
}

// Revisando (o cargando) se agita del todo; saludando, a medias: habla mientras sigue revisando
export function agitacion(fase: string): number {
  if (fase === 'revisando' || fase === 'cargando') return 1
  if (fase === 'saludando') return 0.5
  return 0
}

// Las 12 franjas van de ~190 Hz a ~5,6 kHz (donde vive la voz), repartidas como las oye el oído. Son casilleros de un
// analizador con fftSize 512 (de 94 Hz a 48 kHz)
const LIMITES = Array.from({ length: FRANJAS + 1 }, (_, k) => Math.round(2 * Math.pow(30, k / FRANJAS)))

// Del analizador (getByteFrequencyData): qué tan fuerte habla y cada franja, de 0 a 1
export function leerVoz(datos: ArrayLike<number>): { nivel: number; bandas: Float32Array } {
  let suma = 0
  for (let i = 2; i < 60; i++) suma += datos[i] ?? 0
  const nivel = Math.min(1, Math.pow(suma / 58 / 255, 0.8) * 1.6)
  const bandas = new Float32Array(FRANJAS)
  for (let k = 0; k < FRANJAS; k++) {
    const a = LIMITES[k]
    const b = Math.max(a + 1, LIMITES[k + 1])
    let s = 0
    for (let i = a; i < b; i++) s += datos[i] ?? 0
    bandas[k] = Math.min(1, (s / (b - a) / 255) * 1.3)
  }
  return { nivel, bandas }
}

// Habla de mentira, para cuando suena sin analizador: sílabas al azar y de vez en cuando una pausa
export function hablaSimulada(azar: () => number = Math.random): (t: number) => number {
  let silaba = 0
  let proxima = -Infinity
  let pausaHasta = 0
  return (t) => {
    if (t > proxima) {
      if (azar() < 0.12) pausaHasta = t + 0.35 + azar() * 0.45
      silaba = 0.35 + azar() * 0.65
      proxima = t + 0.09 + azar() * 0.13
    }
    return t < pausaHasta ? 0.03 : silaba
  }
}

const PASO_MAX = 0.05 // si pasó más (la ventana estuvo escondida), cuenta como un cuadro lento

// Un cuadro: dt en segundos; voz null si no suena. reducido: movimiento reducido (todo al 15 %)
export function avanzar(e: EstadoOrbe, p: { dt: number; agita: number; voz: VozOrbe | null; reducido: boolean }): EstadoOrbe {
  const dt = Math.min(PASO_MAX, Math.max(0, p.dt))
  const suave = (actual: number, meta: number, vel: number) => actual + (meta - actual) * Math.min(1, dt * vel)
  const nivel = p.voz?.nivel ?? 0
  e.nivel = suave(e.nivel, nivel, nivel > e.nivel ? 18 : 7)
  e.nivelLento = suave(e.nivelLento, e.nivel, 3)
  e.agita = suave(e.agita, p.agita, 2.5)
  const paso = dt * (p.reducido ? 0.15 : 1)
  e.reloj += paso
  e.fase += paso * (0.18 + 0.22 * e.agita + 0.14 * e.nivelLento)
  e.giroAura += paso * (0.25 + 0.4 * e.agita)
  e.giroEspectro += paso * (0.1 + 0.25 * e.agita)
  e.giro += paso * (0.08 + 0.2 * e.agita + 0.12 * e.nivel)
  e.ola += paso * (0.3 + 0.2 * e.agita + 0.25 * e.nivelLento)
  const bandas = p.voz?.bandas ?? null
  for (let k = 0; k < FRANJAS; k++) {
    const meta = bandas
      ? (bandas[k] ?? 0)
      : e.nivel * (0.45 + 0.55 * Math.abs(Math.sin(e.reloj * (3 + k * 0.7) + k * 1.9))) * (k < 7 ? 1 : 0.6)
    e.bandas[k] = suave(e.bandas[k], meta, 12)
  }
  return e
}
