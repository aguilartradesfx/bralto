'use client'

import { useEffect } from 'react'
import '@/components/guias/guias.css'

// Si algo falla al armar o mostrar una guía (Supabase sin responder, un error en el navegador), en vez
// de la pantalla de error de Next sale este aviso dentro del sitio, con la forma de volver a intentar
export default function ErrorGuia({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error('guias: la página falló', error)
  }, [error])

  return (
    <main>
      <section className="hm-hero hm-hero--page hm-hero--fit gu-cabeza" aria-labelledby="gu-fallo-titulo">
        <div className="hm-wrap gu-hero">
          <p className="hm-eyebrow">Guía</p>
          <h1 id="gu-fallo-titulo" className="hm-page-title">
            No pudimos abrir la guía
          </h1>
          <p className="hm-lead">Puede ser la conexión. Intente de nuevo en un momento.</p>
          <button type="button" className="hm-btn hm-btn--solid" onClick={() => window.location.reload()}>
            Intentar de nuevo
          </button>
        </div>
      </section>
    </main>
  )
}
