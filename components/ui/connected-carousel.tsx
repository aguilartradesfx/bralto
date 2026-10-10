"use client"

import { LazyMotion, MotionConfig, m } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"
import { cn } from "@/lib/utils"
import "./connected-carousel.css"

/*
 * Connected Carousel (de 21st.dev, al estilo de las historias de clientes de Calendly): la tarjeta
 * del centro muestra el caso completo y las vecinas asoman como franjas unidas a ella por
 * "puentes". Abajo, una pestaña por caso con el avance del autoplay.
 *
 * Adaptado para el sitio:
 * - Sin estadísticas ni citas (no las hay reales): cada tarjeta lleva lo que se construyó, el punto
 *   de partida, el cliente con su industria y el enlace al caso.
 * - Colores y tipografías por variables CSS (--cc-*, ver connected-carousel.css) en lugar de los
 *   tokens de shadcn; las medidas salen del ancho disponible, no de la ventana.
 * - El avance del autoplay se pinta directo en el DOM (sin re-renderizar en cada cuadro) y se
 *   detiene con el puntero o el foco encima, fuera de pantalla, con "Pausar animaciones"
 *   (data-motion en <html>) o con movimiento reducido.
 * - Para lectores de pantalla existe solo la tarjeta activa, y los cambios se anuncian cuando los
 *   hace la persona. También se desliza con el dedo.
 */

export type ConnectedItem = {
  id: string
  /** Lo que se construyó: el título de la tarjeta. */
  title: string
  /** El punto de partida, en una frase. */
  text?: string
  /** Cliente e industria: las dos etiquetas unidas. */
  name: string
  tag: string
  image: string
  alt: string
  href: string
}

export type ConnectedCarouselProps = {
  items: ConnectedItem[]
  /** ms por caso; 0 apaga el autoplay. */
  autoPlayInterval?: number
  className?: string
  ariaLabel: string
  viewLabel: string
  viewIcon?: React.ReactNode
  linkClassName?: string
  /** Para lectores de pantalla: "{i}", "{n}" y "{title}" se reemplazan. */
  positionLabel: string
  imageSizes?: string
}

type Box = { w: number; h: number }
type Layout = { active: Box; s1: Box; s2: Box | null; g1: number; g2: number }

// Cuatro tamaños según el ancho disponible. g1 y g2 separan las tarjetas; los puentes los cubren
function layoutFor(width: number): Layout {
  if (width >= 1380) return { active: { w: 880, h: 560 }, s1: { w: 120, h: 380 }, s2: { w: 84, h: 232 }, g1: 20, g2: 16 }
  if (width >= 1170) return { active: { w: 740, h: 500 }, s1: { w: 105, h: 344 }, s2: { w: 74, h: 205 }, g1: 20, g2: 16 }
  if (width >= 800) return { active: { w: 560, h: 440 }, s1: { w: 100, h: 340 }, s2: null, g1: 20, g2: 16 }
  return { active: { w: Math.max(240, Math.min(340, width - 56)), h: 540 }, s1: { w: 60, h: 440 }, s2: null, g1: 16, g2: 16 }
}

function sameLayout(a: Layout, b: Layout): boolean {
  return a.active.w === b.active.w && a.active.h === b.active.h && a.s1.w === b.s1.w && !!a.s2 === !!b.s2
}

type Target = { x: number; y: number; width: number; height: number; opacity: number; zIndex: number; pointerEvents: "auto" | "none" }

