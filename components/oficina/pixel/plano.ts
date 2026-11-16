// El plano visto desde arriba, en pixel art: áreas, caritas de cada Knox con su anillo de estado, nombre y qué hace.
// Abajo, la sala: sus tres rincones con las caritas de quien está ahí; en su área, esa carita queda tenue.
import type { Agente, EstadoAgente, Rincon } from '../../../lib/oficina/tipos'
import type { LugarSala } from '../../../lib/oficina/sala'
import { MEDIDAS, MUNDO_H, MUNDO_W } from '../../../lib/oficina/mundo'
import { sprite } from './knox-sprite'
import { COL } from './vista'

// el plano mide lo mismo que la maqueta: las áreas ocupan lo de las oficinas y la sala es la franja de abajo
const W = MUNDO_W, H = MUNDO_H, COLS = 3, HZ = MEDIDAS.HO + MEDIDAS.M
// colores de fondo de las áreas; se reparten en orden según cuántas áreas haya
const TINTES = ['#1c2430', '#182733', '#221d2e', '#1a2a24', '#2a221c', '#1f1f24']
const ACTIVOS: Partial<Record<EstadoAgente, true>> = { trabajando: true, publicando: true, listo: true, fallo: true }
// los rincones de la sala, en las mismas columnas que las áreas
const RINCONES: { r: Rincon; nom: string; tinte: string }[] = [
  { r: 'cafe', nom: 'La sala · café', tinte: '#2b2119' },
  { r: 'platica', nom: 'La sala · plática', tinte: '#29201b' },
  { r: 'siesta', nom: 'La sala · siesta', tinte: '#1c1f33' },
]

type Zona = { nom: string; x: number; y: number; w: number; h: number; tinte: string }
type Cara = { k: Agente; x: number; y: number }

