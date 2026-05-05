'use client'

import { motion } from 'framer-motion'
import { SplineScene } from '@/components/ui/spline-scene'

// ─── Layout constants ─────────────────────────────────────────────────────────
const CIRCLE_R = 200     // radius of the circular clip frame (px)
const NODE_R   = 360     // distance from center to each node dot (px)
const CANVAS   = (NODE_R + 120) * 2  // 800 — total layout canvas

// ─── Spline crop — adjust these to reposition the head ───────────────────────
const SCENE_W    = 800   // Spline canvas width  (larger = more context, less zoom)
const SCENE_H    = 1000  // Spline canvas height
const TOP_OFFSET = -100  // negative = move scene UP (show higher on the robot)
const LEFT_SHIFT =  20   // positive = shift scene right (move head slightly right in clip)

interface NodeDef {
  angle: number  // 0 = top, clockwise
  label: string
  sub: string
}

const NODES: NodeDef[] = [
  { angle:  30, label: 'WhatsApp Bot',  sub: '247 mensajes/día' },
  { angle:  90, label: 'CRM Propio',    sub: 'Leads en tiempo real' },
  { angle: 150, label: 'Reservas 24/7', sub: 'Sin intervención' },
  { angle: 210, label: 'Seguimientos',  sub: 'Automatizados' },
  { angle: 270, label: 'Cotizaciones',  sub: 'En segundos' },
  { angle: 330, label: 'Reportes',      sub: 'En tiempo real' },
]

function toXY(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  // Round to whole pixels so SSR and client produce identical values (no hydration mismatch)
  return { x: Math.round(Math.cos(rad) * r), y: Math.round(Math.sin(rad) * r) }
}

export function RobotOrb() {
  const center = CANVAS / 2
  const DIAM   = CIRCLE_R * 2

  const sceneLeft = LEFT_SHIFT - Math.round((SCENE_W - DIAM) / 2)

  return (
    <div
      className="relative select-none mx-auto"
      style={{ width: CANVAS, height: CANVAS }}
    >
      {/* ── SVG: rings + dashed connection lines ───────────────────── */}
      <svg
        width={CANVAS}
        height={CANVAS}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Soft glow halo */}
        <circle
          cx={center} cy={center} r={CIRCLE_R + 24}
          fill="none"
          stroke="rgba(255,255,255,0.025)"
          strokeWidth="48"
        />
        {/* Crisp border ring */}
        <circle
          cx={center} cy={center} r={CIRCLE_R}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />

        {/* Dashed lines: circle edge → node dot */}
        {NODES.map(({ angle }, i) => {
          const edge = toXY(angle, CIRCLE_R + 1)
          const node = toXY(angle, NODE_R)
          return (
            <line
              key={i}
              x1={center + edge.x} y1={center + edge.y}
              x2={center + node.x} y2={center + node.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          )
        })}
      </svg>

      {/* ── Circular clip: Spline scene cropped to show just the head ── */}
      <div
        className="absolute z-10"
        style={{
          width:        DIAM,
          height:       DIAM,
          left:         center - CIRCLE_R,
          top:          center - CIRCLE_R,
          borderRadius: '50%',
          overflow:     'hidden',
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.05), transparent 70%)',
          boxShadow:
            '0 0 60px rgba(255,255,255,0.06), inset 0 0 30px rgba(0,0,0,0.6)',
        }}
      >
        {/*
          Rendered at SCENE_W × SCENE_H; left/top control which region is visible.
          TOP_OFFSET: more negative → shows higher up the scene (head).
          LEFT_SHIFT: positive → shifts head slightly right inside the clip.
        */}
        <div
          style={{
            position: 'absolute',
            width:    SCENE_W,
            height:   SCENE_H,
            left:     sceneLeft,
            top:      TOP_OFFSET,
          }}
        >
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* ── Nodes: dot exactly at coordinate, label offset to the side ── */}
      {NODES.map(({ angle, label, sub }, i) => {
        const { x, y } = toXY(angle, NODE_R)
        const isRight  = x >= 0

        return (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 + i * 0.08 }}>

            {/* Dot at exact node coordinate */}
            <div
              className="absolute z-20"
              style={{ left: center + x, top: center + y, transform: 'translate(-50%, -50%)' }}
            >
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-white/30 border border-white/[0.20]" />
                <div
                  className="absolute inset-0 rounded-full animate-ping bg-white/10"
                  style={{ animationDuration: `${2.2 + i * 0.25}s` }}
                />
              </div>
            </div>

            {/* Label offset 14px from the dot toward its side */}
            <div
              className="absolute z-20"
              style={{
                left:      isRight ? center + x + 14 : center + x - 14,
                top:       center + y,
                transform: isRight ? 'translateY(-50%)' : 'translate(-100%, -50%)',
                textAlign: isRight ? 'left' : 'right',
              }}
            >
              <p className="text-[11px] font-semibold text-white/60 whitespace-nowrap leading-tight">
                {label}
              </p>
              <p className="text-[9px] text-white/25 whitespace-nowrap">{sub}</p>
            </div>

          </motion.div>
        )
      })}
    </div>
  )
}
