'use client'

import { useEffect, useRef, useState } from 'react'
import { CONSENT_STORAGE_KEY, readConsent, trackingCookieNames, type ConsentChoice } from '@/lib/consent'
import { isPrivateSurface } from '@/lib/host-routing'

// Banner de cookies del sitio público. La carga de GTM la decide el script del <head>
// (lib/consent.ts); este banner guarda la elección y, al aceptar, carga las etiquetas.

const OPEN_EVENT = 'bralto:consent-open'

export type ConsentLabels = {
  title: string
  text: string
  privacy: string
  essential: string
  accept: string
}

declare global {
  interface Window {
    __braltoLoadTags?: () => void
    __braltoTagsLoaded?: boolean
  }
}

// GA y Meta guardan sus cookies en el dominio raíz (.bralto.io): se borran en cada variante
function clearTrackingCookies() {
  const host = location.hostname
  const root = host.split('.').slice(-2).join('.')
  for (const name of trackingCookieNames(document.cookie)) {
    for (const domain of ['', `; domain=${host}`, `; domain=.${root}`]) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain}`
    }
  }
}

export function ConsentBanner({ labels, privacyHref }: { labels: ConsentLabels; privacyHref?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    // En el panel y la firma de contratos no se carga nada: no hay nada que consentir
    if (isPrivateSurface(location.hostname, location.pathname)) return
    let stored: ConsentChoice | null = null
    try {
      stored = readConsent(localStorage.getItem(CONSENT_STORAGE_KEY))
    } catch {}
    const timer = stored ? undefined : window.setTimeout(() => setOpen(true), 900)
    const reopen = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, reopen)
    return () => {
      if (timer) window.clearTimeout(timer)
      window.removeEventListener(OPEN_EVENT, reopen)
    }
  }, [])

  // Mientras está abierto, la página reserva al final el alto que tapa el banner y el foco no
  // queda debajo (home.css): sin esto, el Continuar de /agendar quedaba fuera de alcance
  useEffect(() => {
    const el = ref.current
    if (!open || !el) return
    const root = document.documentElement
    // offsetHeight no cambia con la animación de entrada (transform)
    const update = () => {
      const bottom = parseFloat(getComputedStyle(el).bottom) || 0
      root.style.setProperty('--consent-space', `${Math.ceil(el.offsetHeight + bottom + 16)}px`)
    }
    update()
    root.setAttribute('data-consent-open', '')
    const observer = new ResizeObserver(update)
    observer.observe(el)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
      root.removeAttribute('data-consent-open')
      root.style.removeProperty('--consent-space')
    }
  }, [open])

  function choose(choice: ConsentChoice) {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, choice)
    } catch {}
    setOpen(false)
    if (choice === 'all') {
      window.__braltoLoadTags?.()
      return
    }
    // Las etiquetas que ya cargaron no se pueden descargar: se borran sus cookies y se recarga sin ellas
    if (window.__braltoTagsLoaded) {
      clearTrackingCookies()
      location.reload()
    }
  }

  if (!open) return null

  return (
    <section ref={ref} className="hm-consent hm-glass hm-glass--thick" aria-labelledby="hm-consent-title">
      <h2 id="hm-consent-title" className="hm-consent__title">
        {labels.title}
      </h2>
      <p className="hm-consent__text">
        {labels.text}
        {privacyHref && (
          <>
            {' '}
            <a href={privacyHref}>{labels.privacy}</a>
          </>
        )}
      </p>
      <div className="hm-consent__actions">
        <button type="button" className="hm-btn hm-btn--glass hm-glass hm-btn--sm" onClick={() => choose('essential')}>
          {labels.essential}
        </button>
        <button type="button" className="hm-btn hm-btn--solid hm-btn--sm" onClick={() => choose('all')}>
          {labels.accept}
        </button>
      </div>
    </section>
  )
}

// Botón del pie para volver a elegir
export function ConsentPreferencesButton({ label }: { label: string }) {
  return (
    <button type="button" className="hm-footer__textbtn" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      {label}
    </button>
  )
}
