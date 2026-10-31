'use client'

import { useEffect, useRef } from 'react'
import { azar, CX, CY } from './geometria'

// El polvo del fondo: se dibuja una vez (siempre igual), más denso alrededor de Knox y con alguna mota naranja
export function Polvo() {
  const lienzo = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = lienzo.current?.getContext('2d')
    if (!c) return
    c.setTransform(2, 0, 0, 2, 0, 0)
    c.clearRect(0, 0, 1920, 1080)
    const R = azar(11)
    const gauss = () => {
      let u = 0
      let v = 0
      while (!u) u = R()
      while (!v) v = R()
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    }
    for (let i = 0; i < 2200; i++) {
      let x: number
      let y: number
      if (R() < 0.5) {
        const a = R() * Math.PI * 2
        const d = Math.abs(gauss()) * 230 + 270
        x = CX + Math.cos(a) * d
        y = CY + Math.sin(a) * d * 0.85
      } else {
        x = R() * 1920
        y = R() * 1080
      }
      const r = R() * R() * 1.25 + 0.25
      const al = R() * 0.32 + 0.04
      c.fillStyle = R() < 0.025 ? `rgba(255,109,40,${Math.min(1, al + 0.3)})` : `rgba(255,255,255,${al})`
      c.beginPath()
      c.arc(x, y, r, 0, 7)
      c.fill()
    }
  }, [])
  return <canvas ref={lienzo} className="polvo" width={3840} height={2160} aria-hidden />
}
