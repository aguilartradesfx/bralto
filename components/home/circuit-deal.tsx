'use client'

import { LazyMotion, m, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
import * as React from 'react'

// Las seis capas empiezan apiladas detrás de "Su sitio web" y se reparten a su lugar con el scroll
// (adaptado de Distributed Cards de Systaliko UI, vía 21st.dev). Arrancan cuando la sección asoma
// por abajo y terminan cuando su centro llega al centro de la pantalla: la animación se ve entera y
// no fija la página. En teléfonos y con movimiento reducido quedan quietas en su lugar.

type Layer = { title: string; body: string }
type Offset = { dx: number; dy: number; r: number }

const TILT = [-7, 5, -3, 6, -5, 3]
const loadFeatures = () => import('@/components/ui/motion-features').then((mod) => mod.default)

function DealCard({
  layer,
  index,
  progress,
  offset,
  cardRef,
}: {
  layer: Layer
  index: number
  progress: MotionValue<number>
  offset: Offset | null
  cardRef: (el: HTMLLIElement | null) => void
}) {
  const x = useTransform(progress, (v) => (offset ? (1 - v) * offset.dx : 0))
  const y = useTransform(progress, (v) => (offset ? (1 - v) * offset.dy : 0))
  const rotate = useTransform(progress, (v) => (offset ? (1 - v) * offset.r : 0))
  const scale = useTransform(progress, (v) => (offset ? 0.84 + 0.16 * v : 1))
  return (
    <m.li ref={cardRef} className="hm-deal__card hm-glass" style={{ x, y, rotate, scale, zIndex: 6 - index }}>
      <div className="hm-layer__top">
        <span>{index + 1}</span>
      </div>
      <h3>{layer.title}</h3>
      <p>{layer.body}</p>
    </m.li>
  )
}

export function CircuitDeal({ hubLabel, hubTitle, layers }: { hubLabel: string; hubTitle: string; layers: Layer[] }) {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const doorRef = React.useRef<HTMLDivElement>(null)
  const cards = React.useRef<(HTMLLIElement | null)[]>([])
  const reduce = useReducedMotion()
  const [offsets, setOffsets] = React.useState<Offset[] | null>(null)
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ['start end', 'center center'] })
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 })

  // Cuánto viaja cada tarjeta desde el centro de la puerta hasta su lugar (medido sin transformaciones)
  React.useLayoutEffect(() => {
    const measure = () => {
      const door = doorRef.current
      if (!door || reduce || window.innerWidth < 1024) {
        setOffsets(null)
        return
      }
      const cx = door.offsetLeft + door.offsetWidth / 2
      const cy = door.offsetTop + door.offsetHeight / 2
      setOffsets(
        cards.current.map((el, i) =>
          el
            ? { dx: cx - (el.offsetLeft + el.offsetWidth / 2), dy: cy - (el.offsetTop + el.offsetHeight / 2), r: TILT[i % TILT.length] }
            : { dx: 0, dy: 0, r: 0 },
        ),
      )
    }
    measure()
    // Con la fuente ya cargada, las tarjetas pueden medir otra cosa
    document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [reduce])

  const row = (from: number, to: number) => (
    <ul className="hm-deal__row">
      {layers.slice(from, to).map((layer, k) => {
        const i = from + k
        return (
          <DealCard
            key={layer.title}
            layer={layer}
            index={i}
            progress={progress}
            offset={offsets?.[i] ?? null}
            cardRef={(el) => {
              cards.current[i] = el
            }}
          />
        )
      })}
    </ul>
  )

  return (
    <LazyMotion features={loadFeatures} strict>
      <div ref={stageRef} className="hm-deal">
        {row(0, 3)}
        <div ref={doorRef} className="hm-deal__door hm-glass hm-glass--thick">
          <span className="hm-hub__label">{hubLabel}</span>
          <span className="hm-hub__title">{hubTitle}</span>
        </div>
        {row(3, 6)}
      </div>
    </LazyMotion>
  )
}
