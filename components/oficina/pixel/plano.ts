// El plano visto desde arriba, en pixel art: áreas, caritas de cada Knox con su anillo de estado, nombre y qué hace.
import type { Agente, EstadoAgente } from '../../../lib/oficina/tipos'
import { sprite } from './knox-sprite'
import { COL } from './vista'

const W = 906, H = 476, COLS = 3
// colores de fondo de las áreas; se reparten en orden según cuántas áreas haya
const TINTES = ['#1c2430', '#182733', '#221d2e', '#1a2a24', '#2a221c', '#1f1f24']
const ACTIVOS: Partial<Record<EstadoAgente, true>> = { trabajando: true, publicando: true, listo: true, fallo: true }

type Zona = { nom: string; x: number; y: number; w: number; h: number; tinte: string }
type Cara = { k: Agente; x: number; y: number }

export function crearPlano(
  cv: HTMLCanvasElement,
  agentes: Agente[],
  textoDe: (id: string) => string,
  alTocar: (id: string | null) => void,
) {
  const arte = document.createElement('canvas'); arte.width = W; arte.height = H
  const a = arte.getContext('2d') as CanvasRenderingContext2D
  const c = cv.getContext('2d') as CanvasRenderingContext2D
  const zonas: Zona[] = [], caras: Cara[] = []
  const estado: Record<string, EstadoAgente> = {}
  agentes.forEach((k) => { estado[k.id] = k.estado_fijo || 'descansando' })

  // las áreas salen del catálogo, en el orden de sus puestos
  const AREAS: string[] = []
  agentes.slice().sort((p, q) => p.puesto - q.puesto).forEach((k) => { if (AREAS.indexOf(k.area) < 0) AREAS.push(k.area) })
  const filasZ = Math.max(1, Math.ceil(AREAS.length / COLS))
  const aw = (W - 24) / COLS, ah = (H - 18) / filasZ
  AREAS.forEach((nom, i) => {
    const x = 6 + (i % COLS) * (aw + 6), y = 6 + Math.floor(i / COLS) * (ah + 6)
    const ks = agentes.filter((k) => k.area === nom).sort((p, q) => p.puesto - q.puesto)
    zonas.push({ nom, x: Math.round(x), y: Math.round(y), w: Math.round(aw), h: Math.round(ah), tinte: TINTES[i % TINTES.length] })
    const por = ks.length > 4 ? 3 : 2, filas = Math.ceil(ks.length / por), dx = aw / por, dy = Math.min(92, (ah - 30) / filas)
    ks.forEach((k, j) => caras.push({ k, x: Math.round(x + dx * (j % por) + dx / 2), y: Math.round(y + 34 + dy * Math.floor(j / por)) }))
  })

  function R(x: number, y: number, w: number, h: number, col: string) { a.fillStyle = col; a.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)) }
  function marco(x: number, y: number, w: number, h: number, fondo: string, borde: string) {
    R(x + 2, y, w - 4, h, borde); R(x, y + 2, w, h - 4, borde); R(x + 2, y + 1, w - 4, h - 2, fondo); R(x + 1, y + 2, w - 2, h - 4, fondo)
  }
  function anillo(cx: number, cy: number, r: number, col: string, grosor: number) {
    for (let yy = -r - 1; yy <= r + 1; yy++)
      for (let xx = -r - 1; xx <= r + 1; xx++) {
        const d = Math.sqrt((xx + 0.5) * (xx + 0.5) + (yy + 0.5) * (yy + 0.5))
        if (d <= r + 0.5 && d >= r + 0.5 - grosor) R(cx + xx, cy + yy, 1, 1, col)
      }
  }
  function dibujar(t: number) {
    R(0, 0, W, H, '#101317')
    zonas.forEach((z) => marco(z.x, z.y, z.w, z.h, z.tinte, '#2c333d'))
    caras.forEach((f) => {
      const k = f.k, e = estado[k.id], on = !!ACTIVOS[e], col = COL[e]
      const quieto = e === 'pedido' || e === 'pendiente'
      const pulso = on && Math.floor(t * 1.6) % 2
      if (on) { a.globalAlpha = pulso ? 0.28 : 0.16; anillo(f.x, f.y, 20, col, 4); a.globalAlpha = 1 }
      R(f.x - 15, f.y - 15, 30, 30, '#0d0f12')
      a.save(); a.beginPath(); a.rect(f.x - 15, f.y - 15, 30, 30); a.clip()
      a.globalAlpha = on ? 1 : (quieto ? 0.45 : 0.75)
      a.drawImage(sprite(k.aspecto, { dormido: e === 'descansando' || e === 'durmiendo' }), 0, 0, 28, 26, f.x - 14, f.y - 14, 28, 26)
      a.restore(); a.globalAlpha = 1
      anillo(f.x, f.y, 16, quieto ? '#4a4f57' : col, 2)
      R(f.x - 14, f.y + 21, 28, 4, '#262b33')
    })
    c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.clearRect(0, 0, cv.width, cv.height)
    const s = Math.min(cv.width / W, cv.height / H), ox = (cv.width - W * s) / 2, oy = (cv.height - H * s) / 2
    c.drawImage(arte, 0, 0, W, H, ox, oy, W * s, H * s)
    c.textBaseline = 'middle'
    zonas.forEach((z) => { c.textAlign = 'left'; c.fillStyle = '#8b95a5'; c.font = Math.round(8 * s) + 'px Silkscreen, monospace'; c.fillText(z.nom.toUpperCase(), ox + (z.x + 10) * s, oy + (z.y + 14) * s) })
    caras.forEach((f) => {
      const k = f.k, e = estado[k.id], on = !!ACTIVOS[e]
      c.textAlign = 'center'; c.fillStyle = on ? '#f3f4f6' : '#a1a1aa'; c.font = Math.round(7.5 * s) + 'px Silkscreen, monospace'
      c.fillText(k.nombre, ox + f.x * s, oy + (f.y + 33) * s)
      c.fillStyle = on ? COL[e] : '#71717a'; c.font = Math.round(6 * s) + 'px Silkscreen, monospace'
      c.fillText(textoDe(k.id), ox + f.x * s, oy + (f.y + 43) * s)
    })
    return { s, ox, oy }
  }
  let geo = { s: 1, ox: 0, oy: 0 }
  function medir() {
    const p = cv.parentElement as HTMLElement, d = window.devicePixelRatio || 1
    cv.width = Math.max(1, Math.round(p.clientWidth * d)); cv.height = Math.max(1, Math.round(p.clientHeight * d))
    cv.style.width = p.clientWidth + 'px'; cv.style.height = p.clientHeight + 'px'; geo = dibujar(performance.now() / 1000)
  }
  function alCambiar() { medir() }
  medir(); window.addEventListener('resize', alCambiar)
  const reloj = setInterval(() => { if (cv.offsetParent && !document.hidden) geo = dibujar(performance.now() / 1000) }, 300)
  function alClic(e: MouseEvent) {
    const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1
    const x = ((e.clientX - r.left) * d - geo.ox) / geo.s, y = ((e.clientY - r.top) * d - geo.oy) / geo.s
    let toco: string | null = null
    caras.forEach((f) => { if (Math.abs(x - f.x) < 34 && y > f.y - 22 && y < f.y + 48) toco = f.k.id })
    alTocar(toco)
  }
  cv.addEventListener('click', alClic)
  return {
    medir,
    estados(m: Record<string, EstadoAgente>) { Object.keys(m).forEach((id) => { if (id in estado) estado[id] = m[id] }); geo = dibujar(performance.now() / 1000) },
    destruir() { clearInterval(reloj); window.removeEventListener('resize', alCambiar); cv.removeEventListener('click', alClic) },
  }
}
