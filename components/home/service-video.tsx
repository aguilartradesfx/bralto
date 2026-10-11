'use client'

import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { LINE } from './icons'

export type ServiceVideoLabels = { label: string; sound: string; mute: string; play: string; pause: string }

type Props = { src: string; srcMobile: string; poster: string; labels: ServiceVideoLabels; note?: string }

// Video del héroe de cada servicio. Arranca solo, en silencio y en bucle: los subtítulos van
// dentro del video, así que se entiende sin audio. "Activar sonido" lo reinicia con audio.
// No arranca solo si el visitante pausó las animaciones del sitio, pide menos movimiento o
// ahorra datos; fuera de la pantalla se pausa y vuelve al aparecer.
export function ServiceVideo({ src, srcMobile, poster, labels, note }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const pausedByUser = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    video.muted = true
    const motionPaused = () => document.documentElement.dataset.motion === 'paused'
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || motionPaused() || saveData) {
      pausedByUser.current = true
    }

    const visible = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) video.pause()
        else if (!pausedByUser.current) video.play().catch(() => {})
      },
      { threshold: 0.25 },
    )
    visible.observe(video)

    // "Pausar animaciones" del pie también lo detiene
    const motion = new MutationObserver(() => {
      if (motionPaused()) {
        pausedByUser.current = true
        video.pause()
      }
    })
    motion.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] })

    return () => {
      visible.disconnect()
      motion.disconnect()
    }
  }, [])

  const togglePlay = () => {
    const video = ref.current
    if (!video) return
    if (video.paused) {
      pausedByUser.current = false
      video.play().catch(() => {})
    } else {
      pausedByUser.current = true
      video.pause()
    }
  }

  // Al activar el sonido arranca desde el principio, para escuchar la explicación completa
  const toggleSound = () => {
    const video = ref.current
    if (!video) return
    if (video.muted) {
      video.muted = false
      video.currentTime = 0
      pausedByUser.current = false
      video.play().catch(() => {})
    } else {
      video.muted = true
    }
    setMuted(video.muted)
  }

  return (
    <figure className="sv-video">
      <div className="sv-video__frame">
        <video
          ref={ref}
          className="sv-video__media"
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          aria-label={labels.label}
          onClick={togglePlay}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
        >
          <source src={srcMobile} type="video/mp4" media="(max-width: 767px)" />
          <source src={src} type="video/mp4" />
        </video>
        <div className="sv-video__controls">
          <button
            type="button"
            className="sv-video__btn sv-video__btn--icon"
            onClick={togglePlay}
            aria-label={playing ? labels.pause : labels.play}
          >
            {playing ? <Pause size={16} {...LINE} /> : <Play size={16} {...LINE} />}
          </button>
          <button type="button" className="sv-video__btn" onClick={toggleSound}>
            {muted ? <VolumeX size={16} {...LINE} /> : <Volume2 size={16} {...LINE} />}
            <span>{muted ? labels.sound : labels.mute}</span>
          </button>
        </div>
      </div>
      {note && <figcaption className="sv-video__note">{note}</figcaption>}
    </figure>
  )
}
