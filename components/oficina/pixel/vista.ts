// Mueve a los Knox por rutas reales, los dibuja en orden y deja ver la oficina como un mapa.
// Solo anima lo que le piden (visita, decir, estados, dormir): no corre ningún guion por su cuenta.
import type { Agente, EstadoAgente } from '../../../lib/oficina/tipos'
import type { Mundo, Punto, Sala } from '../../../lib/oficina/mundo'
import { dibujarFondo, listaMuebles, type Ctx } from './arte'
import { sprite } from './knox-sprite'

export type AgenteVista = Agente

export const COL: Record<EstadoAgente, string> = {
  trabajando: '#22c55e', publicando: '#38bdf8', listo: '#ff7a2f', fallo: '#ef4444', descansando: '#8b93a1', pedido: '#5b616b',
  pendiente: '#3f444c', 'a-medias': '#f59e0b', durmiendo: '#7c83c9',
}

type Modo = 'quieto' | 'ida' | 'charla' | 'vuelta'
type Evento = { dice: string; responde?: string }

type K = {
  a: AgenteVista
  sala: Sala
  pos: Punto
  modo: Modo
  dir: number
  espera: number
  estado: EstadoAgente
  camino: Punto[]
  paso: number
  ev: Evento | null
  dest: string
  hasta: number
  dice: string | null
  responde: string | null
  rDesde: number
  rHasta: number
  habla: string | null
  hablaHasta: number
}