// abajo: cuánto tapan desde abajo los controles de la página, en px de la página (el plano entero queda encima)
export function crearPlano(
  cv: HTMLCanvasElement,
  agentes: Agente[],
  textoDe: (id: string) => string,
  alTocar: (id: string | null) => void,
  abajo?: () => number,
) {
  const arte = document.createElement('canvas'); arte.width = W; arte.height = H
  const a = arte.getContext('2d') as CanvasRenderingContext2D
  const c = cv.getContext('2d') as CanvasRenderingContext2D
  const zonas: Zona[] = [], caras: Cara[] = []
  const estado: Record<string, EstadoAgente> = {}
  agentes.forEach((k) => { estado[k.id] = k.estado_fijo || 'descansando' })
  let lugares: Record<string, LugarSala> = {}

  // las áreas salen del catálogo, en el orden de sus puestos
  const AREAS: string[] = []
  agentes.slice().sort((p, q) => p.puesto - q.puesto).forEach((k) => { if (AREAS.indexOf(k.area) < 0) AREAS.push(k.area) })
  const filasZ = Math.max(1, Math.ceil(AREAS.length / COLS))
  const aw = (W - 24) / COLS, ah = (HZ - 18) / filasZ
  AREAS.forEach((nom, i) => {
    const x = 6 + (i % COLS) * (aw + 6), y = 6 + Math.floor(i / COLS) * (ah + 6)
    const ks = agentes.filter((k) => k.area === nom).sort((p, q) => p.puesto - q.puesto)
    zonas.push({ nom, x: Math.round(x), y: Math.round(y), w: Math.round(aw), h: Math.round(ah), tinte: TINTES[i % TINTES.length] })
    const por = ks.length > 4 ? 3 : 2, filas = Math.ceil(ks.length / por), dx = aw / por, dy = Math.min(92, (ah - 30) / filas)
    ks.forEach((k, j) => caras.push({ k, x: Math.round(x + dx * (j % por) + dx / 2), y: Math.round(y + 34 + dy * Math.floor(j / por)) }))
  })
  const rincones = RINCONES.map((rc, i) => ({ ...rc, x: Math.round(6 + i * (aw + 6)), y: HZ, w: Math.round(aw), h: H - HZ - 6 }))
  const porId: Record<string, Agente> = {}
  agentes.forEach((k) => { porId[k.id] = k })
  // quien está en cada rincón, por su sitio, en fila y centrados
  function enSala(): (Cara & { r: Rincon })[] {
    const L: (Cara & { r: Rincon })[] = []
    rincones.forEach((rc) => {
      const ids = Object.keys(lugares).filter((id) => porId[id] && lugares[id].rincon === rc.r).sort((p, q) => lugares[p].sitio - lugares[q].sitio)
      const paso = Math.min(70, rc.w / Math.max(1, ids.length))
      ids.forEach((id, j) => L.push({ k: porId[id], r: rc.r, x: Math.round(rc.x + rc.w / 2 + (j - (ids.length - 1) / 2) * paso), y: rc.y + 50 }))
    })
    return L
  }

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
  // una carita con su anillo; tenue: la de quien está en la sala, en su área
  function carita(f: Cara, t: number, dormido: boolean, tenue: boolean) {
    const e = estado[f.k.id], on = !!ACTIVOS[e], col = COL[e]
    const quieto = e === 'pedido' || e === 'pendiente'
    a.save(); if (tenue) a.globalAlpha = 0.3
    if (on && !tenue) { a.globalAlpha = Math.floor(t * 1.6) % 2 ? 0.28 : 0.16; anillo(f.x, f.y, 20, col, 4); a.globalAlpha = 1 }
    R(f.x - 15, f.y - 15, 30, 30, '#0d0f12')
    a.save(); a.beginPath(); a.rect(f.x - 15, f.y - 15, 30, 30); a.clip()
    if (!tenue) a.globalAlpha = on ? 1 : (quieto ? 0.45 : 0.75)
    a.drawImage(sprite(f.k.aspecto, { dormido }), 0, 0, 28, 26, f.x - 14, f.y - 14, 28, 26)
    a.restore()
    anillo(f.x, f.y, 16, quieto || tenue ? '#4a4f57' : col, 2)
    R(f.x - 14, f.y + 21, 28, 4, '#262b33')
    a.restore()
  }
  function dibujar(t: number) {
    R(0, 0, W, H, '#101317')
    zonas.forEach((z) => marco(z.x, z.y, z.w, z.h, z.tinte, '#2c333d'))
    rincones.forEach((z) => marco(z.x, z.y, z.w, z.h, z.tinte, '#3a3128'))
    caras.forEach((f) => {
      const e = estado[f.k.id]
      carita(f, t, e === 'descansando' || e === 'durmiendo', !!lugares[f.k.id])
    })
    const sala = enSala()
    sala.forEach((f) => carita(f, t, f.r === 'siesta', false))
    c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.clearRect(0, 0, cv.width, cv.height)
    const alto = Math.max(1, cv.height - margenAbajo)
    const s = Math.min(cv.width / W, alto / H), ox = (cv.width - W * s) / 2, oy = (alto - H * s) / 2
    c.drawImage(arte, 0, 0, W, H, ox, oy, W * s, H * s)
    c.textBaseline = 'middle'
    zonas.forEach((z) => { c.textAlign = 'left'; c.fillStyle = '#8b95a5'; c.font = Math.round(8 * s) + 'px Silkscreen, monospace'; c.fillText(z.nom.toUpperCase(), ox + (z.x + 10) * s, oy + (z.y + 14) * s) })
    rincones.forEach((z) => {
      c.textAlign = 'left'; c.fillStyle = '#b59a7a'; c.font = Math.round(8 * s) + 'px Silkscreen, monospace'; c.fillText(z.nom.toUpperCase(), ox + (z.x + 10) * s, oy + (z.y + 14) * s)
      if (!sala.some((f) => f.r === z.r)) {
        c.textAlign = 'center'; c.fillStyle = '#5b616b'; c.font = Math.round(6.5 * s) + 'px Silkscreen, monospace'; c.fillText('Nadie por ahora', ox + (z.x + z.w / 2) * s, oy + (z.y + 56) * s)
      }
    })
    caras.forEach((f) => {
      const k = f.k, e = estado[k.id], on = !!ACTIVOS[e] && !lugares[k.id]
      c.textAlign = 'center'; c.fillStyle = on ? '#f3f4f6' : '#a1a1aa'; c.font = Math.round(7.5 * s) + 'px Silkscreen, monospace'
      c.fillText(k.nombre, ox + f.x * s, oy + (f.y + 33) * s)
      c.fillStyle = on ? COL[e] : '#71717a'; c.font = Math.round(6 * s) + 'px Silkscreen, monospace'
      c.fillText(textoDe(k.id), ox + f.x * s, oy + (f.y + 43) * s)
    })
    sala.forEach((f) => {
      c.textAlign = 'center'; c.fillStyle = '#f3f4f6'; c.font = Math.round(7.5 * s) + 'px Silkscreen, monospace'
      c.fillText(f.k.nombre, ox + f.x * s, oy + (f.y + 33) * s)
    })
    return { s, ox, oy, sala }
  }
  let geo: { s: number; ox: number; oy: number; sala: Cara[] } = { s: 1, ox: 0, oy: 0, sala: [] }
  let margenAbajo = 0 // lo que tapan los controles de abajo, en pixeles del lienzo
  function medir() {
    const p = cv.parentElement as HTMLElement, d = window.devicePixelRatio || 1
    cv.width = Math.max(1, Math.round(p.clientWidth * d)); cv.height = Math.max(1, Math.round(p.clientHeight * d))
    cv.style.width = p.clientWidth + 'px'; cv.style.height = p.clientHeight + 'px'
    margenAbajo = Math.min(cv.height / 2, Math.max(0, Math.round((abajo?.() ?? 0) * d)))
    geo = dibujar(performance.now() / 1000)
  }
  function alCambiar() { medir() }
  medir(); window.addEventListener('resize', alCambiar)
  const reloj = setInterval(() => { if (cv.offsetParent && !document.hidden) geo = dibujar(performance.now() / 1000) }, 300)
  // tocar una carita (en su área o en la sala) abre su ficha
  function alClic(e: MouseEvent) {
    const r = cv.getBoundingClientRect()
    const x = ((e.clientX - r.left) * (cv.width / r.width) - geo.ox) / geo.s, y = ((e.clientY - r.top) * (cv.height / r.height) - geo.oy) / geo.s
    let toco: string | null = null
    caras.concat(geo.sala).forEach((f) => { if (Math.abs(x - f.x) < 34 && y > f.y - 22 && y < f.y + 48) toco = f.k.id })
    alTocar(toco)
  }
  cv.addEventListener('click', alClic)
  return {
    medir,
    estados(m: Record<string, EstadoAgente>) { Object.keys(m).forEach((id) => { if (id in estado) estado[id] = m[id] }); geo = dibujar(performance.now() / 1000) },
    sala(asig: Record<string, LugarSala>) { lugares = asig; geo = dibujar(performance.now() / 1000) },
    destruir() { clearInterval(reloj); window.removeEventListener('resize', alCambiar); cv.removeEventListener('click', alClic) },
  }
}
