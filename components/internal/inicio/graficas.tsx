// Las gráficas chiquitas del panel, en SVG y sin librerías: la línea de cada tarjeta, el medidor del puntaje,
// la barrita y la etiqueta de etapa. Funcionan en el servidor; al pasar el mouse dicen el valor (title).
import type { Tono } from '@/lib/panel/inicio/calculos'

// Una línea por día; el último punto (hoy) en naranja
export function Linea({ serie, etiqueta, className = '' }: { serie: number[]; etiqueta: (i: number, valor: number) => string; className?: string }) {
  const W = 120
  const H = 36
  const max = Math.max(1, ...serie)
  const paso = serie.length > 1 ? W / (serie.length - 1) : W
  const y = (v: number) => H - 3 - (v / max) * (H - 8)
  const puntos = serie.map((v, i) => `${(i * paso).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const ultimo = serie.length - 1
  return (
    <svg viewBox={`-2 0 ${W + 4} ${H}`} className={`h-9 w-[120px] overflow-visible ${className}`} role="img" aria-label={`Por día: ${serie.join(', ')}`}>
      <polyline points={puntos} fill="none" stroke="rgb(var(--pn-fg) / .7)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={ultimo * paso} cy={y(serie[ultimo] ?? 0)} r="2.75" fill="var(--pn-accent)" stroke="var(--pn-card)" strokeWidth="1.5" />
      {/* Zonas para el mouse, más anchas que la línea */}
      {serie.map((v, i) => (
        <rect key={i} x={i * paso - paso / 2} y={0} width={paso} height={H} fill="transparent">
          <title>{etiqueta(i, v)}</title>
        </rect>
      ))}
    </svg>
  )
}

// El medidor del puntaje (0 a 100): un arco de 240°, el lleno en naranja
export function Medidor({ valor }: { valor: number | null }) {
  const R = 64
  const C = 80
  const ANGULO = 240
  const desde = 90 + (360 - ANGULO) / 2 // abajo a la izquierda, en grados (0 = derecha, sentido del reloj)
  const punto = (grados: number) => {
    const r = (grados * Math.PI) / 180
    return [C + R * Math.cos(r), C + R * Math.sin(r)]
  }
  const arco = (fraccion: number) => {
    const fin = desde + ANGULO * fraccion
    const [x1, y1] = punto(desde)
    const [x2, y2] = punto(fin)
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${ANGULO * fraccion > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
  }
  const f = Math.max(0, Math.min(1, (valor ?? 0) / 100))
  return (
    <div className="relative mx-auto w-[172px]">
      <svg viewBox="0 0 160 124" className="w-full" role="img" aria-label={valor === null ? 'Sin datos todavía' : `${valor} de 100`}>
        <defs>
          <linearGradient id="pn-medidor" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--pn-accent)" stopOpacity=".45" />
            <stop offset="1" stopColor="var(--pn-accent)" />
          </linearGradient>
        </defs>
        <path d={arco(1)} fill="none" stroke="rgb(var(--pn-fg) / .1)" strokeWidth="12" strokeLinecap="round" />
        {f > 0 && <path d={arco(Math.max(f, 0.02))} fill="none" stroke="url(#pn-medidor)" strokeWidth="12" strokeLinecap="round" />}
      </svg>
      <div className="absolute inset-x-0 top-[40%] text-center">
        <p className="text-[34px] font-normal leading-none tracking-tight text-fg tabular-nums">{valor ?? '—'}</p>
        <p className="mt-1.5 text-[12px] text-fg/45">de 100</p>
      </div>
    </div>
  )
}

export function Barrita({ valor, acento = false, className = '' }: { valor: number; acento?: boolean; className?: string }) {
  return (
    <span className={`pn-meter ${acento ? 'pn-meter--accent' : ''} block ${className}`} aria-hidden>
      <span style={{ width: `${Math.max(0, Math.min(100, valor))}%` }} />
    </span>
  )
}

export function Pildora({ tono, children }: { tono: Tono; children: React.ReactNode }) {
  return (
    <span className="pn-pill">
      <i className={tono} aria-hidden />
      {children}
    </span>
  )
}