export function crearVista(
  cv: HTMLCanvasElement,
  mundo: Mundo,
  agentes: AgenteVista[],
  op: { alTocar(id: string | null): void; alAvisar(t: string): void },
) {
  const { W, H } = mundo
  const { M, RW, RH, AX } = mundo.medidas
  const arte = document.createElement('canvas'); arte.width = W; arte.height = H
  const a = arte.getContext('2d') as Ctx, c = cv.getContext('2d') as Ctx
  const glifos: Record<number, string> = {}
  agentes.forEach((k) => { glifos[k.puesto] = k.aspecto.glifo })
  const fondo = dibujarFondo(mundo, (p) => glifos[p]), muebles = listaMuebles(mundo)
  const bandeja = { n: 0 }
  const equipo: K[] = [], porId: Record<string, K> = {}, porPuesto: Record<number, K> = {}
  agentes.forEach((ag) => {
    const sala = mundo.salas[ag.puesto]
    if (!sala) return
    const k: K = {
      a: ag, sala, pos: mundo.asiento(ag.id), modo: 'quieto', dir: 1, espera: 0, estado: ag.estado_fijo || 'descansando',
      camino: [], paso: 0, ev: null, dest: '', hasta: 0, dice: null, responde: null, rDesde: 0, rHasta: 0, habla: null, hablaHasta: 0,
    }
    equipo.push(k); porId[ag.id] = k; porPuesto[ag.puesto] = k
  })
  let dormida = false
  const noche = (k: K) => dormida && !k.a.despierto_siempre

  // cámara: arranca viendo todo; los botones, la rueda con Ctrl/Cmd o los dedos acercan, y se arrastra como un mapa
  const cam = { s: 1, ox: 0, oy: 0, lista: false }
  let minS = 1, dpr = 1
  function limitar() {
    cam.s = Math.max(minS, Math.min(minS * 5, cam.s))
    const vw = cv.width / cam.s, vh = cv.height / cam.s
    cam.ox = vw >= W ? (W - vw) / 2 : Math.max(0, Math.min(W - vw, cam.ox))
    cam.oy = vh >= H ? (H - vh) / 2 : Math.max(0, Math.min(H - vh, cam.oy))
  }
  function verTodo() { cam.s = minS; limitar() }
  function medir() {
    const p = cv.parentElement as HTMLElement
    dpr = window.devicePixelRatio || 1
    const enTodo = !cam.lista || cam.s <= minS * 1.001
    cv.width = Math.max(1, Math.round(p.clientWidth * dpr)); cv.height = Math.max(1, Math.round(p.clientHeight * dpr))
    cv.style.width = p.clientWidth + 'px'; cv.style.height = p.clientHeight + 'px'
    minS = Math.min(cv.width / W, cv.height / H); cam.lista = true
    if (enTodo) verTodo(); else limitar()
  }
  function zoom(f: number, px: number, py: number) {
    const wx = cam.ox + px / cam.s, wy = cam.oy + py / cam.s
    cam.s *= f; limitar(); cam.ox = wx - px / cam.s; cam.oy = wy - py / cam.s; limitar()
  }
  const acercar = () => zoom(1.5, cv.width / 2, cv.height / 2)
  const alejar = () => zoom(1 / 1.5, cv.width / 2, cv.height / 2)
  medir()

  // caminar: ruta real, ceder el paso, conversar y volver
  function llegar(k: K, ahora: number) {
    k.paso++
    if (k.paso < k.camino.length) return
    if (k.modo === 'ida') {
      const ev = k.ev as Evento
      k.modo = 'charla'; k.hasta = ahora + 3.4; k.dice = ev.dice; k.dir = 1
      if (k.dest === 'ale') {
        bandeja.n = Math.min(5, bandeja.n + 1)
        if (op.alAvisar) op.alAvisar(k.a.nombre + ' te dejó algo en tu oficina: ' + ev.dice.toLowerCase())
      } else if (ev.responde) {
        const d = porId[k.dest]
        if (d) { d.responde = ev.responde; d.rDesde = ahora + 1.3; d.rHasta = ahora + 3.4 }
      }
    } else { k.modo = 'quieto'; k.dir = 1 }
  }
  function mover(k: K, dt: number, ahora: number) {
    if (k.modo === 'charla' && ahora > k.hasta) { k.dice = null; k.modo = 'vuelta'; k.camino = mundo.ruta(k.pos, mundo.asiento(k.a.id)); k.paso = 0 }
    if (k.modo !== 'ida' && k.modo !== 'vuelta') return
    const p = k.camino[k.paso], dx = p[0] - k.pos[0], dy = p[1] - k.pos[1], dist = Math.hypot(dx, dy)
    if (dist < 0.05) { k.pos = [p[0], p[1]]; llegar(k, ahora); return }
    const ux = dx / dist, uy = dy / dist, fx = k.pos[0] + ux * 8, fy = k.pos[1] + uy * 8
    let tapa = false
    for (let i = 0; i < equipo.length; i++) {
      const o = equipo[i]
      if (o === k || o.modo === 'quieto') continue
      if (Math.abs(o.pos[0] - fx) < 9 && Math.abs(o.pos[1] - fy) < 6 && (o.modo === 'charla' || o.a.id < k.a.id)) { tapa = true; break }
    }
    if (tapa && k.espera < 1.3) { k.espera += dt; return }
    k.espera = 0
    if (Math.abs(dx) > 0.5) k.dir = dx > 0 ? 1 : -1
    const v = dt * 58
    if (dist > v) k.pos = [k.pos[0] + ux * v, k.pos[1] + uy * v]
    else { k.pos = [p[0], p[1]]; llegar(k, ahora) }
  }
  function visita(de: string, a2: string, dice: string, responde?: string) {
    const k = porId[de]
    if (dormida || !k || k.modo !== 'quieto' || (a2 !== 'ale' && !porId[a2])) return
    k.camino = mundo.ruta(k.pos, mundo.visita(a2)); k.paso = 0; k.modo = 'ida'; k.ev = { dice, responde }; k.dest = a2
  }
  function decir(id: string, texto: string) {
    const k = porId[id]
    if (!k) return
    k.habla = texto; k.hablaHasta = performance.now() / 1000 + 3.4
  }
  function estados(m: Record<string, EstadoAgente>) {
    Object.keys(m).forEach((id) => { const k = porId[id]; if (k) k.estado = m[id] })
  }
  function dormir(si: boolean) {
    dormida = si
    if (si) equipo.forEach((k) => { k.modo = 'quieto'; k.pos = mundo.asiento(k.a.id); k.dice = null; k.espera = 0; k.dir = 1; k.ev = null })
  }

  function knox(k: K, ahora: number) {
    const anda = k.modo === 'ida' || k.modo === 'vuelta', quieto = k.modo === 'quieto'
    let f6 = Math.floor(ahora * 6) % 2
    if (anda && k.espera > 0) f6 = 0
    const apagado = k.estado === 'pedido' || k.estado === 'pendiente'
    const duerme = dormida ? !k.a.despierto_siempre : (k.estado === 'descansando' || k.estado === 'durmiendo')
    const fr = {
      paso: anda && !k.espera ? 1 + f6 : 0,
      tecleo: quieto && !dormida && (k.estado === 'trabajando' || k.estado === 'publicando') && !!(Math.floor(ahora * 4) % 2),
      dormido: quieto && duerme,
    }
    const bob = anda ? f6 : (apagado ? 0 : Math.floor(ahora * 1.6 + k.a.id.length) % 2)
    const spr = sprite(k.a.aspecto, fr), x = Math.round(k.pos[0]), y = Math.round(k.pos[1]) - 37 - bob
    a.save(); if (apagado && quieto) a.globalAlpha = 0.5
    if (k.dir < 0) { a.translate(x, 0); a.scale(-1, 1); a.drawImage(spr, -14, y) } else a.drawImage(spr, x - 14, y)
    a.restore()
  }
  function fuente(px: number) { return Math.max(1, Math.round(px)) + 'px Silkscreen, ui-monospace, monospace' }
  function burbuja(x: number, top: number, txt: string, s: number, fondoB: string) {
    c.font = fuente(6.5 * s)
    const tw = c.measureText(txt).width + 8 * s, th = 11 * s
    c.fillStyle = '#1b1820'; c.fillRect(x - tw / 2 - s, top - th - s, tw + 2 * s, th + 2 * s)
    c.fillStyle = fondoB; c.fillRect(x - tw / 2, top - th, tw, th); c.fillRect(x - 2 * s, top, 4 * s, 3 * s)
    c.fillStyle = '#15171b'; c.fillText(txt, x, top - th / 2 + s / 2)
  }
  function cartel(x: number, y: number, txt: string, s: number) {
    c.font = fuente(6 * s)
    const tw = c.measureText(txt).width + 8 * s, th = 10 * s
    c.fillStyle = '#1b1820'; c.fillRect(x - tw / 2 - s, y - th / 2 - s, tw + 2 * s, th + 2 * s)
    c.fillStyle = '#f3e6cc'; c.fillRect(x - tw / 2, y - th / 2, tw, th)
    c.fillStyle = '#2a1d14'; c.fillText(txt, x, y + s / 2)
  }
  function textos(ahora: number) {
    const s = cam.s
    const X = (x: number) => (x - cam.ox) * s, Y = (y: number) => (y - cam.oy) * s
    c.textBaseline = 'middle'; c.textAlign = 'center'
    mundo.salas.forEach((sa) => {
      const k = porPuesto[sa.puesto]
      if (!k) return
      c.fillStyle = COL[noche(k) ? 'durmiendo' : k.estado]; c.fillRect(X(sa.rx + 34), Y(sa.ry + 6), 4 * s, 4 * s)
      c.fillStyle = '#2a1d14'; c.font = fuente(7 * s); c.fillText(k.a.nombre, X(sa.rx + 64), Y(sa.ry + 8.4))
      if (k.estado === 'pendiente' && !dormida) cartel(X(sa.rx + 64), Y(sa.ry + 52), 'pronto', s)
      else if (dormida && k.a.despierto_siempre) cartel(X(sa.rx + 64), Y(sa.ry + 52), 'atiende a la gente', s)
    })
    c.fillStyle = '#2a1d14'; c.font = fuente(6.5 * s); c.fillText('TU OFICINA', X(AX + 75), Y(M + 8.4))
    c.fillStyle = '#ffffff'; c.font = fuente(6 * s); c.fillText('PARA TI: ' + bandeja.n, X(AX + 51), Y(M + 207))
    for (let i = 0; i < bandeja.n; i++) { c.fillStyle = i % 2 ? '#f3e6cc' : '#ffffff'; c.fillRect(X(AX + 24 + i * 11), Y(M + 211), 9 * s, 4 * s) }
    equipo.forEach((k) => {
      const x = X(k.pos[0]), top = Y(k.pos[1] - 42)
      if (k.dice) burbuja(x, top, k.dice, s, '#ffffff')
      else if (k.habla && ahora < k.hablaHasta) burbuja(x, top, k.habla, s, '#ffffff')
      else if (k.responde && ahora > k.rDesde && ahora < k.rHasta) burbuja(x, top, k.responde, s, '#ffe9a8')
      else if (k.modo === 'quieto' && (dormida ? !k.a.despierto_siempre : (k.estado === 'descansando' || k.estado === 'durmiendo'))) {
        const q = (ahora * 0.7 + k.a.id.length * 0.37) % 1
        c.globalAlpha = 1 - q; c.fillStyle = '#e8eef6'; c.font = fuente(8 * s)
        c.fillText('z', x + (12 + q * 6) * s, top + (8 - q * 10) * s); c.globalAlpha = 1
      }
    })
  }
  function luz(sa: Sala, alfa: number) {
    a.save(); a.globalAlpha = alfa; a.fillStyle = '#ffd27a'
    a.beginPath(); a.arc(sa.rx + 106, sa.ry + 16, 18, 0, 7); a.fill(); a.restore()
  }
  function dibujar(ahora: number) {
    a.drawImage(fondo, 0, 0)
    if (!dormida) mundo.salas.forEach((sa) => { const k = porPuesto[sa.puesto]; if (!k || k.estado !== 'pendiente') luz(sa, 0.09) })
    const L: { y: number; f: (cx: Ctx) => void }[] = muebles.slice()
    equipo.forEach((k) => L.push({ y: k.pos[1], f: () => knox(k, ahora) }))
    L.sort((p, q) => p.y - q.y).forEach((o) => o.f(a))
    if (dormida) {
      a.save(); a.globalAlpha = 0.5; a.fillStyle = '#070a1c'; a.fillRect(0, 0, W, H); a.restore()
      equipo.forEach((k) => { if (k.a.despierto_siempre) luz(k.sala, 0.18) })
    }
    equipo.forEach((k) => {
      if (k.estado !== 'pendiente' || dormida) return
      a.save(); a.globalAlpha = 0.55; a.fillStyle = '#070a14'; a.fillRect(k.sala.rx, k.sala.ry, RW, RH); a.restore()
    })
    c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.fillStyle = '#0d0f12'; c.fillRect(0, 0, cv.width, cv.height)
    const vw = cv.width / cam.s, vh = cv.height / cam.s
    const sx = Math.max(0, cam.ox), sy = Math.max(0, cam.oy), ex = Math.min(W, cam.ox + vw), ey = Math.min(H, cam.oy + vh)
    c.drawImage(arte, sx, sy, ex - sx, ey - sy, (sx - cam.ox) * cam.s, (sy - cam.oy) * cam.s, (ex - sx) * cam.s, (ey - sy) * cam.s)
    textos(ahora)
  }

  let ultimo = performance.now() / 1000, ultimoDibujo = 0, raf = 0, vivo = true
  function tick() {
    raf = 0
    if (!vivo || document.hidden) return
    const ahora = performance.now() / 1000, dt = Math.min(0.1, ahora - ultimo)
    ultimo = ahora
    if (!dormida) equipo.forEach((k) => mover(k, dt, ahora))
    if (ahora - ultimoDibujo >= 1 / 24) { ultimoDibujo = ahora; dibujar(ahora) }
    raf = requestAnimationFrame(tick)
  }
  function arrancar() { if (vivo && !raf && !document.hidden) { ultimo = performance.now() / 1000; raf = requestAnimationFrame(tick) } }
  function alCambiarVisible() { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0 } else arrancar() }
  arrancar()

  // mano: arrastrar, pellizcar, rueda con Ctrl/Cmd, doble clic, teclas y tocar una oficina
  const punteros: Record<number, [number, number]> = {}
  let arrastre: { x: number; y: number; ox: number; oy: number; movio: boolean } | null = null
  let pellizco: { d: number; s: number } | null = null
  function local(e: MouseEvent): [number, number] { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr] }
  function alBajar(e: PointerEvent) {
    try { cv.setPointerCapture(e.pointerId) } catch { /* sin captura también sirve */ }
    punteros[e.pointerId] = [e.clientX, e.clientY]
    const ids = Object.keys(punteros)
    if (ids.length === 1) arrastre = { x: e.clientX, y: e.clientY, ox: cam.ox, oy: cam.oy, movio: false }
    if (ids.length === 2) {
      const p1 = punteros[Number(ids[0])], p2 = punteros[Number(ids[1])]
      pellizco = { d: Math.hypot(p1[0] - p2[0], p1[1] - p2[1]) || 1, s: cam.s }
      if (arrastre) arrastre.movio = true
    }
  }
  function alMover(e: PointerEvent) {
    if (!punteros[e.pointerId]) return
    punteros[e.pointerId] = [e.clientX, e.clientY]
    const ids = Object.keys(punteros)
    if (pellizco && ids.length === 2) {
      const p1 = punteros[Number(ids[0])], p2 = punteros[Number(ids[1])], r = cv.getBoundingClientRect()
      zoom(pellizco.s * Math.hypot(p1[0] - p2[0], p1[1] - p2[1]) / pellizco.d / cam.s, ((p1[0] + p2[0]) / 2 - r.left) * dpr, ((p1[1] + p2[1]) / 2 - r.top) * dpr)
      return
    }
    if (arrastre) {
      const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y
      if (Math.abs(dx) + Math.abs(dy) > 5) arrastre.movio = true
      if (arrastre.movio) { cam.ox = arrastre.ox - dx * dpr / cam.s; cam.oy = arrastre.oy - dy * dpr / cam.s; limitar() }
    }
  }
  function soltar(e: PointerEvent) {
    const clic = arrastre && !arrastre.movio && Object.keys(punteros).length === 1
    delete punteros[e.pointerId]
    if (Object.keys(punteros).length < 2) pellizco = null
    if (clic) {
      const p = local(e), x = cam.ox + p[0] / cam.s, y = cam.oy + p[1] / cam.s
      let toco: string | null = null
      mundo.salas.forEach((sa) => { if (x >= sa.rx && x < sa.rx + RW && y >= sa.ry && y < sa.ry + RH) { const k = porPuesto[sa.puesto]; toco = k ? k.a.id : null } })
      op.alTocar(toco)
    }
    if (!Object.keys(punteros).length) arrastre = null
  }
  function alRodar(e: WheelEvent) {
    if (!e.ctrlKey && !e.metaKey) return // la rueda sola mueve la página
    e.preventDefault()
    const p = local(e)
    zoom(Math.exp(-e.deltaY * 0.0016), p[0], p[1])
  }
  function alDobleClic(e: MouseEvent) { const p = local(e); zoom(2, p[0], p[1]) }
  function alTeclear(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const t = e.target as HTMLElement | null
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
    if (e.key === '+' || e.key === '=') acercar()
    else if (e.key === '-' || e.key === '_') alejar()
    else if (e.key === '0') verTodo()
  }
  window.addEventListener('resize', medir)
  document.addEventListener('visibilitychange', alCambiarVisible)
  document.addEventListener('keydown', alTeclear)
  cv.addEventListener('pointerdown', alBajar)
  cv.addEventListener('pointermove', alMover)
  cv.addEventListener('pointerup', soltar)
  cv.addEventListener('pointercancel', soltar)
  cv.addEventListener('wheel', alRodar, { passive: false })
  cv.addEventListener('dblclick', alDobleClic)

  function destruir() {
    vivo = false
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    window.removeEventListener('resize', medir)
    document.removeEventListener('visibilitychange', alCambiarVisible)
    document.removeEventListener('keydown', alTeclear)
    cv.removeEventListener('pointerdown', alBajar)
    cv.removeEventListener('pointermove', alMover)
    cv.removeEventListener('pointerup', soltar)
    cv.removeEventListener('pointercancel', soltar)
    cv.removeEventListener('wheel', alRodar)
    cv.removeEventListener('dblclick', alDobleClic)
  }

  return { estados, visita, dormir, decir, medir, acercar, alejar, verTodo, destruir }
}
