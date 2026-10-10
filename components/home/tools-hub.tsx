'use client'

import * as React from 'react'

// Lo que hoy se paga por separado, conectado a "Su plataforma" (adaptado de Integrations Orbit de
// Hirael y Animated Beam de Magic UI, vía 21st.dev). A la izquierda, cada herramienta con su precio
// tachado; a la derecha, cada una unida al centro por una línea y un pulso de neón que viaja hacia
// adentro. Las etiquetas son sólidas (la línea no se ve detrás del texto) y las líneas terminan en
// el borde del centro. Pasar el puntero por una herramienta enciende su conexión. Los pulsos se
// detienen con "Pausar animaciones" y con movimiento reducido (home.css).

type Tool = { name: string; price: string }

// viewBox de 100 × 100: herramientas sobre un círculo de radio 41; el centro mide 30 × 22
const ORBIT = 41
const CORE_HALF = { w: 15, h: 11 }
const GAP = 1.6

const round = (n: number) => Math.round(n * 100) / 100

function spoke(k: number, n: number) {
  const a = ((360 / n) * k - 90) * (Math.PI / 180)
  const ux = Math.cos(a)
  const uy = Math.sin(a)
  // Hasta dónde llega la línea: el borde del rectángulo del centro, más un respiro
  const toEdge = Math.min(CORE_HALF.w / Math.max(Math.abs(ux), 1e-6), CORE_HALF.h / Math.max(Math.abs(uy), 1e-6)) + GAP
  return {
    x: 50 + ORBIT * ux,
    y: 50 + ORBIT * uy,
    d: `M ${round(50 + ORBIT * ux)} ${round(50 + ORBIT * uy)} L ${round(50 + toEdge * ux)} ${round(50 + toEdge * uy)}`,
  }
}

export function ToolsHub({
  tools,
  hubLabel,
  hubTitle,
  separately,
  included,
  check,
}: {
  tools: Tool[]
  hubLabel: string
  hubTitle: string
  separately: string
  included: string
  check: React.ReactNode
}) {
  const [active, setActive] = React.useState<string | null>(null)
  const spokes = tools.map((_, k) => spoke(k, tools.length))

  return (
    <div className="hm-tools__grid">
      <div className="hm-tools__list hm-glass hm-rv">
        <ul onMouseLeave={() => setActive(null)}>
          {tools.map((tool) => (
            <li key={tool.name} className={active === tool.name ? 'is-on' : undefined} onMouseEnter={() => setActive(tool.name)}>
              <span>{tool.name}</span>
              <s className="hm-strike">{tool.price}</s>
            </li>
          ))}
        </ul>
        <div className="hm-tools__total">
          <s className="hm-strike">{separately}</s>
          <p className="hm-receipt__new hm-inset">
            {check}
            {included}
          </p>
        </div>
      </div>

      <div className="hm-hubmap" role="img" aria-label={`${hubTitle}: ${tools.map((tool) => tool.name).join(', ')}`}>
        <svg className="hm-hubmap__svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <defs>
            <filter id="hm-neon" filterUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">
              <feGaussianBlur stdDeviation="1.1" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle className="hm-hubmap__orbit" cx="50" cy="50" r={ORBIT} />
          {tools.map((tool, k) => {
            const delay = { animationDelay: `${(k * 0.43).toFixed(2)}s` }
            return (
              <g key={tool.name} className={active === tool.name ? 'is-on' : undefined}>
                <path className="hm-hubmap__spoke" d={spokes[k].d} pathLength={1} />
                <path className="hm-hubmap__glow" d={spokes[k].d} pathLength={1} filter="url(#hm-neon)" style={delay} />
                <path className="hm-hubmap__beam" d={spokes[k].d} pathLength={1} style={delay} />
              </g>
            )
          })}
        </svg>

        <div className="hm-hubmap__core hm-glass hm-glass--thick">
          <span className="hm-hub__label">{hubLabel}</span>
          <span className="hm-hub__title">{hubTitle}</span>
        </div>

        {tools.map((tool, k) => (
          <span
            key={tool.name}
            className={`hm-hubmap__node${active === tool.name ? ' is-on' : ''}`}
            style={{ left: `${spokes[k].x}%`, top: `${spokes[k].y}%` }}
            onMouseEnter={() => setActive(tool.name)}
            onMouseLeave={() => setActive(null)}
            aria-hidden="true"
          >
            {tool.name}
          </span>
        ))}
      </div>
    </div>
  )
}
