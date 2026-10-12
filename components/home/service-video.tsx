'use client'

import { Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type ServiceVideoLabels = { label: string; play: string; cta: string; heading: string }

type Props = { src: string; srcMobile: string; poster: string; duration: string; labels: ServiceVideoLabels; note?: string }

// Video del héroe de cada servicio (decisión de Alejandro): se ve desenfocado hasta que la
// persona aprieta el botón, y entonces arranca desde el principio, siempre con sonido. Sin
// controles de pausa ni volumen: o lo ve, o no. Fuera de la pantalla se pausa y sigue al
// volver; al terminar vuelve al estado inicial para verlo otra vez.
// Va en una hoja de vidrio grueso, como la consola del inicio, con su etiqueta mono arriba.
export function ServiceVideo({ src, srcMobile, poster, duration, labels, note }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const started = useRef(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const visible = new IntersectionObserver(
      ([entry]) => {
        if (!started.current) return
        if (!entry.isIntersecting) video.pause()
        else video.play().catch(() => reset())
      },
      { threshold: 0.25 },
    )
    visible.observe(video)
    return () => visible.disconnect()
  }, [])

  // Si el navegador no deja seguir con sonido (o el video terminó), vuelve al botón
  function reset() {
    started.current = false
    setPlaying(false)
  }

  function start() {
    const video = ref.current
    if (!video) return
    video.muted = false
    video.volume = 1
    video.currentTime = 0
    started.current = true
    setPlaying(true)
    video.play().catch(() => reset())
  }

  return (
    <figure className={`sv-video hm-glass hm-glass--thick${playing ? ' is-playing' : ''}`}>
      <figcaption className="sv-video__head">
        <span>{labels.heading}</span>
        <span>{note ? `${note} · ${duration}` : duration}</span>
      </figcaption>
      <div className="sv-video__frame">
        <video
          ref={ref}
          className="sv-video__media"
          playsInline
          preload="metadata"
          poster={poster}
          aria-label={labels.label}
          onEnded={reset}
        >
          <source src={srcMobile} type="video/mp4" media="(max-width: 767px)" />
          <source src={src} type="video/mp4" />
        </video>
        {/* El switch de tema en grande: la pista negra en píldora y la perilla brillante con el play */}
        {!playing && (
          <button type="button" className="sv-video__play" onClick={start} aria-label={labels.play}>
            <span className="sv-video__knob" aria-hidden="true">
              <Play className="sv-video__icon" size={18} strokeWidth={1.5} absoluteStrokeWidth fill="currentColor" />
            </span>
            <span className="sv-video__cta" aria-hidden="true">
              {labels.cta}
            </span>
          </button>
        )}
      </div>
    </figure>
  )
}
