// Mueve a los Knox por rutas reales, los dibuja en orden y deja ver la oficina como un mapa.
// Solo anima lo que le piden (visita, decir, estados, dormir, bandeja, sala): no corre ningún guion por su cuenta.
// La sala: quien tiene lugar camina por la ruta real hasta su sitio y se sienta (en el café, en un banco alto con su
// taza; en la plática, en un sillón o en el sofá, mirando a quien vino con él; en la siesta, acostado o en un puf, dormido).
// Si lo pierde, vuelve a su escritorio. Estar en la sala no saca nubes: solo hablan las líneas de verdad (decir).
// aLoAlto (el teléfono): arranca con la escala que llena el alto, pegada a la izquierda, y el resto se arrastra.
import type { Agente, EstadoAgente } from '../../../lib/oficina/tipos'
import type { Mundo, Punto, Sala } from '../../../lib/oficina/mundo'
import type { LugarSala } from '../../../lib/oficina/sala'
import { ACOSTADO, ALTO_BANCO, R, acostado, dibujarFondo, listaMuebles, lucesSala, posturaSala, type Ctx, type Luz, type Postura } from './arte'
import { sprite } from './knox-sprite'

export type AgenteVista = Agente

export const COL: Record<EstadoAgente, string> = {
  trabajando: '#22c55e', publicando: '#38bdf8', listo: '#ff7a2f', fallo: '#ef4444', descansando: '#8b93a1', pedido: '#5b616b',
  pendiente: '#3f444c', 'a-medias': '#f59e0b', durmiendo: '#7c83c9',
}

// quieto: en su lugar (su escritorio o su sitio en la sala); ida y charla: de visita; vuelta: camino a su lugar
type Modo = 'quieto' | 'ida' | 'charla' | 'vuelta'
// Lo que hay bajo el dedo o el mouse: la oficina de un Knox, la tuya ('ale') o un Knox en la sala, en pixeles del mundo
type Zona = { id: string; x: number; y: number; w: number; h: number }
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
  lugar: LugarSala | null // su sitio en la sala; null: su escritorio
}

