'use client'

import { useEffect, useRef } from 'react'
import { azar } from './geometria'

// El polvo del fondo: se dibuja una vez por tamaño (siempre igual), más denso alrededor de Knox y con alguna mota
// naranja. ancho y alto: los del lienzo; cx y cy: el centro de Knox
export function Polvo({ ancho, alto, cx, cy }: { ancho: number; alto: number; cx: number; cy: number }) {
  const lienzo = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = lienzo.current?.getContext('2d')
    if (!c) return
    c.setTransform(2, 0, 0, 2, 0, 0)
    c.clearRect(0, 0, ancho, alto)
    const R = azar(11)
    const gauss = () => {
      let u = 0
      let v = 0
      while (!u) u = R()
      while (!v) v = R()
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    }
    // La misma densidad del diseño en 1920×1080, para cualquier tamaño
    const motas = Math.round((2200 * ancho * alto) / (1920 * 1080))
    for (let i = 0; i < motas; i++) {
      let x: number
      let y: number
      if (R() < 0.5) {
        const a = R() * Math.PI * 2
        const d = Math.abs(gauss()) * 230 + 270
        x = cx + Math.cos(a) * d
        y = cy + Math.sin(a) * d * 0.85
      } else {
        x = R() * ancho
        y = R() * alto
      }
      const r = R() * R() * 1.25 + 0.25
      const al = R() * 0.32 + 0.04
      c.fillStyle = R() < 0.025 ? `rgba(255,109,40,${Math.min(1, al + 0.3)})` : `rgba(255,255,255,${al})`
      c.beginPath()
      c.arc(x, y, r, 0, 7)
      c.fill()
    }
  }, [ancho, alto, cx, cy])
  return <canvas ref={lienzo} className="polvo" width={ancho * 2} height={alto * 2} aria-hidden />
}
