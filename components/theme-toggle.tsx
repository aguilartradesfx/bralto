'use client'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Avoid hydration mismatch — render a placeholder until mounted
  if (!mounted) return <div className="h-8 w-8" />

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-white/45 hover:text-gray-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.07] border border-transparent hover:border-gray-200 dark:hover:border-white/[0.08] transition-all duration-200"
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
