// La oficina en pixel art dibujada con código (vista de frente, estilo loft): paleta, piezas, fondo y muebles.
import type { Mundo, Sala } from '../../../lib/oficina/mundo'

export type Ctx = CanvasRenderingContext2D

export const C = {
  ladrillo: ['#8a4a32', '#7d4129', '#94543a'], mortero: '#5a2f20', viga: '#3b3f46', vigaLuz: '#4b5059', remache: '#6b717b',
  borde: '#1f2226', piso: '#8d8f93', pisoLinea: '#7f8185', pasillo: '#9a9c9f', pasilloLinea: '#8b8d91',
  vidrio: '#c9dbe6', vidrioLuz: '#e8f1f6', marco: '#2b2f36', madera: '#c98a4b', maderaFrente: '#a86e39', maderaSombra: '#8d5a2d',
  metal: '#5b616b', metalLuz: '#7a818c', pantalla: '#eef2f5', glifo: '#2a2d33', naranja: '#e8792f', hoja: ['#2e6b2b', '#3f8f3a', '#58b04a'],
  maceta: '#c96b3c', alfombra: '#4e535b', letrero: '#f3e6cc', letreroBorde: '#3b2a1f', foco: '#ffd27a', sofa: '#b5592f', sofaLuz: '#c96b3c',
}

