'use client'

import { Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type ServiceVideoLabels = { label: string; play: string }

type Props = { src: string; srcMobile: string; poster: string; labels: ServiceVideoLabels; note?: string }

// Video del héroe de cada servicio (decisión de Alejandro): se ve desenfocado hasta que la
// persona aprieta el botón, y entonces arranca desde el principio, siempre con sonido. Sin
// controles de pausa ni volumen: o lo ve, o no. Fuera de la pantalla se pausa y sigue al
// volver; al terminar vuelve al estado inicial para verlo otra vez.
export function ServiceVideo({ src, srcMobile, poster, labels, note }: Props) {
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
    <figure className={`sv-video${playing ? ' is-playing' : ''}`}>
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
        {!playing && (
          <button type="button" className="sv-video__play" onClick={start} aria-label={labels.play}>
            <span className="sv-video__knob" aria-hidden="true">
              <Play className="sv-video__icon" size={26} strokeWidth={1.5} absoluteStrokeWidth fill="currentColor" />
            </span>
          </button>
        )}
      </div>
      {note && <figcaption className="sv-video__note">{note}</figcaption>}
    </figure>
  )
}