// Dónde va cada tarjeta según su distancia a la activa (0)
function targetFor(offset: number, L: Layout): Target {
  const { active: A, s1, s2, g1, g2 } = L
  if (offset === 0) return { x: -A.w / 2, y: -A.h / 2, width: A.w, height: A.h, opacity: 1, zIndex: 0, pointerEvents: "auto" }
  const left = offset < 0
  const n = Math.abs(offset)
  if (n === 1) {
    return { x: left ? -A.w / 2 - g1 - s1.w : A.w / 2 + g1, y: -s1.h / 2, width: s1.w, height: s1.h, opacity: 1, zIndex: 100, pointerEvents: "auto" }
  }
  if (n === 2 && s2) {
    const edge = A.w / 2 + g1 + s1.w + g2
    return { x: left ? -edge - s2.w : edge, y: -s2.h / 2, width: s2.w, height: s2.h, opacity: 1, zIndex: 100, pointerEvents: "auto" }
  }
  // Las que no se ven esperan más afuera, listas para entrar
  const box = s2 ?? s1
  const outer = s2 ? A.w / 2 + g1 + s1.w + g2 + s2.w : A.w / 2 + g1 + s1.w
  const x = outer + 40 + (box.w + g2) * (n - (s2 ? 3 : 2))
  return { x: left ? -x - box.w : x, y: -box.h / 2, width: box.w, height: box.h, opacity: 0, zIndex: 0, pointerEvents: "none" }
}

const OFFSETS = [-4, -3, -2, -1, 0, 1, 2, 3, 4] as const
// Las animaciones llegan en un archivo aparte; mientras tanto, cada tarjeta ya está en su lugar
const loadFeatures = () => import("./connected-carousel-features").then((mod) => mod.default)
const SPRING = { type: "spring", stiffness: 220, damping: 26, mass: 0.75 } as const
const INSTANT = { duration: 0 } as const

const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

// Quieto con movimiento reducido o con "Pausar animaciones" (data-motion="paused" en <html>)
function useMotionPaused(): boolean {
  const [paused, setPaused] = React.useState(false)
  React.useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setPaused(mq.matches || root.dataset.motion === "paused")
    update()
    const mo = new MutationObserver(update)
    mo.observe(root, { attributes: true, attributeFilter: ["data-motion"] })
    mq.addEventListener("change", update)
    return () => {
      mo.disconnect()
      mq.removeEventListener("change", update)
    }
  }, [])
  return paused
}

function Bridge({ side, size }: { side: "left" | "right"; size: "big" | "small" }) {
  return (
    <span aria-hidden="true" className={cn("cc-bridge", `cc-bridge--${side}`, `cc-bridge--${size}`)}>
      {size === "big" ? (
        <svg viewBox="0 0 20 37.3338" preserveAspectRatio="none">
          <path d="M0 0C0 0 1.2422 13.5759 10 13.5759C18.7578 13.5759 20 0 20 0V37.3338C20 37.3338 18.7578 23.7578 10 23.7578C1.2422 23.7578 0 37.3338 0 37.3338V0Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 28" preserveAspectRatio="none">
          <path d="M0 0C0 0 0.993759 10.1818 8 10.1818C15.0062 10.1818 16 0 16 0V28C16 28 15.0062 17.8182 8 17.8182C0.993759 17.8182 0 28 0 28V0Z" />
        </svg>
      )}
    </span>
  )
}

