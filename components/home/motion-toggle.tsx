'use client'

import { useEffect, useState } from 'react'
import { MOTION_STORAGE_KEY } from '@/lib/home/motion'

// Botón del pie para pausar y reanudar las animaciones que se mueven solas (lib/home/motion.ts)
export function MotionToggle({ pauseLabel, resumeLabel }: { pauseLabel: string; resumeLabel: string }) {
  const [paused, setPaused] = useState(false)

  // El script del <head> ya aplicó la pausa guardada; si se llegó navegando desde otra sección
  // (otro <html>), ese script no corrió y se aplica aquí
  useEffect(() => {
    const root = document.documentElement
    try {
      if (localStorage.getItem(MOTION_STORAGE_KEY) === 'paused') root.dataset.motion = 'paused'
    } catch {}
    setPaused(root.dataset.motion === 'paused')
  }, [])

  function toggle() {
    const root = document.documentElement
    const next = !paused
    if (next) root.dataset.motion = 'paused'
    else delete root.dataset.motion
    try {
      localStorage.setItem(MOTION_STORAGE_KEY, next ? 'paused' : 'running')
    } catch {}
    setPaused(next)
  }

  return (
    <button type="button" className="hm-footer__textbtn" onClick={toggle}>
      {paused ? resumeLabel : pauseLabel}
    </button>
  )
}
