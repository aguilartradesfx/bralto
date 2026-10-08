'use client'

import { useEffect } from 'react'

// Fija el idioma del documento después de hidratar: el layout raíz no lo sabe en el servidor y
// en algunas rutas React quita el que puso el script inline al hidratar <html>
export function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return null
}