export function crearVista(
  cv: HTMLCanvasElement,
  mundo: Mundo,
  agentes: AgenteVista[],
  // abajo: cuánto tapan desde abajo los controles de la página (los botones y la pista), en px de la página
  op: { alTocar(id: string | null): void; alAvisar?(t: string): void; aLoAlto?: boolean; abajo?(): number },
) {
  const { W, H } = mundo
  const { M, RW, RH, AX, AW, HO } = mundo.medidas
  const arte = document.createElement('canvas'); arte.width = W; arte.height = H
  const a = arte.getContext('2d') as Ctx, c = cv.getContext('2d') as Ctx
  const glifos: Record<number, string> = {}
  agentes.forEach((k) => { glifos[k.puesto] = k.aspecto.glifo })
  const fondo = dibujarFondo(mundo, (p) => glifos[p]), muebles = listaMuebles(mundo), luces = lucesSala(mundo)
  const bandeja = { n: 0 }
  const equipo: K[] = [], porId: Record<string, K> = {}, porPuesto: Record<number, K> = {}
  agentes.forEach((ag) => {
    const sala = mundo.salas[ag.puesto]
    if (!sala) return
    const k: K = {
      a: ag, sala, pos: mundo.asiento(ag.id), modo: 'quieto', dir: 1, espera: 0, estado: ag.estado_fijo || 'descansando',
      camino: [], paso: 0, ev: null, dest: '', hasta: 0, dice: null, responde: null, rDesde: 0, rHasta: 0, habla: null, hablaHasta: 0,
      lugar: null,
    }
    equipo.push(k); porId[ag.id] = k; porPuesto[ag.puesto] = k
  })
  let dormida = false, encima: Zona | null = null, salaLista = false
  const noche = (k: K) => dormida && !k.a.despierto_siempre

  // cámara: arranca viendo todo (o a lo alto en el teléfono); los botones, la rueda con Ctrl/Cmd o los dedos acercan,
  // y se arrastra como un mapa. Ajustado, el mundo queda encima de lo que tapan los controles de abajo (margenAbajo,
  // en pixeles del lienzo): nada de la oficina ni de la sala arranca debajo de los botones o de la pista. De cerca, el
  // mundo sí puede pasar por debajo, pero siempre se puede arrastrar hasta que la sala quede encima.
  const cam = { s: 1, ox: 0, oy: 0, lista: false }
  let minS = 1, dpr = 1, margenAbajo = 0
  const altoLibre = () => Math.max(1, cv.height - margenAbajo)
  function limitar() {
    cam.s = Math.max(minS, Math.min(minS * 6, cam.s))
    const vw = cv.width / cam.s, vh = altoLibre() / cam.s
    cam.ox = vw >= W ? (W - vw) / 2 : Math.max(0, Math.min(W - vw, cam.ox))
    cam.oy = vh >= H ? (H - vh) / 2 : Math.max(0, Math.min(H - vh, cam.oy))
  }
  function verTodo() { cam.s = minS; limitar() }
  function inicio() {
    if (op.aLoAlto) { cam.s = altoLibre() / H; cam.ox = 0; cam.oy = 0; limitar() } else verTodo()
  }
  function medir() {
    const p = cv.parentElement as HTMLElement, w = p.clientWidth, h = p.clientHeight
    if (!w || !h) return // escondida: se mide cuando se vea
    dpr = window.devicePixelRatio || 1
    const primera = !cam.lista, enTodo = cam.s <= minS * 1.001
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
    cv.style.width = w + 'px'; cv.style.height = h + 'px'
    margenAbajo = Math.min(cv.height / 2, Math.max(0, Math.round((op.abajo?.() ?? 0) * dpr)))
    minS = Math.min(cv.width / W, altoLibre() / H); cam.lista = true
    if (primera) inicio(); else if (enTodo) verTodo(); else limitar()
  }
  function zoom(f: number, px: number, py: number) {
    const wx = cam.ox + px / cam.s, wy = cam.oy + py / cam.s
    cam.s *= f; limitar(); cam.ox = wx - px / cam.s; cam.oy = wy - py / cam.s; limitar()
  }
  const acercar = () => zoom(1.5, cv.width / 2, cv.height / 2)
  const alejar = () => zoom(1 / 1.5, cv.width / 2, cv.height / 2)
  medir()

  // ---- dónde está cada uno: su escritorio o su sitio en la sala ----
  function casa(k: K): Punto {
    return k.lugar ? mundo.sitio(k.lugar.rincon, k.lugar.sitio) : mundo.asiento(k.a.id)
  }
  function irACasa(k: K) {
    const p = casa(k)
    k.dice = null; k.espera = 0
    if (Math.abs(p[0] - k.pos[0]) < 0.5 && Math.abs(p[1] - k.pos[1]) < 0.5) { k.pos = p; k.modo = 'quieto'; k.camino = []; k.dir = 1; return }
    k.camino = mundo.ruta(k.pos, p); k.paso = 0; k.modo = 'vuelta'
  }
  // cómo está sentado en la sala (solo cuando ya llegó a su sitio)
  const postura = (k: K): Postura | null => (k.modo === 'quieto' && k.lugar ? posturaSala(k.lugar.rincon, k.lugar.sitio) : null)
  // con los ojos cerrados: dormida, todos menos los de guardia; en la sala, los de la siesta; en su escritorio, los que descansan
  const duerme = (k: K) =>
    dormida ? !k.a.despierto_siempre : k.lugar ? k.lugar.rincon === 'siesta' : k.estado === 'descansando' || k.estado === 'durmiendo'
  // sentado, mira a quien vino con él (o al centro de su rincón)
  function mirada(k: K): number {
    const l = k.lugar as LugarSala
    const o = l.con ? porId[l.con] : undefined
    const r = mundo.rincon(l.rincon)
    const x = o?.lugar ? casa(o)[0] : r.x + r.w / 2
    return x >= k.pos[0] ? 1 : -1
  }
  // arriba de su cabeza (de ahí salen las nubes y las «z») y lo que ocupa su dibujo (para tocarlo)
  function cabeza(k: K): Punto {
    const p = postura(k)
    if (p === 'acostado') return [k.pos[0] + ACOSTADO.x + 14, k.pos[1] + ACOSTADO.y - 1]
    return [k.pos[0], k.pos[1] - 42 - (p === 'banco' ? ALTO_BANCO : 0)]
  }
  function cajaDe(k: K): Zona {
    const p = postura(k)
    if (p === 'acostado') return { id: k.a.id, x: k.pos[0] + ACOSTADO.x, y: k.pos[1] + ACOSTADO.y, w: ACOSTADO.w, h: ACOSTADO.h }
    return { id: k.a.id, x: k.pos[0] - 14, y: k.pos[1] - 38 - (p === 'banco' ? ALTO_BANCO : 0), w: 28, h: 39 }
  }

  // caminar: ruta real, ceder el paso, conversar y volver
  function llegar(k: K, ahora: number) {
    k.paso++
    if (k.paso < k.camino.length) return
    if (k.modo === 'ida') {
      const ev = k.ev as Evento
      k.modo = 'charla'; k.hasta = ahora + 3.4; k.dice = ev.dice; k.dir = 1
      if (k.dest === 'ale') {
        // el número de «PARA TI» lo pone bandeja(n) con los datos; la llegada solo se anima
        op.alAvisar?.(k.a.nombre + ' te dejó algo en tu oficina: ' + ev.dice.toLowerCase())
      } else if (ev.responde) {
        const d = porId[k.dest]
        if (d) { d.responde = ev.responde; d.rDesde = ahora + 1.3; d.rHasta = ahora + 3.4 }
      }
    } else { k.modo = 'quieto'; k.dir = 1 }
  }
  function mover(k: K, dt: number, ahora: number) {
    if (k.modo === 'charla' && ahora > k.hasta) irACasa(k) // vuelve a su lugar (el de ahora: pudo cambiar mientras tanto)
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
  // sale desde donde esté quieto: su escritorio o la sala
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
    if (si) equipo.forEach((k) => { k.modo = 'quieto'; k.lugar = null; k.pos = mundo.asiento(k.a.id); k.dice = null; k.espera = 0; k.dir = 1; k.ev = null })
  }
  // Quién está en la sala (repartirSala): el que recibe lugar camina hasta su sitio y el que lo pierde vuelve a su
  // escritorio. Al abrir la página, cada uno ya está en su lugar; el de visita va a su lugar nuevo cuando termina.
  function ponerSala(asig: Record<string, LugarSala>) {
    const primera = !salaLista
    salaLista = true
    equipo.forEach((k) => {
      const l = dormida ? null : asig[k.a.id] ?? null
      const igual = k.lugar && l ? k.lugar.rincon === l.rincon && k.lugar.sitio === l.sitio : k.lugar === l
      k.lugar = l
      if (igual || k.modo === 'ida' || k.modo === 'charla') return
      if (primera && k.modo === 'quieto') k.pos = casa(k)
      else irACasa(k)
    })
  }
  // cuántas cosas hay en «PARA TI» sobre tu escritorio (sale de los datos en cada actualización)
  function ponerBandeja(n: number) { bandeja.n = Math.max(0, Math.floor(n) || 0) }

  // la taza del café en la mano de adelante, con su vapor; cada tanto, un sorbo
  function taza(x: number, top: number, dir: number, t: number) {
    const sorbo = t % 7 < 0.8
    const tx = x + dir * (sorbo ? 5 : 10) - 2, ty = top + (sorbo ? 19 : 26)
    R(a, tx, ty, 4, 3, '#f4f4f4'); R(a, tx, ty, 4, 1, '#6b3e26'); R(a, dir > 0 ? tx + 4 : tx - 1, ty + 1, 1, 1, '#f4f4f4')
    if (sorbo) return
    const q = (t * 0.8) % 1
    a.save(); a.globalAlpha = 0.75 * (1 - q); R(a, tx + 1 + (q > 0.5 ? 1 : 0), ty - 2 - Math.floor(q * 5), 1, 1, '#e8eef6'); a.restore()
  }
  function knox(k: K, ahora: number) {
    const anda = k.modo === 'ida' || k.modo === 'vuelta', quieto = k.modo === 'quieto', p = postura(k)
    let f6 = Math.floor(ahora * 6) % 2
    if (anda && k.espera > 0) f6 = 0
    // en la sala nadie se ve apagado: el que espera que le pidas algo también se toma su café
    const apagado = !p && (k.estado === 'pedido' || k.estado === 'pendiente')
    const fr = {
      paso: anda && !k.espera ? 1 + f6 : 0,
      tecleo: quieto && !p && !dormida && (k.estado === 'trabajando' || k.estado === 'publicando') && !!(Math.floor(ahora * 4) % 2),
      dormido: quieto && duerme(k),
    }
    const bob = anda ? f6 : (apagado ? 0 : Math.floor(ahora * 1.6 + k.a.id.length) % 2)
    const spr = sprite(k.a.aspecto, fr), x = Math.round(k.pos[0])
    if (p === 'acostado') { acostado(a, spr, x, Math.round(k.pos[1]), Math.floor(ahora * 0.8 + k.a.id.length) % 2); return }
    const dir = p ? mirada(k) : k.dir
    const y = Math.round(k.pos[1]) - 37 - bob - (p === 'banco' ? ALTO_BANCO : 0)
    a.save(); if (apagado && quieto) a.globalAlpha = 0.5
    if (dir < 0) { a.translate(x, 0); a.scale(-1, 1); a.drawImage(spr, -14, y) } else a.drawImage(spr, x - 14, y)
    a.restore()
    if (p === 'banco') taza(x, y, dir, ahora + k.a.id.length * 0.9)
  }
  // Las letras nunca bajan de un tamaño que se lea (en el teléfono la escala es chica): el mínimo va en pixeles de pantalla
  function fuente(px: number) { return Math.max(1, Math.round(px)) + 'px Silkscreen, ui-monospace, monospace' }
  function burbuja(x: number, top: number, txt: string, s: number, fondoB: string) {
    c.font = fuente(Math.max(6.5 * s, 9.5 * dpr))
    const tw = c.measureText(txt).width + 10 * dpr, th = Math.max(11 * s, 16 * dpr), m = 4 * dpr
    // la nube no se sale del cuadro: se corre hacia adentro
    x = Math.max(tw / 2 + m, Math.min(cv.width - tw / 2 - m, x)); top = Math.max(th + m, top)
    c.fillStyle = '#1b1820'; c.fillRect(x - tw / 2 - dpr * 1.5, top - th - dpr * 1.5, tw + dpr * 3, th + dpr * 3)
    c.fillStyle = fondoB; c.fillRect(x - tw / 2, top - th, tw, th); c.fillRect(x - 2 * dpr, top, 4 * dpr, 3 * dpr)
    c.fillStyle = '#15171b'; c.fillText(txt, x, top - th / 2 + dpr * 0.5)
  }
  function cartel(x: number, y: number, txt: string, s: number, fondoC = '#f3e6cc') {
    c.font = fuente(Math.max(6 * s, 8.5 * dpr))
    const tw = c.measureText(txt).width + 8 * dpr, th = Math.max(10 * s, 14 * dpr)
    c.fillStyle = '#1b1820'; c.fillRect(x - tw / 2 - dpr, y - th / 2 - dpr, tw + 2 * dpr, th + 2 * dpr)
    c.fillStyle = fondoC; c.fillRect(x - tw / 2, y - th / 2, tw, th)
    c.fillStyle = '#2a1d14'; c.fillText(txt, x, y + dpr * 0.5)
  }
  function textos(ahora: number) {
    const s = cam.s
    const X = (x: number) => (x - cam.ox) * s, Y = (y: number) => (y - cam.oy) * s
    c.textBaseline = 'middle'; c.textAlign = 'center'
    mundo.salas.forEach((sa) => {
      const k = porPuesto[sa.puesto]
      if (!k) return
      c.fillStyle = COL[noche(k) ? 'durmiendo' : k.estado]; c.fillRect(X(sa.rx + 34), Y(sa.ry + 6), 4 * s, 4 * s)
      c.fillStyle = '#2a1d14'; c.font = fuente(Math.max(7 * s, 8 * dpr)); c.fillText(k.a.nombre, X(sa.rx + 64), Y(sa.ry + 8.4))
      if (k.estado === 'pendiente' && !dormida) cartel(X(sa.rx + 64), Y(sa.ry + 52), 'pronto', s)
      else if (dormida && k.a.despierto_siempre) cartel(X(sa.rx + 64), Y(sa.ry + 52), k.a.id === 'echo' ? 'atiende a la gente' : 'de guardia', s, '#ffd27a')
    })
    c.fillStyle = '#2a1d14'; c.font = fuente(Math.max(6.5 * s, 8 * dpr)); c.fillText('TU OFICINA', X(AX + 75), Y(M + 8.4))
    c.fillStyle = '#ffffff'; c.font = fuente(Math.max(6 * s, 8 * dpr)); c.fillText('PARA TI: ' + bandeja.n, X(AX + 51), Y(M + 207))
    for (let i = 0; i < Math.min(5, bandeja.n); i++) { c.fillStyle = i % 2 ? '#f3e6cc' : '#ffffff'; c.fillRect(X(AX + 24 + i * 11), Y(M + 211), 9 * s, 4 * s) }
    // el rótulo de la sala y la pizarra del café (con la luz apagada, casi no se leen)
    const sa = mundo.sala, cafe = mundo.rincon('cafe')
    c.globalAlpha = dormida ? 0.4 : 1
    c.fillStyle = '#2a1d14'; c.font = fuente(Math.max(6.5 * s, 8 * dpr)); c.fillText('LA SALA', X(sa.x + sa.w / 2), Y(sa.y + 8.4))
    c.fillStyle = '#e8eef6'; c.font = fuente(Math.max(5.5 * s, 7 * dpr)); c.fillText('CAFÉ', X(cafe.x + 207), Y(sa.y + 12.5))
    c.globalAlpha = 1
    equipo.forEach((k) => {
      const [hx, hy] = cabeza(k), x = X(hx), top = Y(hy)
      if (k.dice) burbuja(x, top, k.dice, s, '#ffffff')
      else if (k.habla && ahora < k.hablaHasta) burbuja(x, top, k.habla, s, dormida ? '#dfe2ff' : '#ffffff')
      else if (k.responde && ahora > k.rDesde && ahora < k.rHasta) burbuja(x, top, k.responde, s, '#ffe9a8')
      else if (k.modo === 'quieto' && duerme(k)) {
        const q = (ahora * 0.7 + k.a.id.length * 0.37) % 1
        c.globalAlpha = 1 - q; c.fillStyle = '#e8eef6'; c.font = fuente(Math.max(8 * s, 9 * dpr))
        c.fillText('z', x + (12 + q * 6) * s, top + (8 - q * 10) * s); c.globalAlpha = 1
      }
    })
    // con el mouse encima de una oficina (o de un Knox en la sala), su borde se marca: se puede tocar
    if (encima) {
      c.strokeStyle = '#ff9a5c'; c.lineWidth = Math.max(2, 1.5 * dpr)
      c.strokeRect(X(encima.x) + 1, Y(encima.y) + 1, encima.w * s - 2, encima.h * s - 2)
    }
  }
  function brillo(x: number, y: number, r: number, alfa: number) {
    a.save(); a.globalAlpha = alfa; a.fillStyle = '#ffd27a'
    a.beginPath(); a.arc(x, y, r, 0, 7); a.fill(); a.restore()
  }
  // las luces de la sala se apagan hacia afuera: tres círculos, sin degradado (sigue viéndose pixel)
  function brilloSuave(l: Luz) {
    a.save(); a.fillStyle = '#ffd27a'
    for (const [radio, peso] of [[1, 0.3], [0.68, 0.35], [0.38, 0.35]]) {
      a.globalAlpha = l.alfa * peso; a.beginPath(); a.arc(l.x, l.y, l.r * radio, 0, 7); a.fill()
    }
    a.restore()
  }
  const luz = (sa: Sala, alfa: number) => brillo(sa.rx + 106, sa.ry + 16, 18, alfa)
  function dibujar(ahora: number) {
    a.drawImage(fondo, 0, 0)
    if (!dormida) {
      mundo.salas.forEach((sa) => { const k = porPuesto[sa.puesto]; if (!k || k.estado !== 'pendiente') luz(sa, 0.09) })
      luces.luces.forEach(brilloSuave)
    }
    const L: { y: number; f: (cx: Ctx) => void }[] = muebles.slice()
    equipo.forEach((k) => L.push({ y: k.pos[1], f: () => knox(k, ahora) }))
    L.sort((p, q) => p.y - q.y).forEach((o) => o.f(a))
    const sie = mundo.rincon('siesta'), sa = mundo.sala
    if (!dormida) {
      // la siesta, con luz bajita: más oscura hacia adentro (sin borde duro con la plática) y su lámpara chiquita
      a.save(); a.fillStyle = '#0a0d22'
      for (let i = 0; i < 6; i++) { a.globalAlpha = 0.05 * (i + 1); a.fillRect(sie.x + i * 4, sie.y, 4, sie.h) }
      a.globalAlpha = 0.3; a.fillRect(sie.x + 24, sie.y, sie.w - 24, sie.h); a.restore()
      brilloSuave(luces.siesta)
    } else {
      a.save(); a.globalAlpha = 0.5; a.fillStyle = '#070a1c'; a.fillRect(0, 0, W, H)
      // la sala, vacía y con la luz apagada
      a.globalAlpha = 0.45; a.fillStyle = '#03040b'; a.fillRect(sa.x, sa.y, sa.w, sa.h); a.restore()
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

  // mano: arrastrar, pellizcar, rueda con Ctrl/Cmd, doble clic, teclas y tocar una oficina (la de un Knox o la tuya) o a
  // un Knox en la sala
  const punteros: Record<number, [number, number]> = {}
  let arrastre: { x: number; y: number; ox: number; oy: number; movio: boolean } | null = null
  let pellizco: { d: number; s: number } | null = null
  function local(e: MouseEvent): [number, number] { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * (cv.width / r.width), (e.clientY - r.top) * (cv.height / r.height)] }
  function queHay(e: MouseEvent): Zona | null {
    const p = local(e), x = cam.ox + p[0] / cam.s, y = cam.oy + p[1] / cam.s
    // en la sala, el Knox: a 16 px de sus pies o encima de su dibujo (el más cercano, si hay varios)
    let enSala: { z: Zona; d: number } | null = null
    for (const k of equipo) {
      if (k.pos[1] < HO) continue
      const z = cajaDe(k), d = Math.hypot(x - k.pos[0], y - k.pos[1])
      if ((d <= 16 || (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h)) && (!enSala || d < enSala.d)) enSala = { z, d }
    }
    if (enSala) return enSala.z
    let r: Zona | null = null
    mundo.salas.forEach((sa) => {
      const k = porPuesto[sa.puesto]
      if (k && x >= sa.rx && x < sa.rx + RW && y >= sa.ry && y < sa.ry + RH) r = { id: k.a.id, x: sa.rx, y: sa.ry, w: RW, h: RH }
    })
    if (!r && x >= AX && x < AX + AW && y >= M && y < HO) r = { id: 'ale', x: AX, y: M, w: AW, h: HO - M }
    return r
  }
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
    if (!punteros[e.pointerId]) {
      if (e.pointerType === 'mouse') { encima = queHay(e); cv.style.cursor = encima ? 'pointer' : 'grab' }
      return
    }
    punteros[e.pointerId] = [e.clientX, e.clientY]
    const ids = Object.keys(punteros)
    if (pellizco && ids.length === 2) {
      const p1 = punteros[Number(ids[0])], p2 = punteros[Number(ids[1])], r = cv.getBoundingClientRect()
      zoom(pellizco.s * Math.hypot(p1[0] - p2[0], p1[1] - p2[1]) / pellizco.d / cam.s, ((p1[0] + p2[0]) / 2 - r.left) * (cv.width / r.width), ((p1[1] + p2[1]) / 2 - r.top) * (cv.height / r.height))
      return
    }
    if (arrastre) {
      const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y
      if (Math.abs(dx) + Math.abs(dy) > 5) arrastre.movio = true
      if (arrastre.movio) {
        const r = cv.getBoundingClientRect()
        cam.ox = arrastre.ox - dx * (cv.width / r.width) / cam.s; cam.oy = arrastre.oy - dy * (cv.height / r.height) / cam.s; limitar()
        cv.style.cursor = 'grabbing'
      }
    }
  }
  function soltar(e: PointerEvent) {
    const clic = e.type !== 'pointercancel' && arrastre && !arrastre.movio && Object.keys(punteros).length === 1
    delete punteros[e.pointerId]
    if (Object.keys(punteros).length < 2) pellizco = null
    if (clic) op.alTocar(queHay(e)?.id ?? null)
    if (!Object.keys(punteros).length) { arrastre = null; cv.style.cursor = 'grab' }
  }
  function alSalir() { encima = null }
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
  cv.addEventListener('pointerleave', alSalir)
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
    cv.removeEventListener('pointerleave', alSalir)
    cv.removeEventListener('wheel', alRodar)
    cv.removeEventListener('dblclick', alDobleClic)
  }

  return { estados, visita, dormir, decir, bandeja: ponerBandeja, sala: ponerSala, medir, acercar, alejar, verTodo, destruir }
}
