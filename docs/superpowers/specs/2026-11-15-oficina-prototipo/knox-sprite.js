/* knox-sprite.js · Knox en pixel art (28x38) dibujado con figuras: tela tejida, ojos con párpado, cuernos y piezas */
(function (G) {
'use strict';
var SW = 28, SH = 38;
function tono(h, f) {
  var n = parseInt(h.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(function (v) {
    return Math.max(0, Math.min(255, Math.round(f <= 1 ? v * f : v + (255 - v) * (f - 1))));
  });
  return '#' + c.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
}
function hoja() { return new Array(SW * SH); }
function put(g, x, y, col) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < SW && y < SH) g[y * SW + x] = col; }
function elip(g, cx, cy, rx, ry, col) {
  for (var y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (var x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    var dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    if (dx * dx + dy * dy <= 1) put(g, x, y, typeof col === 'function' ? col(x, y) : col);
  }
}
function rect(g, x, y, w, h, col) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) put(g, x + i, y + j, typeof col === 'function' ? col(x + i, y + j) : col); }
function dentro(cx, cy, rx, ry, x, y) { var dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; return dx * dx + dy * dy <= 1; }
var cache = {};
function sprite(k, f) {
  f = f || {};
  var key = k.id + '|' + (f.paso || 0) + (f.tecleo ? 't' : '') + (f.dormido ? 'z' : '');
  if (cache[key]) return cache[key];
  var g = hoja(), tela = k.tela, rib = tono(tela, 0.9), osc = tono(tela, 0.72), ropa = k.ropa, ropaO = tono(ropa, 0.74), ropaL = tono(ropa, 1.14);
  var gorro = k.gorro || '#202128', gorroO = tono(gorro, 0.72), cuerno = '#f2eadc', cuernoO = '#d6c8b2', OJO = '#0b0b0e', NAR = '#ff7a2f';
  var tejido = function (x) { return x % 2 ? rib : tela; };
  // orejas (detrás de la cabeza)
  if (k.orejas === 'conejo') { elip(g, 4.2, 15, 2.6, 9, tejido); elip(g, 23.8, 15, 2.6, 9, tejido); elip(g, 4.4, 16, 1.1, 6, osc); elip(g, 23.6, 16, 1.1, 6, osc); }
  if (k.orejas === 'oso') { elip(g, 6, 4.6, 2.8, 2.8, tela); elip(g, 22, 4.6, 2.8, 2.8, tela); elip(g, 6, 4.8, 1.3, 1.3, osc); elip(g, 22, 4.8, 1.3, 1.3, osc); }
  if (k.orejas === 'gato') { for (var r = 0; r < 5; r++) { rect(g, 5, 1 + r, 1 + r, 1, tela); rect(g, 23 - r, 1 + r, 1 + r, 1, tela); } put(g, 6, 4, osc); put(g, 6, 5, osc); put(g, 21, 4, osc); put(g, 21, 5, osc); }
  if (k.cabeza === 'trenzas') [20, 23.3, 26.4].forEach(function (y, i) { elip(g, 3.4, y, 1.7 - i * 0.15, 1.8, osc); elip(g, 24.6, y, 1.7 - i * 0.15, 1.8, osc); });
  // cuerpo
  var arriba = f.tecleo ? 2 : 0;
  rect(g, 3, 24, 4, 6 - arriba, ropaO); rect(g, 21, 24, 4, 6 - arriba, ropaO);
  elip(g, 14, 24.5, 8.6, 3.6, ropa); rect(g, 6, 24, 16, 7, ropa); rect(g, 6, 30, 16, 1, ropaO); rect(g, 7, 24, 2, 5, ropaL);
  rect(g, 10, 27, 8, 3, ropaO); rect(g, 10, 27, 8, 1, tono(ropa, 0.65));
  elip(g, 4.6, 31 - arriba, 1.9, 1.7, tela); elip(g, 23.4, 31 - arriba, 1.9, 1.7, tela);
  var pl = f.paso === 1 ? 1 : 0, pr = f.paso === 2 ? 1 : 0, pant = k.pantalon || '#25272d';
  rect(g, 8, 31 - pl, 5, 4, pant); rect(g, 15, 31 - pr, 5, 4, pant); rect(g, 9, 32 - pl, 1, 2, tono(pant, 1.3)); rect(g, 16, 32 - pr, 1, 2, tono(pant, 1.3));
  rect(g, 7, 35 - pl, 6, 2, '#f5f5f7'); rect(g, 15, 35 - pr, 6, 2, '#f5f5f7'); put(g, 9, 36 - pl, NAR); put(g, 18, 36 - pr, NAR); rect(g, 7, 34 - pl, 6, 1, '#dfe2e6'); rect(g, 15, 34 - pr, 6, 1, '#dfe2e6');
  // cabeza tejida con puntitas en los cachetes
  elip(g, 14, 12.5, 10.5, 10, tejido);
  put(g, 3, 16, tela); put(g, 2, 17, tela); put(g, 24, 16, tela); put(g, 25, 17, tela);
  rect(g, 19, 19, 3, 2, NAR);
  // ojos: borde, ojo negro, párpado de sueño y brillo
  [9.6, 18.4].forEach(function (cx) {
    elip(g, cx, 14, 3.7, 4.3, osc);
    elip(g, cx, 14.4, 2.8, 3.4, OJO);
    for (var y = 9; y < 19; y++) for (var x = Math.floor(cx - 4); x <= Math.ceil(cx + 4); x++) {
      if (!dentro(cx, 14.4, 2.8, 3.4, x, y)) continue;
      if (y < 12.6 || (f.dormido && y < 16.4)) put(g, x, y, osc);
    }
    if (f.dormido) {
      for (var x2 = Math.floor(cx - 2.6); x2 <= Math.ceil(cx + 2.2); x2++) { if (dentro(cx, 14.4, 2.8, 3.4, x2, 16)) put(g, x2, 16, OJO); }
    } else { put(g, Math.round(cx - 1.6), 13, '#ffffff'); put(g, Math.round(cx - 1.6), 14, '#ffffff'); put(g, Math.round(cx + 1), 16, '#5d6470'); }
  });
  // cadena
  [[10, 23], [11, 24], [12, 25], [13, 25], [14, 25], [15, 25], [16, 24], [17, 23]].forEach(function (p) { put(g, p[0], p[1], '#d3d9e0'); });
  // gorros y peinados
  if (k.cabeza === 'bucket') { elip(g, 14, 8.6, 12.6, 2.4, gorro); elip(g, 14, 4.6, 8.6, 3.6, gorro); rect(g, 6, 4, 16, 4, gorro); rect(g, 6, 7, 16, 1, gorroO); [9, 14, 19].forEach(function (x) { put(g, x, 5, NAR); }); }
  if (k.cabeza === 'gorra') { elip(g, 14, 5, 9.2, 4, gorro); rect(g, 5, 5, 18, 3, gorro); rect(g, 15, 8, 12, 2, gorroO); put(g, 14, 2, gorroO); }
  if (k.cabeza === 'pompon') { elip(g, 14, 5.4, 10, 4.6, gorro); rect(g, 4, 7, 20, 3, gorroO); for (var i = 5; i < 24; i += 3) put(g, i, 8, NAR); elip(g, 14, 1.6, 2.4, 1.7, '#f5f5f7'); }
  if (k.cabeza === 'cresta') { rect(g, 12, 0, 4, 4, osc); put(g, 12, 0, undefined); put(g, 15, 0, undefined); rect(g, 13, 1, 2, 3, rib); }
  // cuernos (salen por encima del gorro)
  if (k.cabeza !== 'pompon') {
    elip(g, 8.4, 3.8, 1.8, 2.3, cuerno); elip(g, 7.3, 1.5, 1.1, 1.5, cuerno); put(g, 9, 4, cuernoO); put(g, 9, 5, cuernoO);
    elip(g, 19.6, 3.8, 1.8, 2.3, cuerno); elip(g, 20.7, 1.5, 1.1, 1.5, cuerno); put(g, 20, 4, cuernoO); put(g, 20, 5, cuernoO);
  }
  // cosas del oficio
  if (k.extra === 'lentes') { [5, 14].forEach(function (x0) { rect(g, x0, 10, 9, 1, '#1b1820'); rect(g, x0, 18, 9, 1, '#1b1820'); rect(g, x0, 10, 1, 9, '#1b1820'); rect(g, x0 + 8, 10, 1, 9, '#1b1820'); }); rect(g, 13, 13, 2, 1, '#1b1820'); }
  if (k.extra === 'audifonos') {
    for (var x3 = 5; x3 <= 22; x3++) { var t = (x3 + 0.5 - 14) / 10.5; put(g, x3, Math.round(12.5 - 10 * Math.sqrt(Math.max(0, 1 - t * t))) - 1, '#2c2f36'); }
    rect(g, 1, 11, 3, 6, '#2c2f36'); rect(g, 24, 11, 3, 6, '#2c2f36'); put(g, 2, 13, NAR); put(g, 25, 13, NAR);
  }
  if (k.extra === 'celular') { rect(g, 24, 27 - arriba, 3, 5, '#2c2f36'); rect(g, 25, 28 - arriba, 1, 3, '#7fd3ff'); }
  if (k.extra === 'megafono') { rect(g, 24, 26, 2, 3, NAR); rect(g, 26, 25, 2, 5, NAR); put(g, 27, 27, '#ffd27a'); }
  if (k.extra === 'libreta') { rect(g, 0, 27 - arriba, 4, 5, '#f5f5f7'); rect(g, 0, 27 - arriba, 4, 1, NAR); put(g, 1, 29 - arriba, '#9aa3ad'); }
  // contorno de un pixel
  var out = g.slice();
  for (var y4 = 0; y4 < SH; y4++) for (var x4 = 0; x4 < SW; x4++) {
    if (g[y4 * SW + x4]) continue;
    var v = (x4 > 0 && g[y4 * SW + x4 - 1]) || (x4 < SW - 1 && g[y4 * SW + x4 + 1]) || (y4 > 0 && g[(y4 - 1) * SW + x4]) || (y4 < SH - 1 && g[(y4 + 1) * SW + x4]);
    if (v) out[y4 * SW + x4] = '#1b1820';
  }
  var cv = document.createElement('canvas'); cv.width = SW; cv.height = SH; var c = cv.getContext('2d');
  for (var y5 = 0; y5 < SH; y5++) for (var x5 = 0; x5 < SW; x5++) { var col = out[y5 * SW + x5]; if (col) { c.fillStyle = col; c.fillRect(x5, y5, 1, 1); } }
  return (cache[key] = cv);
}
G.KnoxSprite = { sprite: sprite, W: SW, H: SH };
})(window);
