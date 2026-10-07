'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { isPrivateSurface } from '@/lib/host-routing'

// Fondo de partículas con scroll (fondo-particulas-handoff.md): comportamiento de la
// implementación de referencia, montado una sola vez en el layout raíz.
// Mejoras aplicadas (aprobadas): nitidez en retina, velocidad igual a 60 y 120 Hz,
// sin saltos por el resize de la barra del navegador en móvil y 30 cuadros/s en
// pantallas táctiles (el vidrio del home se recalcula con cada cuadro).
// Adaptaciones: monocromo según el tema del home (en claro, negro y algo más opaco,
// como indica el handoff), un frame quieto con prefers-reduced-motion y apagado en
// superficies privadas (panel y firma de contratos), igual que GTM.

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  opacityTarget: number
  opacitySpeed: number
}

interface TravelLine {
  x: number
  y: number
  angle: number
  length: number
  speed: number
  opacity: number
  maxOpacity: number
  phase: 'fadein' | 'travel' | 'fadeout'
  traveled: number
  travelMax: number
  strokeWidth: number
}

const FRAME_60 = 1000 / 60

export function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctxRaw = canvas.getContext('2d')
    if (!ctxRaw) return
    const ctx: CanvasRenderingContext2D = ctxRaw
    if (isPrivateSurface(window.location.hostname, pathname)) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    // Tinta según el tema del home (las demás páginas son oscuras)
    const ink = () =>
      document.querySelector<HTMLElement>('.hm')?.dataset.theme === 'light'
        ? { rgb: '0,0,0', gain: 1.6 }
        : { rgb: '255,255,255', gain: 1 }
    const alpha = (value: number, gain: number) => Math.min(1, value * gain).toFixed(3)

    let animId = 0
    let W = window.innerWidth
    let H = window.innerHeight

    const setSize = () => {
      W = window.innerWidth
      H = window.innerHeight
      // Retina: el canvas se dibuja a la densidad real de la pantalla (tope 2x por rendimiento)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    setSize()

    // ── Scroll con inercia ─────────────────────────────────────────────────────
    let targetScrollY = window.scrollY
    let smoothScrollY = window.scrollY
    let prevSmoothScrollY = window.scrollY
    const LERP = 0.055

    // ── Partículas ─────────────────────────────────────────────────────────────
    const PARTICLE_COUNT = 70
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.2 + 0.4,
      opacity: Math.random() * 0.15,
      opacityTarget: Math.random() * 0.2 + 0.04,
      opacitySpeed: Math.random() * 0.004 + 0.001,
    }))

    // ── Líneas de luz ──────────────────────────────────────────────────────────
    const MAX_LINES = 6
    const lines: TravelLine[] = []

    function makeLine(): TravelLine {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        angle: Math.random() * Math.PI * 2,
        length: Math.random() * 120 + 60,
        speed: Math.random() * 0.7 + 0.25,
        opacity: 0,
        maxOpacity: Math.random() * 0.09 + 0.03,
        phase: 'fadein',
        traveled: 0,
        travelMax: Math.random() * 400 + 150,
        strokeWidth: Math.random() * 0.4 + 0.2,
      }
    }

    function drawParticle(p: Particle, opacity: number, rgb: string, gain: number) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${rgb},${alpha(opacity, gain)})`
      ctx.fill()
    }

    // Las velocidades de la referencia están en px por cuadro a 60 Hz: se escalan por el
    // tiempo real entre cuadros (dt = 1 a 60 Hz, 0.5 a 120 Hz, 2 a 30 cuadros/s)
    const touch = window.matchMedia('(pointer: coarse)').matches
    const minFrameMs = touch ? 1000 / 30 : 0
    let last = performance.now()

    function tick(now: number) {
      animId = requestAnimationFrame(tick)
      if (now - last < minFrameMs - 1) return
      const dt = Math.min((now - last) / FRAME_60, 4) // tope por si la pestaña estuvo en pausa
      last = now

      ctx.clearRect(0, 0, W, H)
      const { rgb, gain } = ink()

      targetScrollY = window.scrollY
      smoothScrollY += (targetScrollY - smoothScrollY) * (1 - Math.pow(1 - LERP, dt))
      const scrollDelta = smoothScrollY - prevSmoothScrollY
      prevSmoothScrollY = smoothScrollY

      if (lines.length < MAX_LINES && Math.random() < 1 - Math.pow(1 - 0.004, dt)) {
        lines.push(makeLine())
      }

      for (const p of particles) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.y -= scrollDelta

        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < -20) p.y = H + 20
        if (p.y > H + 20) p.y = -20

        if (p.opacity < p.opacityTarget) {
          p.opacity = Math.min(p.opacity + p.opacitySpeed * dt, p.opacityTarget)
        } else {
          p.opacity = Math.max(p.opacity - p.opacitySpeed * dt, 0)
          if (p.opacity === 0) {
            p.opacityTarget = Math.random() * 0.2 + 0.04
            p.vx += (Math.random() - 0.5) * 0.06
            p.vy += (Math.random() - 0.5) * 0.06
            p.vx = Math.max(-0.5, Math.min(0.5, p.vx))
            p.vy = Math.max(-0.5, Math.min(0.5, p.vy))
          }
        }

        drawParticle(p, p.opacity, rgb, gain)
      }

      for (let i = lines.length - 1; i >= 0; i--) {
        const l = lines[i]
        l.y -= scrollDelta

        if (l.phase === 'fadein') {
          l.opacity += 0.0015 * dt
          if (l.opacity >= l.maxOpacity) {
            l.opacity = l.maxOpacity
            l.phase = 'travel'
          }
        } else if (l.phase === 'travel') {
          const step = l.speed * dt
          l.x += Math.cos(l.angle) * step
          l.y += Math.sin(l.angle) * step
          l.traveled += step
          if (l.traveled >= l.travelMax) l.phase = 'fadeout'
        } else {
          l.opacity -= 0.0015 * dt
          if (l.opacity <= 0) {
            lines.splice(i, 1)
            continue
          }
        }

        const x2 = l.x + Math.cos(l.angle) * l.length
        const y2 = l.y + Math.sin(l.angle) * l.length
        const grad = ctx.createLinearGradient(l.x, l.y, x2, y2)
        grad.addColorStop(0, `rgba(${rgb},0)`)
        grad.addColorStop(0.25, `rgba(${rgb},${alpha(l.opacity, gain)})`)
        grad.addColorStop(0.75, `rgba(${rgb},${alpha(l.opacity, gain)})`)
        grad.addColorStop(1, `rgba(${rgb},0)`)

        ctx.beginPath()
        ctx.moveTo(l.x, l.y)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = grad
        ctx.lineWidth = l.strokeWidth
        ctx.stroke()
      }
    }

    // Movimiento reducido: un solo frame quieto, que se redibuja si cambia el tema o el tamaño
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const drawStatic = () => {
      ctx.clearRect(0, 0, W, H)
      const { rgb, gain } = ink()
      for (const p of particles) drawParticle(p, p.opacityTarget * 0.7, rgb, gain)
    }
    let themeObserver: MutationObserver | null = null

    if (reduced) {
      drawStatic()
      const home = document.querySelector<HTMLElement>('.hm')
      if (home) {
        themeObserver = new MutationObserver(drawStatic)
        themeObserver.observe(home, { attributes: true, attributeFilter: ['data-theme'] })
      }
    } else {
      animId = requestAnimationFrame(tick)
    }

    const onResize = () => {
      // En móvil la barra de direcciones cambia solo el alto al hacer scroll: ahí no se
      // recolocan las partículas (se vería como un salto)
      const widthChanged = window.innerWidth !== W
      setSize()
      if (widthChanged) {
        for (const p of particles) {
          p.x = Math.random() * W
          p.y = Math.random() * H
        }
      }
      if (reduced) drawStatic()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      themeObserver?.disconnect()
    }
  }, [pathname])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 h-full w-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