export function R(c: Ctx, x: number, y: number, w: number, h: number, col: string) {
  c.fillStyle = col
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

export function ladrillos(c: Ctx, x: number, y: number, w: number, h: number) {
  R(c, x, y, w, h, C.mortero)
  for (let fy = 0, f = 0; fy < h; fy += 5, f++) {
    for (let fx = (f % 2) * -5; fx < w; fx += 10) {
      const x0 = Math.max(x, x + fx), x1 = Math.min(x + w, x + fx + 9)
      if (x1 > x0) R(c, x0, y + fy, x1 - x0, Math.min(4, h - fy), C.ladrillo[(fx + f * 7) % 3 === 0 ? 1 : (fx + f) % 5 === 0 ? 2 : 0])
    }
  }
}

export function piso(c: Ctx, x: number, y: number, w: number, h: number, base: string, linea: string) {
  R(c, x, y, w, h, base)
  for (let i = 0; i < w; i += 16) R(c, x + i, y, 1, h, linea)
  for (let j = 0; j < h; j += 12) R(c, x, y + j, w, 1, linea)
}

export function viga(c: Ctx, x: number, y: number, w: number, h: number) {
  R(c, x, y, w, h, C.viga); R(c, x, y, w, 1, C.vigaLuz); R(c, x, y + h - 1, w, 1, C.borde)
  const largo = Math.max(w, h)
  for (let k = 4; k < largo - 2; k += 18) {
    if (w > h) R(c, x + k, y + Math.floor(h / 2) - 1, 2, 2, C.remache)
    else R(c, x + Math.floor(w / 2) - 1, y + k, 2, 2, C.remache)
  }
}

export function ventana(c: Ctx, x: number, y: number, w: number, h: number) {
  R(c, x - 1, y - 1, w + 2, h + 2, C.marco); R(c, x, y, w, h, C.vidrio)
  for (let i = 0; i < w; i += 6) R(c, x + i, y, 1, h, C.marco)
  R(c, x, y + Math.floor(h / 2), w, 1, C.marco); R(c, x + 2, y + 2, 2, h - 4, C.vidrioLuz)
}

export function lampara(c: Ctx, x: number, y: number) {
  R(c, x, y, 1, 6, C.borde); R(c, x - 5, y + 6, 11, 3, C.marco); R(c, x - 4, y + 5, 9, 1, C.metal); R(c, x - 2, y + 9, 5, 1, C.foco)
}

export function planta(c: Ctx, x: number, y: number, chica?: boolean) {
  const s = chica ? 0.6 : 1, w = Math.round(10 * s), h = Math.round(9 * s)
  R(c, x - w / 2, y - h, w, h, C.maceta); R(c, x - w / 2, y - h, w, 2, '#e08552')
  const hojas = [[0, -h - 6, 3, 8], [-5, -h - 4, 4, 4], [4, -h - 5, 4, 4], [-3, -h - 9, 3, 4], [2, -h - 10, 3, 5], [-7, -h - 1, 4, 2], [5, -h - 1, 4, 2]]
  hojas.forEach((q, i) => R(c, x + q[0] * s, y + q[1] * s, q[2], Math.max(2, q[3] * s), C.hoja[i % 3]))
}

export function archivero(c: Ctx, x: number, y: number) {
  R(c, x, y, 14, 26, C.metal); R(c, x, y, 14, 1, C.metalLuz)
  for (let i = 0; i < 3; i++) { R(c, x + 1, y + 2 + i * 8, 12, 7, '#525862'); R(c, x + 5, y + 5 + i * 8, 4, 1, C.metalLuz) }
}

const GLIFOS: Record<string, string[]> = {
  lineas: ['.........', 'XXXXXX...', '.........', 'XXXXXXXX.', '.........', 'XXXXX....', '.........'],
  play: ['..X......', '..XX.....', '..XXX....', '..XXXX...', '..XXX....', '..XX.....', '..X......'],
  barras: ['.......X.', '.......X.', '.....X.X.', '...X.X.X.', '.X.X.X.X.', '.X.X.X.X.', 'XXXXXXXXX'],
  chat: ['XXXXXXX..', 'X.....X..', 'X.XXX.X..', 'X.....X..', 'XXXXXXX..', '.X.......', 'X........'],
  mega: ['......X..', '....XXX..', 'XXXXXXX..', 'XXXXXXX..', '....XXX..', '......X..', '.........'],
  flujo: ['XX.....XX', 'XX.....XX', '..X...X..', '...XXX...', '...XXX...', '...XXX...', '.........'],
  plata: ['...XX....', '.XXXXXX..', '.XX......', '..XXXX...', '.....XX..', '.XXXXXX..', '...XX....'],
  check: ['........X', '.......XX', '......XX.', 'X....XX..', 'XX..XX...', '.XXXX....', '..XX.....'],
  foco: ['..XXXXX..', '.XX...XX.', '.X.....X.', '.XX...XX.', '..XX.XX..', '...XXX...', '...XXX...'],
  ojo: ['.........', '..XXXXX..', '.X..X..X.', 'X..XXX..X', '.X..X..X.', '..XXXXX..', '.........'],
  avion: ['X........', 'XXX......', 'XXXXX....', 'XXXXXXXXX', 'XXXXX....', 'XXX......', 'X........'],
  camara: ['...XX....', 'XXXXXXXX.', 'X..XX..X.', 'X.X..X.X.', 'X..XX..X.', 'XXXXXXXX.', '.........'],
  reloj: ['..XXXXX..', '.X..X..X.', 'X...X...X', 'X...XXX.X', 'X.......X', '.X.....X.', '..XXXXX..'],
  mapa: ['XX.XX.XX.', 'X.XX.XX.X', 'X..X..X.X', 'X.X.X.X.X', 'X..X..X.X', 'X.XX.XX.X', '.XX.XX.XX'],
  firma: ['XXXXXXX..', 'X.....X..', 'X.XXX.X..', 'X.....X..', 'X.XX..X..', 'X.....X.X', 'XXXXXXXXX'],
  sol: ['X..X..X..', '.X.X.X...', '..XXX....', 'XXXXXXX..', '..XXX....', '.X.X.X...', 'X..X..X..'],
}

export function pantallaPared(c: Ctx, x: number, y: number, glifo: string) {
  R(c, x - 1, y - 1, 46, 26, C.borde); R(c, x, y, 44, 24, C.marco); R(c, x + 2, y + 2, 40, 20, C.pantalla)
  const g = GLIFOS[glifo] || GLIFOS.lineas
  g.forEach((fila, j) => {
    for (let i = 0; i < 9; i++) if (fila[i] === 'X') R(c, x + 8 + i * 2, y + 5 + j * 2, 2, 2, j > 4 && glifo === 'barras' ? C.naranja : C.glifo)
  })
  R(c, x + 30, y + 6, 8, 1, '#9aa3ad'); R(c, x + 30, y + 9, 6, 1, '#9aa3ad'); R(c, x + 30, y + 12, 8, 1, '#9aa3ad')
}

export function escritorio(c: Ctx, x: number, y: number, w: number) {
  R(c, x, y, w, 5, C.madera); R(c, x, y, w, 1, '#dba46b'); R(c, x, y + 5, w, 13, C.maderaFrente); R(c, x, y + 17, w, 1, C.maderaSombra)
  R(c, x + 3, y + 7, 14, 9, C.metal); R(c, x + 4, y + 8, 12, 3, '#525862'); R(c, x + 4, y + 12, 12, 3, '#525862')
  R(c, x + 8, y + 9, 4, 1, C.metalLuz); R(c, x + 8, y + 13, 4, 1, C.metalLuz)
  R(c, x + w - 17, y + 7, 14, 9, C.metal); R(c, x + w - 16, y + 8, 12, 7, '#525862'); R(c, x + w - 12, y + 11, 4, 1, C.metalLuz)
  R(c, x + 6, y - 5, 5, 5, '#f4f4f4'); R(c, x + 11, y - 4, 1, 3, '#f4f4f4')
  R(c, x + w - 12, y - 4, 6, 4, '#3a3f48'); R(c, x + w - 11, y - 7, 1, 3, C.naranja); R(c, x + w - 8, y - 6, 1, 2, '#2f7fd6')
}

export function letrero(c: Ctx, x: number, y: number, w: number) {
  R(c, x - 1, y - 1, w + 2, 12, C.letreroBorde); R(c, x, y, w, 10, C.letrero); R(c, x + 4, y + 3, 4, 4, '#2fb34a')
}

export function sofa(c: Ctx, x: number, y: number) {
  R(c, x, y + 4, 44, 12, C.sofa); R(c, x + 2, y, 40, 7, C.sofaLuz); R(c, x - 2, y + 4, 5, 12, '#9c4a26'); R(c, x + 41, y + 4, 5, 12, '#9c4a26')
  R(c, x + 15, y + 2, 1, 5, '#9c4a26'); R(c, x + 29, y + 2, 1, 5, '#9c4a26'); R(c, x, y + 16, 3, 2, C.borde); R(c, x + 41, y + 16, 3, 2, C.borde)
}

export function mesita(c: Ctx, x: number, y: number) {
  R(c, x, y, 22, 4, '#3a3f48'); R(c, x + 2, y + 4, 2, 5, C.borde); R(c, x + 18, y + 4, 2, 5, C.borde)
  R(c, x + 4, y - 4, 4, 4, '#f4f4f4'); R(c, x + 12, y - 3, 4, 3, '#f4f4f4')
}

export function franjas(c: Ctx, x: number, y: number, w: number) {
  for (let i = 0; i < w; i += 6) R(c, x + i, y, 3, 3, C.naranja)
}

// ---- el fondo (lo que no se mueve) y los muebles, armados con la geometría del mundo ----

function sala(b: Ctx, s: Sala, glifo: string, RW: number, RH: number) {
  const x = s.rx, y = s.ry
  ladrillos(b, x, y, RW, 44); piso(b, x, y + 44, RW, RH - 44, C.piso, C.pisoLinea); R(b, x, y + 43, RW, 2, '#4a2a1d')
  if (s.abajo && s.col === 0) ventana(b, x + 9, y + 10, 16, 26)
  letrero(b, x + 30, y + 3, 60); pantallaPared(b, x + 44, y + 15, glifo); lampara(b, x + 106, y)
  R(b, x + 30, y + 70, 70, 22, C.naranja); R(b, x + 31, y + 71, 68, 20, C.alfombra)
  viga(b, x - 2, y, 4, RH); viga(b, x + RW - 2, y, 4, RH)
  if (s.abajo) {
    viga(b, x, y - 2, RW, 4); viga(b, x, y + RH - 2, 8, 4); viga(b, x + 30, y + RH - 2, RW - 30, 4)
    R(b, x + 8, y + RH - 1, 22, 2, C.naranja); R(b, x + 6, y + RH - 16, 2, 16, C.borde); R(b, x + 30, y + RH - 16, 2, 16, C.borde)
    R(b, x + 32, y + RH - 20, 4, 18, '#7a4a2a'); R(b, x + 33, y + RH - 19, 2, 16, '#9a6238'); R(b, x + 34, y + RH - 12, 1, 2, '#ffd27a')
  } else {
    viga(b, x, y - 2, 8, 4); viga(b, x + 30, y - 2, RW - 30, 4)
    piso(b, x + 8, y, 22, 46, C.pasillo, C.pasilloLinea); R(b, x + 8, y, 22, 6, '#6f7378')
    R(b, x + 6, y, 2, 45, C.borde); R(b, x + 30, y, 2, 45, C.borde); R(b, x + 6, y, 26, 3, C.borde)
    R(b, x + 32, y + 8, 4, 36, '#7a4a2a'); R(b, x + 33, y + 9, 2, 34, '#9a6238'); R(b, x + 34, y + 26, 1, 2, '#ffd27a')
    R(b, x + 9, y + 45, 20, 3, C.naranja)
  }
}

// glifoDe: el glifo de la pantalla de pared de cada oficina, por puesto (sin agente: «lineas»)
export function dibujarFondo(mundo: Mundo, glifoDe: (puesto: number) => string | undefined): HTMLCanvasElement {
  const { W, H, salas } = mundo
  const { M, HL, RW, RH, CH, AW, X0, AX, PAS } = mundo.medidas
  const f = document.createElement('canvas'); f.width = W; f.height = H
  const b = f.getContext('2d') as Ctx
  R(b, 0, 0, W, H, '#15171b')
  PAS.forEach((py) => {
    piso(b, M, py, AX - M, CH, C.pasillo, C.pasilloLinea); R(b, M, py + 1, AX - M, 3, '#6b717b'); R(b, M, py + 1, AX - M, 1, '#8b929c')
    franjas(b, X0 + 40, py + CH - 5, 40); R(b, X0 + 266, py + 4, 100, 18, '#cdbb9c'); R(b, X0 + 267, py + 5, 98, 16, '#d8c8aa')
  })
  piso(b, M, PAS[0], HL, PAS[1] - PAS[0] + CH, C.pasillo, C.pasilloLinea)
  R(b, M, M, HL, PAS[0] - M, '#24272c'); R(b, M, PAS[1] + CH, HL, H - M - PAS[1] - CH, '#24272c')
  salas.forEach((s) => sala(b, s, glifoDe(s.puesto) || 'lineas', RW, RH))
  const x = AX, y = M, h = H - 2 * M
  ladrillos(b, x, y, AW, 44); piso(b, x, y + 44, AW, h - 44, '#a3a5a8', '#939598'); R(b, x, y + 43, AW, 2, '#4a2a1d')
  ventana(b, x + 8, y + 10, 22, 26); ventana(b, x + AW - 30, y + 10, 22, 26); letrero(b, x + 36, y + 3, 78); pantallaPared(b, x + 53, y + 15, 'barras')
  R(b, x + 24, y + 92, 100, 60, C.naranja); R(b, x + 25, y + 93, 98, 58, '#5a3d32'); R(b, x + 10, y + 300, 120, 50, '#cdbb9c'); R(b, x + 11, y + 301, 118, 48, '#d8c8aa')
  viga(b, x - 2, y, 4, PAS[0] - y); viga(b, x - 2, PAS[0] + CH, 4, PAS[1] - PAS[0] - CH); viga(b, x - 2, PAS[1] + CH, 4, H - M - PAS[1] - CH)
  PAS.forEach((py) => R(b, x - 1, py + 6, 2, CH - 10, C.naranja))
  viga(b, M - 2, M - 2, W - 2 * M + 4, 4); viga(b, M - 2, H - M - 2, W - 2 * M + 4, 4); viga(b, M - 2, M, 4, H - 2 * M); viga(b, W - M - 2, M, 4, H - 2 * M)
  return f
}

export type Mueble = { y: number; f: (c: Ctx) => void }

// muebles que tapan o son tapados según quién está más abajo
export function listaMuebles(mundo: Mundo): Mueble[] {
  const L: Mueble[] = []
  const { M, AX, X0, PAS } = mundo.medidas
  mundo.salas.forEach((s) => {
    const x = s.rx, y = s.ry
    L.push({ y: y + 76, f: (c) => escritorio(c, x + 36, y + 58, 60) })
    L.push({ y: y + 74, f: (c) => archivero(c, x + 102, y + 48) })
    L.push({ y: y + 94, f: (c) => planta(c, x + 109, y + 94) })
  })
  PAS.forEach((py) => {
    L.push({ y: py + 21, f: (c) => sofa(c, X0 + 278, py + 3) })
    L.push({ y: py + 20, f: (c) => mesita(c, X0 + 330, py + 11) })
    L.push({ y: py + 21, f: (c) => planta(c, X0 + 361, py + 21, true) })
  })
  const x = AX, y = M
  L.push({ y: y + 62, f: (c) => { R(c, x + 66, y + 46, 20, 16, '#2b2f36'); R(c, x + 68, y + 40, 16, 8, '#3a3f48') } })
  L.push({ y: y + 84, f: (c) => escritorio(c, x + 36, y + 66, 80) })
  L.push({ y: y + 230, f: (c) => { R(c, x + 18, y + 216, 66, 6, '#d9a066'); R(c, x + 18, y + 216, 66, 1, '#efc08a'); R(c, x + 20, y + 222, 3, 8, C.borde); R(c, x + 79, y + 222, 3, 8, C.borde) } })
  L.push({ y: y + 396, f: (c) => sofa(c, x + 24, y + 378) })
  L.push({ y: y + 74, f: (c) => archivero(c, x + 126, y + 48) })
  ;[[x + 16, y + 456], [x + 132, y + 456], [x + 16, y + 280], [x + 132, y + 280]].forEach((p) => L.push({ y: p[1], f: (c) => planta(c, p[0], p[1]) }))
  return L
}
