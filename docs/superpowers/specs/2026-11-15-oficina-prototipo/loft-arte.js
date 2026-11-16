/* loft-arte.js · la oficina en pixel art dibujada con código (vista de frente, estilo loft) */
(function (G) {
'use strict';
var C = {
  ladrillo: ['#8a4a32', '#7d4129', '#94543a'], mortero: '#5a2f20', viga: '#3b3f46', vigaLuz: '#4b5059', remache: '#6b717b',
  borde: '#1f2226', piso: '#8d8f93', pisoLinea: '#7f8185', pasillo: '#9a9c9f', pasilloLinea: '#8b8d91',
  vidrio: '#c9dbe6', vidrioLuz: '#e8f1f6', marco: '#2b2f36', madera: '#c98a4b', maderaFrente: '#a86e39', maderaSombra: '#8d5a2d',
  metal: '#5b616b', metalLuz: '#7a818c', pantalla: '#eef2f5', glifo: '#2a2d33', naranja: '#e8792f', hoja: ['#2e6b2b', '#3f8f3a', '#58b04a'],
  maceta: '#c96b3c', alfombra: '#4e535b', letrero: '#f3e6cc', letreroBorde: '#3b2a1f', foco: '#ffd27a', sofa: '#b5592f', sofaLuz: '#c96b3c'
};
function R(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function ladrillos(c, x, y, w, h) {
  R(c, x, y, w, h, C.mortero);
  for (var fy = 0, f = 0; fy < h; fy += 5, f++) {
    for (var fx = (f % 2) * -5; fx < w; fx += 10) {
      var x0 = Math.max(x, x + fx), x1 = Math.min(x + w, x + fx + 9);
      if (x1 > x0) R(c, x0, y + fy, x1 - x0, Math.min(4, h - fy), C.ladrillo[(fx + f * 7) % 3 === 0 ? 1 : (fx + f) % 5 === 0 ? 2 : 0]);
    }
  }
}
function piso(c, x, y, w, h, base, linea) {
  R(c, x, y, w, h, base);
  for (var i = 0; i < w; i += 16) R(c, x + i, y, 1, h, linea);
  for (var j = 0; j < h; j += 12) R(c, x, y + j, w, 1, linea);
}
function viga(c, x, y, w, h) {
  R(c, x, y, w, h, C.viga); R(c, x, y, w, 1, C.vigaLuz); R(c, x, y + h - 1, w, 1, C.borde);
  var largo = Math.max(w, h);
  for (var k = 4; k < largo - 2; k += 18) {
    if (w > h) R(c, x + k, y + Math.floor(h / 2) - 1, 2, 2, C.remache); else R(c, x + Math.floor(w / 2) - 1, y + k, 2, 2, C.remache);
  }
}
function ventana(c, x, y, w, h) {
  R(c, x - 1, y - 1, w + 2, h + 2, C.marco); R(c, x, y, w, h, C.vidrio);
  for (var i = 0; i < w; i += 6) R(c, x + i, y, 1, h, C.marco);
  R(c, x, y + Math.floor(h / 2), w, 1, C.marco); R(c, x + 2, y + 2, 2, h - 4, C.vidrioLuz);
}
function lampara(c, x, y) {
  R(c, x, y, 1, 6, C.borde); R(c, x - 5, y + 6, 11, 3, C.marco); R(c, x - 4, y + 5, 9, 1, C.metal); R(c, x - 2, y + 9, 5, 1, C.foco);
}
function planta(c, x, y, chica) {
  var s = chica ? 0.6 : 1, w = Math.round(10 * s), h = Math.round(9 * s);
  R(c, x - w / 2, y - h, w, h, C.maceta); R(c, x - w / 2, y - h, w, 2, '#e08552');
  var hojas = [[0, -h - 6, 3, 8], [-5, -h - 4, 4, 4], [4, -h - 5, 4, 4], [-3, -h - 9, 3, 4], [2, -h - 10, 3, 5], [-7, -h - 1, 4, 2], [5, -h - 1, 4, 2]];
  hojas.forEach(function (q, i) { R(c, x + q[0] * s, y + q[1] * s, q[2], Math.max(2, q[3] * s), C.hoja[i % 3]); });
}
function archivero(c, x, y) {
  R(c, x, y, 14, 26, C.metal); R(c, x, y, 14, 1, C.metalLuz);
  for (var i = 0; i < 3; i++) { R(c, x + 1, y + 2 + i * 8, 12, 7, '#525862'); R(c, x + 5, y + 5 + i * 8, 4, 1, C.metalLuz); }
}
var GLIFOS = {
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
  sol: ['X..X..X..', '.X.X.X...', '..XXX....', 'XXXXXXX..', '..XXX....', '.X.X.X...', 'X..X..X..']
};
function pantallaPared(c, x, y, glifo) {
  R(c, x - 1, y - 1, 46, 26, C.borde); R(c, x, y, 44, 24, C.marco); R(c, x + 2, y + 2, 40, 20, C.pantalla);
  var g = GLIFOS[glifo] || GLIFOS.lineas;
  g.forEach(function (fila, j) { for (var i = 0; i < 9; i++) if (fila[i] === 'X') R(c, x + 8 + i * 2, y + 5 + j * 2, 2, 2, j > 4 && glifo === 'barras' ? C.naranja : C.glifo); });
  R(c, x + 30, y + 6, 8, 1, '#9aa3ad'); R(c, x + 30, y + 9, 6, 1, '#9aa3ad'); R(c, x + 30, y + 12, 8, 1, '#9aa3ad');
}
function escritorio(c, x, y, w) {
  R(c, x, y, w, 5, C.madera); R(c, x, y, w, 1, '#dba46b'); R(c, x, y + 5, w, 13, C.maderaFrente); R(c, x, y + 17, w, 1, C.maderaSombra);
  R(c, x + 3, y + 7, 14, 9, C.metal); R(c, x + 4, y + 8, 12, 3, '#525862'); R(c, x + 4, y + 12, 12, 3, '#525862');
  R(c, x + 8, y + 9, 4, 1, C.metalLuz); R(c, x + 8, y + 13, 4, 1, C.metalLuz);
  R(c, x + w - 17, y + 7, 14, 9, C.metal); R(c, x + w - 16, y + 8, 12, 7, '#525862'); R(c, x + w - 12, y + 11, 4, 1, C.metalLuz);
  R(c, x + 6, y - 5, 5, 5, '#f4f4f4'); R(c, x + 11, y - 4, 1, 3, '#f4f4f4');
  R(c, x + w - 12, y - 4, 6, 4, '#3a3f48'); R(c, x + w - 11, y - 7, 1, 3, C.naranja); R(c, x + w - 8, y - 6, 1, 2, '#2f7fd6');
}
function letrero(c, x, y, w) { R(c, x - 1, y - 1, w + 2, 12, C.letreroBorde); R(c, x, y, w, 10, C.letrero); R(c, x + 4, y + 3, 4, 4, '#2fb34a'); }
function sofa(c, x, y) {
  R(c, x, y + 4, 44, 12, C.sofa); R(c, x + 2, y, 40, 7, C.sofaLuz); R(c, x - 2, y + 4, 5, 12, '#9c4a26'); R(c, x + 41, y + 4, 5, 12, '#9c4a26');
  R(c, x + 15, y + 2, 1, 5, '#9c4a26'); R(c, x + 29, y + 2, 1, 5, '#9c4a26'); R(c, x, y + 16, 3, 2, C.borde); R(c, x + 41, y + 16, 3, 2, C.borde);
}
function mesita(c, x, y) { R(c, x, y, 22, 4, '#3a3f48'); R(c, x + 2, y + 4, 2, 5, C.borde); R(c, x + 18, y + 4, 2, 5, C.borde); R(c, x + 4, y - 4, 4, 4, '#f4f4f4'); R(c, x + 12, y - 3, 4, 3, '#f4f4f4'); }
function franjas(c, x, y, w) { for (var i = 0; i < w; i += 6) R(c, x + i, y, 3, 3, C.naranja); }
G.LoftArte = { C: C, R: R, ladrillos: ladrillos, piso: piso, viga: viga, ventana: ventana, lampara: lampara, planta: planta,
  archivero: archivero, pantallaPared: pantallaPared, escritorio: escritorio, letrero: letrero, sofa: sofa, mesita: mesita, franjas: franjas };
})(window);