export function ConnectedCarousel({
  items,
  autoPlayInterval = 6000,
  className,
  ariaLabel,
  viewLabel,
  viewIcon,
  linkClassName,
  positionLabel,
  imageSizes = "(min-width: 1170px) 800px, (min-width: 800px) 640px, 360px",
}: ConnectedCarouselProps) {
  const uid = React.useId()
  const total = items.length
  const motionPaused = useMotionPaused()
  const [page, setPage] = React.useState(0)
  const [layout, setLayout] = React.useState<Layout>(() => layoutFor(1240))
  const [instant, setInstant] = React.useState(true)
  const [focused, setFocused] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const tabsRef = React.useRef<HTMLDivElement>(null)
  const fillRef = React.useRef<HTMLSpanElement>(null)
  const elapsed = React.useRef(0)
  const hovered = React.useRef(false)
  const focusedRef = React.useRef(false)
  const onScreen = React.useRef(true)
  const refocusTab = React.useRef(false)
  const swipe = React.useRef<{ x: number; y: number } | null>(null)
  const swiped = React.useRef(false)

  const activeIndex = total ? ((page % total) + total) % total : 0
  const rotating = autoPlayInterval > 0 && total > 1 && !motionPaused
  const go = React.useCallback((delta: number) => {
    elapsed.current = 0
    if (fillRef.current) fillRef.current.style.transform = "scaleX(0)"
    setPage((p) => p + delta)
  }, [])

  // Medidas según el ancho disponible; la primera, sin animar (antes de pintar)
  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const apply = (width: number) => {
      const next = layoutFor(width)
      setLayout((prev) => (sameLayout(prev, next) ? prev : next))
    }
    apply(root.clientWidth)
    const ro = new ResizeObserver(([entry]) => apply(entry.contentRect.width))
    ro.observe(root)
    return () => ro.disconnect()
  }, [])

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setInstant(false))
    return () => cancelAnimationFrame(id)
  }, [])

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver(([e]) => {
      onScreen.current = e.isIntersecting
    })
    io.observe(root)
    return () => io.disconnect()
  }, [])

  // Autoplay: el avance se pinta en la pestaña activa; se congela con el puntero o el foco encima
  React.useEffect(() => {
    if (!rotating) {
      if (fillRef.current) fillRef.current.style.transform = "scaleX(0)"
      return
    }
    let raf = 0
    let last: number | null = null
    const step = (now: number) => {
      const hold = hovered.current || focusedRef.current || !onScreen.current || document.hidden
      if (last !== null && !hold) elapsed.current += now - last
      last = now
      if (elapsed.current >= autoPlayInterval) {
        elapsed.current = 0
        setPage((p) => p + 1)
      }
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${Math.min(elapsed.current / autoPlayInterval, 1)})`
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [rotating, autoPlayInterval])

  // Con las flechas sobre las pestañas, el foco sigue a la pestaña activa
  React.useEffect(() => {
    if (!refocusTab.current) return
    refocusTab.current = false
    tabsRef.current?.querySelector<HTMLButtonElement>(`[data-index="${activeIndex}"]`)?.focus()
  }, [activeIndex])

  if (!total) return null

  const goTo = (idx: number) => {
    let diff = idx - activeIndex
    if (diff > total / 2) diff -= total
    else if (diff < -total / 2) diff += total
    if (diff) go(diff)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    refocusTab.current = !!tabsRef.current?.contains(document.activeElement)
    go(e.key === "ArrowLeft" ? -1 : 1)
  }

  const onCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (swiped.current) {
      swiped.current = false
      return
    }
    const offset = Number(e.currentTarget.dataset.offset)
    if (offset) go(offset)
  }

  const A = layout.active
  const item = items[activeIndex]
  const position = positionLabel
    .replace("{i}", String(activeIndex + 1))
    .replace("{n}", String(total))
    .replace("{title}", item.name)

  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <div
          ref={rootRef}
          className={cn("cc", className)}
          role="region"
          aria-roledescription="carousel"
          aria-label={ariaLabel}
          onKeyDown={onKeyDown}
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") hovered.current = true
          }}
          onPointerLeave={() => {
            hovered.current = false
          }}
          onFocus={() => {
            focusedRef.current = true
            setFocused(true)
          }}
          onBlur={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
            focusedRef.current = false
            setFocused(false)
          }}
        >
          <div
            id={`${uid}-panel`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-${activeIndex}`}
            className="cc-stage"
            style={{ height: A.h }}
            onPointerDown={(e) => {
              swipe.current = { x: e.clientX, y: e.clientY }
              swiped.current = false
            }}
            onPointerUp={(e) => {
              const s = swipe.current
              swipe.current = null
              if (!s) return
              const dx = e.clientX - s.x
              const dy = e.clientY - s.y
              if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
                swiped.current = true
                go(dx < 0 ? 1 : -1)
              }
            }}
            onPointerCancel={() => {
              swipe.current = null
            }}
          >
            {OFFSETS.map((offset) => {
              const virtual = page + offset
              const card = items[((virtual % total) + total) % total]
              const isActive = offset === 0
              const near = Math.abs(offset) <= 1
              return (
                <m.div
                  key={virtual}
                  data-offset={offset}
                  className={cn("cc-card", !isActive && "is-side")}
                  style={{ position: "absolute", left: "50%", top: "50%" }}
                  initial={false}
                  animate={targetFor(offset, layout)}
                  transition={instant ? INSTANT : SPRING}
                  onClick={onCardClick}
                  aria-hidden={isActive ? undefined : true}
                >
                  {offset === -1 && <Bridge side="right" size="big" />}
                  {offset === 1 && <Bridge side="left" size="big" />}
                  {layout.s2 && offset === -2 && <Bridge side="right" size="small" />}
                  {layout.s2 && offset === 2 && <Bridge side="left" size="small" />}

                  <div className="cc-card__clip">
                    <m.div
                      className={cn("cc-card__thumb", offset < 0 ? "is-left" : "is-right", isActive && "is-off")}
                      initial={false}
                      animate={{ opacity: isActive ? 0 : 1 }}
                      transition={instant ? INSTANT : { duration: 0.22, ease: "easeOut" }}
                    >
                      <div className="cc-card__shot">
                        <Image src={card.image} alt="" fill sizes={imageSizes} draggable={false} />
                      </div>
                    </m.div>

                    {/* El contenido entra de costado; solo lo llevan la activa y sus vecinas */}
                    {near && (
                      <div className="cc-card__stage" style={{ width: A.w, height: A.h }}>
                        <m.div
                          className={cn("cc-card__body", !isActive && "is-off")}
                          initial={false}
                          animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : offset < 0 ? -(A.w + 60) : A.w + 60 }}
                          transition={instant ? INSTANT : SPRING}
                        >
                          {/* Arriba, quién es; abajo, qué se hizo, de dónde partió y el enlace */}
                          <div className="cc-card__text">
                            <div className="cc-chips">
                              <span className="cc-chip">{card.name}</span>
                              <span className="cc-chips__link" aria-hidden="true">
                                <svg viewBox="0 -2 14 12" width="14" height="10" preserveAspectRatio="none">
                                  <path d="M0 -2 V0 C0 0 5.09091 0.49688 5.09091 4 C5.09091 7.50312 0 8 0 8 V10 H14 V8 C14 8 8.90909 7.50312 8.90909 4 C8.90909 0.49688 14 0 14 0 V-2 Z" />
                                </svg>
                              </span>
                              <span className="cc-chip cc-chip--tag">{card.tag}</span>
                            </div>
                            <div className="cc-card__copy">
                              <h3 className="cc-card__title">{card.title}</h3>
                              {card.text ? <p className="cc-card__ctx">{card.text}</p> : null}
                              {isActive ? (
                                <Link
                                  href={card.href}
                                  className={cn("cc-card__link", linkClassName)}
                                  aria-label={`${viewLabel}: ${card.name}`}
                                >
                                  {viewLabel}
                                  {viewIcon}
                                </Link>
                              ) : null}
                            </div>
                          </div>
                          <div className="cc-card__media">
                            <Image src={card.image} alt={isActive ? card.alt : ""} fill sizes={imageSizes} draggable={false} />
                          </div>
                        </m.div>
                      </div>
                    )}
                  </div>
                </m.div>
              )
            })}
          </div>

          <div ref={tabsRef} role="tablist" aria-label={ariaLabel} className="cc-tabs">
            {items.map((it, idx) => {
              const on = idx === activeIndex
              return (
                <button
                  key={it.id}
                  type="button"
                  role="tab"
                  id={`${uid}-tab-${idx}`}
                  data-index={idx}
                  aria-controls={`${uid}-panel`}
                  aria-selected={on}
                  aria-label={it.name}
                  tabIndex={on ? 0 : -1}
                  className={cn("cc-tab", on && "is-on")}
                  onClick={() => goTo(idx)}
                >
                  <span className="cc-tab__bar">{on ? <span ref={fillRef} className="cc-tab__fill" /> : null}</span>
                </button>
              )
            })}
          </div>

          <p className="cc-sr" aria-live={rotating && !focused ? "off" : "polite"} aria-atomic="true">
            {position}
          </p>
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}
