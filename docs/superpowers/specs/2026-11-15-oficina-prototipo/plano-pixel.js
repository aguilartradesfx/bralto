/* plano-pixel.js · el plano visto desde arriba, en pixel art: áreas, caritas de cada Knox con su anillo de estado, nombre y qué hace */
(function (G) {
'use strict';
var W = 906, H = 476, COLS = 3, AREAS = ['Contenido', 'Publicación', 'Ideas y plan', 'Conversaciones', 'Oficina', 'Cuando pidas'];
var TINTE = { 'Contenido': '#1c2430', 'Publicación': '#182733', 'Ideas y plan': '#221d2e', 'Conversaciones': '#1a2a24', 'Oficina': '#2a221c', 'Cuando pidas': '#1f1f24' };
function crear(cv, equipo, textos, alTocar) {
  var arte = document.createElement('canvas'); arte.width = W; arte.height = H;
  var a = arte.getContext('2d'), c = cv.getContext('2d'), zonas = [], caras = [], COL = G.Loft.COL;
  var aw = (W - 24) / COLS, ah = (H - 18) / 2;
  AREAS.forEach(function (nom, i) {
    var x = 6 + (i % COLS) * (aw + 6), y = 6 + Math.floor(i / COLS) * (ah + 6), ks = equipo.filter(function (k) { return k.area === nom; });
    zonas.push({ nom: nom, x: Math.round(x), y: Math.round(y), w: Math.round(aw), h: Math.round(ah) });
    var por = ks.length > 4 ? 3 : 2, filas = Math.ceil(ks.length / por), dx = aw / por, dy = Math.min(92, (ah - 30) / filas);
    ks.forEach(function (k, j) { caras.push({ k: k, x: Math.round(x + dx * (j % por) + dx / 2), y: Math.round(y + 34 + dy * Math.floor(j / por)) }); });
  });
  function R(x, y, w, h, col) { a.fillStyle = col; a.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function marco(x, y, w, h, fondo, borde) { R(x + 2, y, w - 4, h, borde); R(x, y + 2, w, h - 4, borde); R(x + 2, y + 1, w - 4, h - 2, fondo); R(x + 1, y + 2, w - 2, h - 4, fondo); }
  function anillo(cx, cy, r, col, grosor) {
    for (var yy = -r - 1; yy <= r + 1; yy++) for (var xx = -r - 1; xx <= r + 1; xx++) {
      var d = Math.sqrt((xx + 0.5) * (xx + 0.5) + (yy + 0.5) * (yy + 0.5)); if (d <= r + 0.5 && d >= r + 0.5 - grosor) R(cx + xx, cy + yy, 1, 1, col);
    }
  }
  function dibujar(t) {
    R(0, 0, W, H, '#101317');
    zonas.forEach(function (z) { marco(z.x, z.y, z.w, z.h, TINTE[z.nom], '#2c333d'); });
    caras.forEach(function (f) {
      var k = f.k, on = { trabajando: 1, publicando: 1, listo: 1, fallo: 1 }[k.estado], col = COL[k.estado];
      var pulso = on && Math.floor(t * 1.6) % 2;
      if (on) { a.globalAlpha = pulso ? 0.28 : 0.16; anillo(f.x, f.y, 20, col, 4); a.globalAlpha = 1; }
      R(f.x - 15, f.y - 15, 30, 30, '#0d0f12');
      a.save(); a.beginPath(); a.rect(f.x - 15, f.y - 15, 30, 30); a.clip();
      a.globalAlpha = on ? 1 : (k.estado === 'pedido' ? 0.45 : 0.75);
      a.drawImage(G.KnoxSprite.sprite(k, { dormido: k.estado === 'descansando' }), 0, 0, 28, 26, f.x - 14, f.y - 14, 28, 26);
      a.restore(); a.globalAlpha = 1;
      anillo(f.x, f.y, 16, k.estado === 'pedido' ? '#4a4f57' : col, 2);
      R(f.x - 14, f.y + 21, 28, 4, '#262b33');
    });
    c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.clearRect(0, 0, cv.width, cv.height);
    var s = Math.min(cv.width / W, cv.height / H), ox = (cv.width - W * s) / 2, oy = (cv.height - H * s) / 2;
    c.drawImage(arte, 0, 0, W, H, ox, oy, W * s, H * s);
    c.textBaseline = 'middle';
    zonas.forEach(function (z) { c.textAlign = 'left'; c.fillStyle = '#8b95a5'; c.font = Math.round(8 * s) + 'px Silkscreen, monospace'; c.fillText(z.nom.toUpperCase(), ox + (z.x + 10) * s, oy + (z.y + 14) * s); });
    caras.forEach(function (f) {
      var k = f.k, on = { trabajando: 1, publicando: 1, listo: 1, fallo: 1 }[k.estado];
      c.textAlign = 'center'; c.fillStyle = on ? '#f3f4f6' : '#a1a1aa'; c.font = Math.round(7.5 * s) + 'px Silkscreen, monospace';
      c.fillText(k.nombre, ox + f.x * s, oy + (f.y + 33) * s);
      c.fillStyle = on ? COL[k.estado] : '#71717a'; c.font = Math.round(6 * s) + 'px Silkscreen, monospace';
      c.fillText(textos(k), ox + f.x * s, oy + (f.y + 43) * s);
    });
    return { s: s, ox: ox, oy: oy };
  }
  var geo = { s: 1, ox: 0, oy: 0 };
  function medir() {
    var p = cv.parentElement, d = G.devicePixelRatio || 1;
    cv.width = Math.max(1, Math.round(p.clientWidth * d)); cv.height = Math.max(1, Math.round(p.clientHeight * d));
    cv.style.width = p.clientWidth + 'px'; cv.style.height = p.clientHeight + 'px'; geo = dibujar(performance.now() / 1000);
  }
  medir(); G.addEventListener('resize', medir);
  setInterval(function () { if (cv.offsetParent) geo = dibujar(performance.now() / 1000); }, 300);
  cv.addEventListener('click', function (e) {
    var r = cv.getBoundingClientRect(), d = G.devicePixelRatio || 1, x = ((e.clientX - r.left) * d - geo.ox) / geo.s, y = ((e.clientY - r.top) * d - geo.oy) / geo.s, toco = null;
    caras.forEach(function (f) { if (Math.abs(x - f.x) < 34 && y > f.y - 22 && y < f.y + 48) toco = f.k; });
    alTocar(toco);
  });
  return { medir: medir };
}
G.PlanoPixel = { crear: crear };
})(window);
