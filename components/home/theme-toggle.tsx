'use client'

import { useLayoutEffect, useState } from 'react'
import { resolveTheme, THEME_STORAGE_KEY, type HomeTheme } from '@/lib/home/theme'
import { Moon, Sun } from './icons'

function homeRoot() {
  return document.querySelector<HTMLElement>('.hm')
}

export function ThemeToggle({ label }: { label: string }) {
  const [theme, setTheme] = useState<HomeTheme>('dark')

  // En la carga inicial ya lo fijó el script inline; al llegar navegando desde otra
  // página ese script no corre, así que se aplica aquí antes de pintar.
  useLayoutEffect(() => {
    const root = homeRoot()
    if (!root) return
    let stored: string | null = null
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY)
    } catch {}
    const current = resolveTheme(stored, matchMedia('(prefers-color-scheme: light)').matches)
    root.dataset.theme = current
    setTheme(current)
  }, [])

  function toggle() {
    const root = homeRoot()
    if (!root) return
    const next: HomeTheme = theme === 'light' ? 'dark' : 'light'
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {}
    const apply = () => {
      root.dataset.theme = next
    }
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(apply)
    } else {
      apply()
    }
    setTheme(next)
  }

  return (
    <button type="button" className="hm-toggle" aria-pressed={theme === 'light'} aria-label={label} onClick={toggle}>
      <Moon className="hm-toggle__icon hm-toggle__icon--moon" />
      <Sun className="hm-toggle__icon hm-toggle__icon--sun" />
      <span className="hm-toggle__knob" />
    </button>
  )
}
