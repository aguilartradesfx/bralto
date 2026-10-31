// Los dibujos fijos del Centro de mando (los anillos, el fondo, el radar): los mismos del diseño aprobado
// (Bralto-redes/knox-centro/diseno/index.html), en el lienzo de 1920×1080. Lo que se mueve con la voz está en hud.tsx.

export const NARANJA = '#ff6d28'

export const f = (n: number) => n.toFixed(2)

// Grados: 0 arriba, en el sentido del reloj
export function P(cx: number, cy: number, r: number, grados: number): [number, number] {
  const a = ((grados - 90) * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

export function arco(cx: number, cy: number, r: number, desde: number, hasta: number): string {
  const [x1, y1] = P(cx, cy, r, desde)
  const [x2, y2] = P(cx, cy, r, hasta)
  return `M${f(x1)} ${f(y1)}A${r} ${r} 0 ${hasta - desde > 180 ? 1 : 0} 1 ${f(x2)} ${f(y2)}`
}

// Números al azar, pero siempre los mismos (el polvo y la onda quieta se ven igual cada vez)
export function azar(semilla: number): () => number {
  let s = semilla
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// El centro de los anillos en el lienzo
export const CX = 960
export const CY = 398

// Fondo: anillos, rayos, el destello y los flujos de datos de cada panel al núcleo
export function svgFondo(): string {
  let s = `<defs>
    <linearGradient id="kc-streak" x1="0" x2="1"><stop offset="0" stop-color="${NARANJA}" stop-opacity="0"/><stop offset=".5" stop-color="${NARANJA}" stop-opacity=".5"/><stop offset="1" stop-color="${NARANJA}" stop-opacity="0"/></linearGradient>
    <filter id="kc-bl6" x="-10%" y="-400%" width="120%" height="900%"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>`
  for (let d = 0; d < 360; d += 15) {
    const [a, b] = P(CX, CY, 330, d)
    const [c, e] = P(CX, CY, 1150, d)
    s += `<line x1="${f(a)}" y1="${f(b)}" x2="${f(c)}" y2="${f(e)}" stroke="#fff" stroke-opacity=".022"/>`
  }
  s += `<circle cx="${CX}" cy="${CY}" r="330" fill="none" stroke="#fff" stroke-opacity=".07"/>`
  s += `<circle cx="${CX}" cy="${CY}" r="392" fill="none" stroke="#fff" stroke-opacity=".1" stroke-dasharray="2 7"/>`
  s += `<circle cx="${CX}" cy="${CY}" r="470" fill="none" stroke="#fff" stroke-opacity=".055"/>`
  for (let d = 0; d < 360; d += 3) {
    const L = d % 15 === 0 ? 12 : 5
    const [a, b] = P(CX, CY, 470, d)
    const [c, e] = P(CX, CY, 470 + L, d)
    s += `<line x1="${f(a)}" y1="${f(b)}" x2="${f(c)}" y2="${f(e)}" stroke="#fff" stroke-opacity="${d % 15 === 0 ? 0.14 : 0.07}"/>`
  }
  s += `<path d="${arco(CX, CY, 470, 300, 348)}" fill="none" stroke="${NARANJA}" stroke-opacity=".55" stroke-width="2"/>`
  s += `<circle cx="${CX}" cy="${CY}" r="600" fill="none" stroke="#fff" stroke-opacity=".045"/>`
  s += `<circle cx="${CX}" cy="${CY}" r="760" fill="none" stroke="#fff" stroke-opacity=".04" stroke-dasharray="60 14"/>`
  s += `<circle cx="${CX}" cy="${CY}" r="980" fill="none" stroke="#fff" stroke-opacity=".03"/>`
  // Destello anamórfico
  s += `<rect x="0" y="${CY - 1}" width="1920" height="2" fill="url(#kc-streak)" opacity=".7"/>`
  s += `<rect x="200" y="${CY - 6}" width="1520" height="12" fill="url(#kc-streak)" opacity=".35" filter="url(#kc-bl6)"/>`
  return s
}

// Los flujos: de cada panel hacia el núcleo (los puntos naranjas corren hacia Knox)
export const ORIGENES_FLUJO: [number, number][] = [
  [480, 248],
  [480, 540],
  [480, 779],
  [1440, 253],
  [1440, 520],
  [1440, 754],
]

export function svgFlujos(): string {
  let s = ''
  ORIGENES_FLUJO.forEach(([x, y], i) => {
    const dx = x - CX
    const dy = y - CY
    const m = Math.hypot(dx, dy)
    const tx = CX + (dx / m) * 292
    const ty = CY + (dy / m) * 292
    const k = x < CX ? 1 : -1
    const d = `M${x} ${y}C${x + k * 140} ${y} ${f(tx + (dx / m) * 120)} ${f(ty + (dy / m) * 120)} ${f(tx)} ${f(ty)}`
    s += `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".16"/>`
    s += `<path class="kc-flujo" style="--kc-paso:${19.5 + i * 3}px" d="${d}" fill="none" stroke="${NARANJA}" stroke-opacity=".9" stroke-width="2" stroke-linecap="round" stroke-dasharray="1.5 ${18 + i * 3}" stroke-dashoffset="${i * 7}"/>`
    s += `<circle cx="${f(tx)}" cy="${f(ty)}" r="2.5" fill="#fff" fill-opacity=".8"/><circle cx="${f(tx)}" cy="${f(ty)}" r="6" fill="none" stroke="#fff" stroke-opacity=".25"/>`
  })
  return s
}

// Núcleo (580×580): lo de abajo de la onda
export const C = 290

export function svgNucleoAbajo(): string {
  let s = `<defs>
    <radialGradient id="kc-orbFill" cx=".42" cy=".3" r=".78"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".45" stop-color="#1c1c1c" stop-opacity=".62"/><stop offset="1" stop-color="#050505" stop-opacity=".9"/></radialGradient>
    <linearGradient id="kc-orbRim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".38" stop-color="#fff" stop-opacity=".08"/><stop offset=".72" stop-color="#fff" stop-opacity=".03"/><stop offset="1" stop-color="#fff" stop-opacity=".22"/></linearGradient>
    <radialGradient id="kc-orbFloor" cx=".5" cy=".86" r=".55"><stop offset="0" stop-color="${NARANJA}" stop-opacity=".38"/><stop offset=".55" stop-color="${NARANJA}" stop-opacity=".08"/><stop offset="1" stop-color="${NARANJA}" stop-opacity="0"/></radialGradient>
    <linearGradient id="kc-beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff9a6a" stop-opacity=".26"/><stop offset=".6" stop-color="#ff9a6a" stop-opacity=".05"/><stop offset="1" stop-color="#ff9a6a" stop-opacity="0"/></linearGradient>
    <radialGradient id="kc-plat"><stop offset="0" stop-color="#ffb08a" stop-opacity=".9"/><stop offset=".45" stop-color="${NARANJA}" stop-opacity=".35"/><stop offset="1" stop-color="${NARANJA}" stop-opacity="0"/></radialGradient>
    <filter id="kc-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="kc-soft"><feGaussianBlur stdDeviation="9"/></filter>
    <clipPath id="kc-orbClip"><circle cx="${C}" cy="${C}" r="164"/></clipPath>
  </defs>`
  // Etiquetas del aro de afuera
  for (let d = 30; d < 360; d += 30) {
    const [x, y] = P(C, C, 281, d)
    s += `<text class="kc-svgmono" x="${f(x)}" y="${f(y)}" fill="#fff" fill-opacity=".32" font-size="8.5" letter-spacing="1" text-anchor="middle" dominant-baseline="central">${String(d).padStart(3, '0')}</text>`
  }
  s += `<circle cx="${C}" cy="${C}" r="268" fill="none" stroke="#fff" stroke-opacity=".16"/>`
  for (let d = 0; d < 360; d += 2) {
    const mayor = d % 10 === 0
    const cardinal = d % 90 === 0
    const [a, b] = P(C, C, 268, d)
    const [c, e] = P(C, C, cardinal ? 250 : mayor ? 257 : 263, d)
    s += `<line x1="${f(a)}" y1="${f(b)}" x2="${f(c)}" y2="${f(e)}" stroke="#fff" stroke-opacity="${cardinal ? 0.6 : mayor ? 0.32 : 0.13}"/>`
  }
  // El norte
  const [nx, ny] = P(C, C, 274, 0)
  s += `<path d="M${nx - 5} ${ny - 7}L${nx + 5} ${ny - 7}L${nx} ${ny}Z" fill="${NARANJA}" filter="url(#kc-glow)"/>`
  return s
}

// El aro de segmentos (gira solo mientras Knox habla o revisa)
export function svgSegmentos(): string {
  let s = ''
  for (let k = 0; k < 36; k++) {
    const claro = [1, 2, 13, 27, 28, 29].includes(k)
    const naranja = k === 21
    s += `<path d="${arco(C, C, 246, k * 10 + 1.5, k * 10 + 8.5)}" fill="none" stroke="${naranja ? NARANJA : '#fff'}" stroke-opacity="${naranja ? 0.9 : claro ? 0.5 : 0.13}" stroke-width="3"/>`
  }
  return s
}

export function svgAnillosVoz(): string {
  return (
    `<circle cx="${C}" cy="${C}" r="236" fill="none" stroke="#fff" stroke-opacity=".08" stroke-dasharray="1 3"/>` +
    `<circle cx="${C}" cy="${C}" r="226" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="2"/>`
  )
}

// La onda: 91 rayas por lado (en espejo), de 3 a 45 px de largo
export const BARRAS: { j: number; grados: number }[] = (() => {
  const lista: { j: number; grados: number }[] = []
  for (let j = 0; j <= 90; j++) for (const g of j === 0 || j === 90 ? [j * 2] : [j * 2, 360 - j * 2]) lista.push({ j, grados: g })
  return lista
})()

// La forma: cortas arriba y abajo, largas a los lados
export const envolvente = (j: number) => Math.pow(Math.sin((Math.PI * j) / 90), 0.7)

// Una onda quieta y bonita (la del diseño), para cuando no hay audio que medir
export function ondaQuieta(semilla = 7): number[] {
  const R = azar(semilla)
  const porJ: number[] = []
  for (let j = 0; j <= 90; j++) {
    const v = Math.abs(Math.sin(j * 0.27) * 0.55 + Math.sin(j * 0.61 + 0.8) * 0.3 + Math.sin(j * 0.09 + 2) * 0.35)
    porJ.push(Math.min(1, v) * (0.72 + 0.28 * R()))
  }
  return porJ
}

// Lo de arriba de la onda: el orbe de vidrio, el haz y la plataforma
export function svgNucleoArriba(): string {
  let s = `<circle cx="${C}" cy="${C}" r="164" fill="url(#kc-orbFill)"/>`
  s += `<circle cx="${C}" cy="${C}" r="164" fill="url(#kc-orbFloor)"/>`
  s += `<g clip-path="url(#kc-orbClip)">`
  for (let y = C - 164; y < C + 164; y += 14) s += `<line x1="${C - 170}" y1="${y}" x2="${C + 170}" y2="${y}" stroke="#fff" stroke-opacity=".025"/>`
  for (let x = C - 164; x < C + 164; x += 14) s += `<line x1="${x}" y1="${C - 170}" x2="${x}" y2="${C + 170}" stroke="#fff" stroke-opacity=".025"/>`
  s += `<ellipse cx="236" cy="176" rx="78" ry="34" transform="rotate(-32 236 176)" fill="#fff" fill-opacity=".07" filter="url(#kc-soft)"/>`
  s += `</g>`
  s += `<circle cx="${C}" cy="${C}" r="164" fill="none" stroke="url(#kc-orbRim)" stroke-width="1.3"/>`
  s += `<circle cx="${C}" cy="${C}" r="152" fill="none" stroke="#fff" stroke-opacity=".08" stroke-dasharray="2 4"/>`
  s += `<path d="M232 394L348 394L392 130L188 130Z" fill="url(#kc-beam)"/>`
  s += `<ellipse cx="${C}" cy="394" rx="118" ry="19" fill="none" stroke="#fff" stroke-opacity=".16" stroke-dasharray="3 4"/>`
  s += `<ellipse cx="${C}" cy="394" rx="86" ry="13.5" fill="none" stroke="${NARANJA}" stroke-opacity=".7" filter="url(#kc-glow)"/>`
  s += `<ellipse cx="${C}" cy="394" rx="64" ry="10" fill="url(#kc-plat)"/>`
  for (let d = 0; d < 360; d += 20) {
    const a = (d * Math.PI) / 180
    s += `<line x1="${f(C + Math.cos(a) * 102)}" y1="${f(394 + Math.sin(a) * 16.5)}" x2="${f(C + Math.cos(a) * 110)}" y2="${f(394 + Math.sin(a) * 17.8)}" stroke="#fff" stroke-opacity=".3"/>`
  }
  s += `<text class="kc-svgmono" x="${C}" y="430" fill="#fff" fill-opacity=".55" font-size="9" letter-spacing="6" text-anchor="middle">KNOX</text>`
  return s
}

// Las líneas de las cuatro anotaciones del centro (872×758)
export function svgLideres(): string {
  const cx = 436
  const cy = 290
  const r = 268
  let s = ''
  for (const [y, k] of [
    [80, -1],
    [500, -1],
    [80, 1],
    [500, 1],
  ] as const) {
    const dx = Math.sqrt(r * r - (y - cy) ** 2)
    const xr = cx + k * dx
    const x0 = k < 0 ? 140 : 732
    s += `<line x1="${x0}" y1="${y}" x2="${f(xr)}" y2="${y}" stroke="#fff" stroke-opacity=".22"/>`
    s += `<circle cx="${x0}" cy="${y}" r="1.8" fill="#fff" fill-opacity=".5"/>`
    s += `<circle cx="${f(xr)}" cy="${y}" r="3" fill="#fff"/><circle cx="${f(xr)}" cy="${y}" r="7" fill="none" stroke="#fff" stroke-opacity=".3"/>`
  }
  return s
}

// El radar (196×196): anillos y marcas; los puntos de cada persona los pone el panel
export function svgRadar(): string {
  const c = 98
  let s = `<defs><filter id="kc-rg" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3"/></filter></defs>`
  ;[96, 72, 48, 24].forEach((r, i) => (s += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#fff" stroke-opacity="${i ? 0.08 : 0.18}"/>`))
  s += `<line x1="${c - 96}" y1="${c}" x2="${c + 96}" y2="${c}" stroke="#fff" stroke-opacity=".07"/><line x1="${c}" y1="${c - 96}" x2="${c}" y2="${c + 96}" stroke="#fff" stroke-opacity=".07"/>`
  for (let d = 0; d < 360; d += 6) {
    const L = d % 30 === 0 ? 7 : 3
    const [a, b] = P(c, c, 96, d)
    const [x, y] = P(c, c, 96 - L, d)
    s += `<line x1="${f(a)}" y1="${f(b)}" x2="${f(x)}" y2="${f(y)}" stroke="#fff" stroke-opacity="${d % 30 === 0 ? 0.35 : 0.15}"/>`
  }
  s += `<circle cx="${c}" cy="${c}" r="2.5" fill="#fff"/>`
  return s
}

// Una curva suave que pasa por todos los puntos (Catmull-Rom)
export function curvaSuave(puntos: [number, number][]): string {
  if (puntos.length === 0) return ''
  let d = `M${f(puntos[0][0])} ${f(puntos[0][1])}`
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[i - 1] ?? puntos[i]
    const p1 = puntos[i]
    const p2 = puntos[i + 1]
    const p3 = puntos[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`
  }
  return d
}
