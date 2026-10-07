'use client'

import { useEffect } from 'react'

// Reflejo especular y borde vivo que siguen al cursor.
// Solo con puntero fino, solo sobre los vidrios visibles, un cuadro por frame.
export function Specular() {
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const visible = new Set<HTMLElement>()
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target as HTMLElement)
        else visible.delete(e.target as HTMLElement)
      }
    })
    document.querySelectorAll<HTMLElement>('.hm .hm-glass').forEach((el) => io.observe(el))

    // Ángulo continuo por elemento: evita que el borde dé la vuelta completa al cruzar ±180°
    const lastAngle = new WeakMap<HTMLElement, number>()
    let x = 0
    let y = 0
    let moved = false
    let frame = 0

    const paint = () => {
      frame = 0
      const els = [...visible]
      const rects = els.map((el) => el.getBoundingClientRect()) // leer todo antes de escribir
      els.forEach((el, i) => {
        const r = rects[i]
        let angle = (Math.atan2(x - (r.left + r.width / 2), r.top + r.height / 2 - y) * 180) / Math.PI
        const prev = lastAngle.get(el)
        if (prev !== undefined) angle += Math.round((prev - angle) / 360) * 360
        lastAngle.set(el, angle)
        el.style.setProperty('--mx', `${x - r.left}px`)
        el.style.setProperty('--my', `${y - r.top}px`)
        el.style.setProperty('--hm-rim', `${angle.toFixed(1)}deg`)
      })
    }

    const schedule = () => {
      if (moved && !frame) frame = requestAnimationFrame(paint)
    }
    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      moved = true
      schedule()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', schedule)
      cancelAnimationFrame(frame)
    }
  }, [])

  return null
}
