'use client'

import { useEffect, useRef, useState } from 'react'
import { agitacion, avanzar, hablaSimulada, leerVoz, nuevoEstado, type VozOrbe } from '@/lib/knox/centro/orbe'
import { crearEscena, type EscenaOrbe } from './orbe-escena'

// El orbe del centro, en lugar de Knox: tranquilo cuando no habla, agitado mientras revisa y encendido con su voz de
// verdad (o con una de mentira si el navegador no deja leerla). Lo que hace Knox se lo pregunta al centro en cada
// cuadro (leer), sin pasar por React. Si el navegador no puede dibujar en 3D, queda un brillo quieto.

export type LeerOrbe = () => {
  fase: string
  sonando: boolean
  // El de la voz de Knox (fftSize 512, como en la página donde lo eligió); null si no hay
  analizador: AnalyserNode | null
  // false mientras está en otra vista: no se dibuja
  visible: boolean
}

export default function Orbe({ leer }: { leer: LeerOrbe }) {
  const caja = useRef<HTMLDivElement>(null)
  const [sin3d, setSin3d] = useState(false)

  useEffect(() => {
    const el = caja.current
    if (!el) return
    // Un lienzo nuevo cada vez: al terminar se suelta su contexto 3D, y uno suelto no se puede volver a usar
    const canvas = document.createElement('canvas')
    el.appendChild(canvas)
    let escena: EscenaOrbe
    try {
      escena = crearEscena(canvas)
    } catch {
      canvas.remove()
      setSin3d(true)
      return
    }
    const estado = nuevoEstado()
    const simulada = hablaSimulada()
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let datos = new Uint8Array(256)
    let antes = performance.now()
    let raf = 0

    const cuadro = (ahora: number) => {
      raf = requestAnimationFrame(cuadro)
      const dt = (ahora - antes) / 1000
      antes = ahora
      const { fase, sonando, analizador, visible } = leer()
      if (!visible) return
      let voz: VozOrbe | null = null
      if (sonando && analizador) {
        if (datos.length !== analizador.frequencyBinCount) datos = new Uint8Array(analizador.frequencyBinCount)
        analizador.getByteFrequencyData(datos)
        voz = leerVoz(datos)
      } else if (sonando) {
        voz = { nivel: simulada(estado.reloj), bandas: null }
      }
      avanzar(estado, { dt, agita: agitacion(fase), voz, reducido })
      escena.dibujar(estado)
    }
    raf = requestAnimationFrame(cuadro)
    window.addEventListener('resize', escena.medir)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', escena.medir)
      escena.liberar()
      canvas.remove()
    }
  }, [leer])

  return <div ref={caja} className={`orbe-3d${sin3d ? ' sin-3d' : ''}`} aria-hidden />
}
