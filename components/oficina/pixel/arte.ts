// La oficina en pixel art dibujada con código (vista de frente, estilo loft): paleta, piezas, fondo y muebles.
// Abajo, la sala: el café (barra, cafetera y 4 bancos altos), la plática (sofá, 2 sillones y una mesita) y la siesta
// (sofá, 2 pufs y luz bajita), sobre piso de madera; se llega por el pasillo de la izquierda o por el paso de debajo de
// tu oficina.
import { CUPO, type Mundo, type Punto, type Sala } from '../../../lib/oficina/mundo'
import type { Rincon } from '../../../lib/oficina/tipos'

export type Ctx = CanvasRenderingContext2D

export const C = {
  ladrillo: ['#8a4a32', '#7d4129', '#94543a'], mortero: '#5a2f20', viga: '#3b3f46', vigaLuz: '#4b5059', remache: '#6b717b',
  borde: '#1f2226', piso: '#8d8f93', pisoLinea: '#7f8185', pasillo: '#9a9c9f', pasilloLinea: '#8b8d91',
  vidrio: '#c9dbe6', vidrioLuz: '#e8f1f6', marco: '#2b2f36', madera: '#c98a4b', maderaFrente: '#a86e39', maderaSombra: '#8d5a2d',
  metal: '#5b616b', metalLuz: '#7a818c', pantalla: '#eef2f5', glifo: '#2a2d33', naranja: '#e8792f', hoja: ['#2e6b2b', '#3f8f3a', '#58b04a'],
  maceta: '#c96b3c', alfombra: '#4e535b', letrero: '#f3e6cc', letreroBorde: '#3b2a1f', foco: '#ffd27a', sofa: '#b5592f', sofaLuz: '#c96b3c',
  // la sala
  tabla: ['#93633e', '#8a5b37', '#9d6b43'], junta: '#6a4325', cromo: '#c5ccd4', cromoOsc: '#8b939e', taza: '#f4f4f4', cafe: '#6b3e26',
  sofaBrazo: '#9c4a26', azul: '#4b5a7a', azulLuz: '#61719a', azulOsc: '#36415c', puf: '#c9a03c', pufLuz: '#dcb85a', pufOsc: '#9e7a26',
  cojin: '#f3e6cc', pizarra: '#26302b', tiza: '#e8eef6',
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

// ---- las piezas de la sala ----

// Piso de madera: tablas de 6 px con las juntas corridas
export function pisoMadera(c: Ctx, x: number, y: number, w: number, h: number) {
  for (let j = 0, f = 0; j < h; j += 6, f++) {
    const alto = Math.min(6, h - j)
    R(c, x, y + j, w, alto, C.tabla[f % 3])
    R(c, x, y + j, w, 1, C.junta)
    for (let i = ((f * 29) % 48) - 48; i < w; i += 48) if (i > 0) R(c, x + i, y + j, 1, alto, C.junta)
  }
}

// Un rótulo de crema, sin el bombillo de las oficinas (las letras van en la capa de textos)
function rotulo(c: Ctx, x: number, y: number, w: number) {
  R(c, x - 1, y - 1, w + 2, 12, C.letreroBorde); R(c, x, y, w, 10, C.letrero)
}

// Lámpara que cuelga del techo
function colgante(c: Ctx, x: number, y: number, largo: number) {
  R(c, x, y, 1, largo, C.borde); R(c, x - 4, y + largo, 9, 3, C.marco); R(c, x - 3, y + largo, 7, 1, C.metal); R(c, x - 2, y + largo + 3, 5, 1, C.foco)
}

// Lámpara de pie (y: el piso)
function lamparaPie(c: Ctx, x: number, y: number, alto: number) {
  R(c, x - 4, y - 2, 9, 2, C.marco); R(c, x, y - alto, 1, alto - 2, C.borde)
  R(c, x - 5, y - alto - 8, 11, 8, '#e9d9b6'); R(c, x - 4, y - alto - 8, 9, 1, C.letrero); R(c, x - 5, y - alto - 1, 11, 1, '#c9b48a')
}

// La barra del café contra la pared, con la cafetera a la izquierda y unas tazas (y: el borde de arriba)
function barra(c: Ctx, x: number, y: number, w: number) {
  R(c, x, y, w, 5, C.madera); R(c, x, y, w, 1, '#dba46b'); R(c, x, y + 5, w, 15, C.maderaFrente); R(c, x, y + 19, w, 1, C.maderaSombra)
  for (let i = x + 30; i < x + w - 24; i += 34) { R(c, i, y + 8, 26, 9, C.maderaSombra); R(c, i + 1, y + 9, 24, 7, '#b0763f') }
  const cx = x + 3
  R(c, cx + 2, y - 22, 16, 3, C.metal); R(c, cx + 3, y - 25, 4, 3, C.taza); R(c, cx + 9, y - 25, 4, 3, '#e7d3b0')
  R(c, cx, y - 19, 20, 19, C.cromoOsc); R(c, cx + 1, y - 18, 18, 17, C.cromo); R(c, cx + 2, y - 16, 16, 5, C.marco)
  R(c, cx + 4, y - 15, 2, 2, C.naranja); R(c, cx + 8, y - 15, 2, 2, '#22c55e'); R(c, cx + 12, y - 15, 4, 1, '#9aa3ad')
  R(c, cx + 4, y - 9, 12, 2, C.marco); R(c, cx + 6, y - 7, 2, 3, C.marco); R(c, cx + 12, y - 7, 2, 3, C.marco)
  R(c, cx + 7, y - 3, 5, 3, C.taza); R(c, cx + 7, y - 3, 5, 1, C.cafe)
  for (const tx of [x + 50, x + 92, x + 128]) { R(c, tx, y - 3, 4, 3, C.taza); R(c, tx, y - 3, 4, 1, C.cafe); R(c, tx + 4, y - 2, 1, 1, C.taza) }
}

// Repisa con tazas en la pared
function repisa(c: Ctx, x: number, y: number, w: number) {
  R(c, x, y, w, 2, C.maderaFrente); R(c, x, y + 2, w, 1, C.maderaSombra); R(c, x + 2, y + 3, 1, 3, C.borde); R(c, x + w - 3, y + 3, 1, 3, C.borde)
  for (let i = x + 3, n = 0; i < x + w - 6; i += 9, n++) { R(c, i, y - 4, 5, 4, n % 3 === 1 ? '#e7d3b0' : C.taza); R(c, i + 5, y - 3, 1, 2, C.taza) }
}

// La pizarra del menú, con su taza de tiza (la palabra «CAFÉ» va en la capa de textos)
function pizarra(c: Ctx, x: number, y: number, w: number, h: number) {
  R(c, x - 2, y - 2, w + 4, h + 4, C.maderaSombra); R(c, x - 1, y - 1, w + 2, h + 2, C.madera); R(c, x, y, w, h, C.pizarra)
  R(c, x + 4, y + h - 9, w - 20, 1, '#6f7d76'); R(c, x + 4, y + h - 5, w - 26, 1, '#6f7d76')
  const tx = x + w - 13, ty = y + h - 10
  R(c, tx, ty, 7, 6, C.tiza); R(c, tx + 1, ty, 5, 4, C.pizarra); R(c, tx + 7, ty + 1, 2, 1, C.tiza); R(c, tx + 8, ty + 2, 1, 2, C.tiza)
  R(c, tx + 2, ty - 4, 1, 2, '#9aa3ad'); R(c, tx + 4, ty - 5, 1, 2, '#9aa3ad')
}

// Un cuadro con cerros y sol, y otro de noche con luna y estrellas
function cuadro(c: Ctx, x: number, y: number) {
  R(c, x - 1, y - 1, 26, 18, C.maderaSombra); R(c, x, y, 24, 16, '#9fd3f5'); R(c, x + 16, y + 3, 4, 4, C.foco)
  R(c, x, y + 10, 24, 6, '#3f8f3a'); R(c, x + 3, y + 7, 9, 3, '#58b04a'); R(c, x + 5, y + 6, 5, 1, '#58b04a')
}
function cuadroNoche(c: Ctx, x: number, y: number) {
  R(c, x - 1, y - 1, 22, 16, C.marco); R(c, x, y, 20, 14, '#1d2340')
  R(c, x + 11, y + 3, 6, 6, C.cojin); R(c, x + 13, y + 2, 5, 5, '#1d2340')
  for (const [dx, dy] of [[3, 3], [7, 8], [4, 11], [16, 11]]) R(c, x + dx, y + dy, 1, 1, C.foco)
}

// Ventana con la persiana abajo (para la siesta)
function persiana(c: Ctx, x: number, y: number, w: number, h: number) {
  R(c, x - 1, y - 1, w + 2, h + 2, C.marco); R(c, x, y, w, h, '#d8c8aa')
  for (let j = 1; j < h; j += 3) R(c, x, y + j, w, 1, '#b9a988')
  R(c, x + w - 5, y + h, 1, 5, C.borde); R(c, x + w - 6, y + h + 5, 3, 2, C.borde)
}

type Tela = { base: string; luz: string; brazo: string }
const ROJO: Tela = { base: C.sofa, luz: C.sofaLuz, brazo: C.sofaBrazo }
const AZUL: Tela = { base: C.azul, luz: C.azulLuz, brazo: C.azulOsc }

// Sofás y sillones: el respaldo y los cojines van detrás de quien se sienta; el frente del asiento y los brazos, delante
// (le tapan las piernas). x, w: el asiento; y: los pies de quien se sienta.
function sofaAtras(c: Ctx, x: number, y: number, w: number, t: Tela, puestos: number) {
  R(c, x, y - 24, w, 15, t.base); R(c, x + 1, y - 24, w - 2, 2, t.luz)
  for (let i = 1; i < puestos; i++) R(c, x + Math.round((w * i) / puestos), y - 21, 1, 11, t.brazo)
  R(c, x, y - 9, w, 4, t.luz)
}
function sofaFrente(c: Ctx, x: number, y: number, w: number, t: Tela) {
  R(c, x, y - 6, w, 7, t.base); R(c, x, y - 6, w, 1, t.luz)
  R(c, x - 5, y - 17, 6, 18, t.brazo); R(c, x + w - 1, y - 17, 6, 18, t.brazo); R(c, x - 5, y - 17, 6, 1, t.luz); R(c, x + w - 1, y - 17, 6, 1, t.luz)
  R(c, x - 3, y + 1, 3, 2, C.borde); R(c, x + w, y + 1, 3, 2, C.borde)
}

// El banco alto del café: se dibuja delante de quien se sienta, así el asiento le tapa la cadera (y: el piso)
function banco(c: Ctx, x: number, y: number) {
  R(c, x - 7, y - 14, 14, 3, C.naranja); R(c, x - 7, y - 14, 14, 1, '#ff9a5c'); R(c, x - 6, y - 11, 12, 1, '#a8501c')
  R(c, x - 1, y - 10, 2, 9, C.cromoOsc); R(c, x, y - 10, 1, 9, C.cromo); R(c, x - 4, y - 6, 8, 1, C.cromoOsc)
  R(c, x - 5, y - 2, 10, 2, C.marco); R(c, x - 4, y - 2, 8, 1, C.metal)
}

// El puf: un cojín grande, redondo y bajito, con su costura (y: el piso)
function puf(c: Ctx, x: number, y: number) {
  R(c, x - 5, y - 14, 10, 1, C.pufLuz); R(c, x - 8, y - 13, 16, 1, C.pufLuz); R(c, x - 10, y - 12, 20, 2, C.pufLuz)
  R(c, x - 11, y - 10, 22, 6, C.puf); R(c, x - 11, y - 4, 22, 2, C.pufOsc); R(c, x - 10, y - 2, 20, 1, C.pufOsc); R(c, x - 8, y - 1, 16, 1, '#7d6020')
  R(c, x - 7, y - 12, 4, 1, '#f0d27e'); R(c, x, y - 13, 1, 9, C.pufOsc)
}

// Dónde y cómo se sienta cada uno: en el café, en un banco alto; en la siesta, el del sofá se acuesta; los demás, en
// sillones, sofá o pufs, con las piernas tapadas por el mueble
export type Postura = 'banco' | 'sentado' | 'acostado'
export function posturaSala(r: Rincon, i: number): Postura {
  return r === 'cafe' ? 'banco' : r === 'siesta' && i === 0 ? 'acostado' : 'sentado'
}
// Cuánto sube quien se sienta en un banco
export const ALTO_BANCO = 7
// Quien se acuesta en el sofá, contado desde su sitio: la cabeza arriba a la izquierda (28 x 24) y la cobija a la
// derecha; x, y, w, h: todo su dibujo (para tocarlo)
export const ACOSTADO = { x: -32, y: -31, w: 68, h: 29 }
// Su cabeza derechita contra el cojín, con los ojos cerrados, y el resto tapado con la cobija, que sube y baja al
// respirar (respira: 0 o 1). x, y: su sitio; spr: su dibujo.
export function acostado(c: Ctx, spr: CanvasImageSource, x: number, y: number, respira: number) {
  c.drawImage(spr, 0, 0, 28, 24, x + ACOSTADO.x, y + ACOSTADO.y, 28, 24)
  const bx = x - 10, by = y - 19 + respira, w = 46, h = 18 - respira
  R(c, bx + 6, by, w - 12, 1, '#b4b9ea'); R(c, bx + 2, by + 1, w - 4, 2, '#9ea4e0'); R(c, bx, by + 3, w, h - 3, '#7c83c9')
  R(c, bx + w - 12, by - 2, 8, 2, '#9ea4e0') // los pies hacen bulto
  for (let i = bx + 5; i < bx + w - 3; i += 8) R(c, i, by + 4, 2, h - 4, '#6a70b3')
  R(c, bx, by + 3, 1, h - 3, '#5a6099'); R(c, bx + w - 1, by + 3, 1, h - 3, '#5a6099')
}

export type Luz = { x: number; y: number; r: number; alfa: number }
// Las luces de la sala de día: las colgantes del café, la lámpara de la plática y la bajita de la siesta
export function lucesSala(mundo: Mundo): { luces: Luz[]; siesta: Luz } {
  const s = mundo.sala, cafe = mundo.rincon('cafe'), pla = mundo.rincon('platica'), sie = mundo.rincon('siesta')
  return {
    luces: [
      { x: cafe.x + 64, y: s.y + 13, r: 16, alfa: 0.13 }, { x: cafe.x + 144, y: s.y + 13, r: 16, alfa: 0.13 },
      { x: pla.x + 22, y: s.y + 16, r: 17, alfa: 0.13 },
    ],
    siesta: { x: sie.x + 22, y: s.y + 36, r: 22, alfa: 0.2 },
  }
}

// El fondo de la sala (lo que no tapa a nadie): pared, piso, rótulo, cuadros, la barra y los respaldos
function fondoSala(b: Ctx, mundo: Mundo) {
  const s = mundo.sala, pared = 40, suelo = s.y + pared
  const cafe = mundo.rincon('cafe'), pla = mundo.rincon('platica'), sie = mundo.rincon('siesta')
  ladrillos(b, s.x, s.y, s.w, pared); R(b, s.x, suelo - 1, s.w, 2, '#4a2a1d')
  pisoMadera(b, s.x, suelo + 1, s.w, s.y + s.h - suelo - 1)
  ;[cafe.x, pla.x, sie.x, s.x + s.w].forEach((x) => viga(b, x - 2, s.y, 4, pared))

  // el café: repisa, lámparas colgantes, la pizarra del menú y la barra con su cafetera
  repisa(b, cafe.x + 64, s.y + 20, 72)
  colgante(b, cafe.x + 64, s.y + 1, 8); colgante(b, cafe.x + 144, s.y + 1, 8)
  pizarra(b, cafe.x + 190, s.y + 6, 42, 24)
  barra(b, cafe.x + 10, suelo - 4, 186)

  // la plática: el rótulo, un cuadro, la alfombra y los respaldos del sofá y de los sillones
  const sofa = [mundo.sitio('platica', 2), mundo.sitio('platica', 3)]
  rotulo(b, sofa[0][0] - 34, s.y + 3, sofa[1][0] - sofa[0][0] + 68)
  cuadro(b, pla.x + 186, s.y + 12)
  R(b, pla.x + 46, s.y + 64, 148, 24, C.naranja); R(b, pla.x + 47, s.y + 65, 146, 22, '#5a3d32')
  sofaAtras(b, sofa[0][0] - 18, sofa[0][1], sofa[1][0] - sofa[0][0] + 36, ROJO, 2)
  ;[0, 1].forEach((i) => { const p = mundo.sitio('platica', i); sofaAtras(b, p[0] - 11, p[1], 22, ROJO, 1) })

  // la siesta: la ventana con la persiana abajo, un cuadro de noche, la alfombra y el sofá con su cojín
  const cama = mundo.sitio('siesta', 0)
  persiana(b, sie.x + 140, s.y + 8, 56, 22)
  cuadroNoche(b, cama[0] - 10, s.y + 8)
  R(b, sie.x + 128, s.y + 70, 90, 18, '#3a4466'); R(b, sie.x + 129, s.y + 71, 88, 16, '#2a3150')
  sofaAtras(b, cama[0] - 36, cama[1], 72, AZUL, 1)
  // el cojín, parado contra el brazo del sofá
  R(b, cama[0] - 36, cama[1] - 21, 9, 15, C.cojin); R(b, cama[0] - 36, cama[1] - 21, 9, 1, '#fff7e6'); R(b, cama[0] - 28, cama[1] - 20, 1, 14, '#d9c9a8')
}

// Lo de la sala que va delante de quien se sienta (le tapa las piernas o la cadera): los bancos, el frente de sillones
// y sofás, los pufs y la mesita; y las lámparas y las matas, cada una en su orden por los pies
function mueblesSala(mundo: Mundo): Mueble[] {
  const L: Mueble[] = [], s = mundo.sala, suelo = s.y + 40
  const cafe = mundo.rincon('cafe'), pla = mundo.rincon('platica'), sie = mundo.rincon('siesta')
  const at = (p: Punto, f: (c: Ctx, x: number, y: number) => void) => L.push({ y: p[1] + 0.5, f: (c) => f(c, p[0], p[1]) })
  for (let i = 0; i < CUPO.cafe; i++) at(mundo.sitio('cafe', i), banco)
  ;[0, 1].forEach((i) => at(mundo.sitio('platica', i), (c, x, y) => sofaFrente(c, x - 11, y, 22, ROJO)))
  const sofa = [mundo.sitio('platica', 2), mundo.sitio('platica', 3)]
  at(sofa[0], (c, x, y) => sofaFrente(c, x - 18, y, sofa[1][0] - x + 36, ROJO))
  const mx = Math.round((sofa[0][0] + sofa[1][0]) / 2) - 11
  L.push({ y: suelo + 35, f: (c) => mesita(c, mx, suelo + 26) })
  at(mundo.sitio('siesta', 0), (c, x, y) => sofaFrente(c, x - 36, y, 72, AZUL))
  for (let i = 1; i < CUPO.siesta; i++) at(mundo.sitio('siesta', i), puf)
  L.push({ y: suelo + 16, f: (c) => lamparaPie(c, pla.x + 22, suelo + 16, 36) })
  L.push({ y: suelo + 18, f: (c) => lamparaPie(c, sie.x + 22, suelo + 18, 18) })
  for (const x of [cafe.x + 222, pla.x + 228, sie.x + 228]) L.push({ y: suelo + 18, f: (c) => planta(c, x, suelo + 18) })
  // las matas del paso de debajo de tu oficina
  const { AX, AW } = mundo.medidas
  for (const x of [AX + 17, AX + AW - 17]) L.push({ y: s.y + 24, f: (c) => planta(c, x, s.y + 24) })
  return L
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
  const { M, HL, RW, RH, CH, AW, X0, AX, PAS, HO, PUERTA } = mundo.medidas
  const s = mundo.sala
  const f = document.createElement('canvas'); f.width = W; f.height = H
  const b = f.getContext('2d') as Ctx
  R(b, 0, 0, W, H, '#15171b')
  PAS.forEach((py) => {
    piso(b, M, py, AX - M, CH, C.pasillo, C.pasilloLinea); R(b, M, py + 1, AX - M, 3, '#6b717b'); R(b, M, py + 1, AX - M, 1, '#8b929c')
    franjas(b, X0 + 40, py + CH - 5, 40); R(b, X0 + 266, py + 4, 100, 18, '#cdbb9c'); R(b, X0 + 267, py + 5, 98, 16, '#d8c8aa')
  })
  // el pasillo de la izquierda baja junto a la fila de abajo hasta la sala
  piso(b, M, PAS[0], HL, s.y + s.h - PAS[0], C.pasillo, C.pasilloLinea)
  R(b, M, M, HL, PAS[0] - M, '#24272c')
  salas.forEach((sa) => sala(b, sa, glifoDe(sa.puesto) || 'lineas', RW, RH))
  const x = AX, y = M, h = HO - M
  ladrillos(b, x, y, AW, 44); piso(b, x, y + 44, AW, h - 44, '#a3a5a8', '#939598'); R(b, x, y + 43, AW, 2, '#4a2a1d')
  ventana(b, x + 8, y + 10, 22, 26); ventana(b, x + AW - 30, y + 10, 22, 26); letrero(b, x + 36, y + 3, 78); pantallaPared(b, x + 53, y + 15, 'barras')
  R(b, x + 24, y + 92, 100, 60, C.naranja); R(b, x + 25, y + 93, 98, 58, '#5a3d32'); R(b, x + 10, y + 300, 120, 50, '#cdbb9c'); R(b, x + 11, y + 301, 118, 48, '#d8c8aa')
  viga(b, x - 2, y, 4, PAS[0] - y); viga(b, x - 2, PAS[0] + CH, 4, PAS[1] - PAS[0] - CH); viga(b, x - 2, PAS[1] + CH, 4, HO - PAS[1] - CH)
  PAS.forEach((py) => R(b, x - 1, py + 6, 2, CH - 10, C.naranja))

  // abajo: debajo de tu oficina, el paso con su alfombra, y la sala
  piso(b, AX, s.y, AW, s.h, C.pasillo, C.pasilloLinea)
  R(b, AX + 40, s.y + 40, 70, 40, '#cdbb9c'); R(b, AX + 41, s.y + 41, 68, 38, '#d8c8aa')
  fondoSala(b, mundo)
  // la viga entre las oficinas y la sala, con la puerta del fondo de tu oficina
  const [px, pw] = PUERTA
  viga(b, X0 - 2, HO - 1, px - 4 - (X0 - 2), 8); viga(b, px + pw + 4, HO - 1, W - M + 2 - (px + pw + 4), 8)
  R(b, px - 2, HO - 1, pw + 4, 8, C.pasillo); R(b, px, HO - 1, pw, 2, C.naranja)
  R(b, px - 4, HO - 16, 2, 22, C.borde); R(b, px + pw + 2, HO - 16, 2, 22, C.borde)
  R(b, px + pw + 4, HO - 20, 4, 18, '#7a4a2a'); R(b, px + pw + 5, HO - 19, 2, 16, '#9a6238'); R(b, px + pw + 6, HO - 12, 1, 2, '#ffd27a')
  R(b, px, s.y + 3, pw, 3, '#3a3f48')

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
  return L.concat(mueblesSala(mundo))
}
