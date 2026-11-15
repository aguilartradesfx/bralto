/* loft-vista.js · mueve a los Knox por rutas reales, los dibuja en orden y deja ver la oficina como un mapa */
(function (G) {
'use strict';
var S = G.KnoxSprite;
var COL = { trabajando: '#22c55e', publicando: '#38bdf8', listo: '#ff7a2f', fallo: '#ef4444', descansando: '#8b93a1', pedido: '#5b616b' };
function crear(cv, equipo, alTocar, alAvisar) {
  var mundo = G.LoftMundo.crear(equipo), W = mundo.W, H = mundo.H, porId = mundo.porId;
  var arte = document.createElement('canvas'); arte.width = W; arte.height = H;
  var a = arte.getContext('2d'), c = cv.getContext('2d'), fondo = mundo.fondo(), muebles = mundo.muebles();
  var jefe = { id: 'ale', bandeja: 0 }; porId.ale = jefe;
  equipo.forEach(function (k) { k.pos = k.sala.asiento.slice(); k.modo = 'quieto'; k.dir = 1; k.espera = 0; });
  // cámara: arranca viendo todo; la rueda o los dedos acercan, y se arrastra como un mapa
  var cam = { s: 1, ox: 0, oy: 0, lista: false }, minS = 1, dpr = 1;
  function limitar() {
    cam.s = Math.max(minS, Math.min(minS * 5, cam.s));
    var vw = cv.width / cam.s, vh = cv.height / cam.s;
    cam.ox = vw >= W ? (W - vw) / 2 : Math.max(0, Math.min(W - vw, cam.ox));
    cam.oy = vh >= H ? (H - vh) / 2 : Math.max(0, Math.min(H - vh, cam.oy));
  }
  function verTodo() { cam.s = minS; limitar(); }
  function medir() {
    var p = cv.parentElement; dpr = G.devicePixelRatio || 1;
    var enTodo = !cam.lista || cam.s <= minS * 1.001;
    cv.width = Math.max(1, Math.round(p.clientWidth * dpr)); cv.height = Math.max(1, Math.round(p.clientHeight * dpr));
    cv.style.width = p.clientWidth + 'px'; cv.style.height = p.clientHeight + 'px';
    minS = Math.min(cv.width / W, cv.height / H); cam.lista = true;
    if (enTodo) verTodo(); else limitar();
  }
  function zoom(f, px, py) {
    var wx = cam.ox + px / cam.s, wy = cam.oy + py / cam.s;
    cam.s *= f; limitar(); cam.ox = wx - px / cam.s; cam.oy = wy - py / cam.s; limitar();
  }
  medir(); G.addEventListener('resize', medir);
  // caminar: ruta real, ceder el paso, conversar y volver
  function iniciar(ev) {
    var k = porId[ev.de], d = porId[ev.a]; if (!k || !d || k.modo !== 'quieto') return;
    k.camino = mundo.ruta(k.pos, d.id === 'ale' ? mundo.PARA_TI : d.sala.visita); k.paso = 0; k.modo = 'ida'; k.ev = ev; k.dest = d;
  }
  function llegar(k, ahora) {
    k.paso++; if (k.paso < k.camino.length) return;
    if (k.modo === 'ida') {
      k.modo = 'charla'; k.hasta = ahora + 3.4; k.dice = k.ev.dice; k.dir = 1;
      if (k.dest.id === 'ale') { if (k.ev.entrega) { jefe.bandeja = Math.min(5, jefe.bandeja + 1); if (alAvisar) alAvisar(k.nombre + ' te dejó algo en tu oficina: ' + k.ev.dice.toLowerCase()); } }
      else if (k.ev.responde) { k.dest.responde = k.ev.responde; k.dest.rDesde = ahora + 1.3; k.dest.rHasta = ahora + 3.4; }
    } else { k.modo = 'quieto'; k.dir = 1; }
  }
  function mover(k, dt, ahora) {
    if (k.modo === 'charla' && ahora > k.hasta) { k.dice = null; k.modo = 'vuelta'; k.camino = mundo.ruta(k.pos, k.sala.asiento); k.paso = 0; }
    if (k.modo !== 'ida' && k.modo !== 'vuelta') return;
    var p = k.camino[k.paso], dx = p[0] - k.pos[0], dy = p[1] - k.pos[1], dist = Math.hypot(dx, dy);
    if (dist < 0.05) { k.pos = p.slice(); llegar(k, ahora); return; }
    var ux = dx / dist, uy = dy / dist, fx = k.pos[0] + ux * 8, fy = k.pos[1] + uy * 8, tapa = false;
    for (var i = 0; i < equipo.length; i++) {
      var o = equipo[i]; if (o === k || o.modo === 'quieto') continue;
      if (Math.abs(o.pos[0] - fx) < 9 && Math.abs(o.pos[1] - fy) < 6 && (o.modo === 'charla' || o.id < k.id)) { tapa = true; break; }
    }
    if (tapa && k.espera < 1.3) { k.espera += dt; return; }
    k.espera = 0; if (Math.abs(dx) > 0.5) k.dir = dx > 0 ? 1 : -1;
    var v = dt * 58;
    if (dist > v) k.pos = [k.pos[0] + ux * v, k.pos[1] + uy * v]; else { k.pos = p.slice(); llegar(k, ahora); }
  }
  function knox(k, ahora) {
    var anda = k.modo === 'ida' || k.modo === 'vuelta', f6 = Math.floor(ahora * 6) % 2, quieto = k.modo === 'quieto';
    if (anda && k.espera > 0) f6 = 0;
    var fr = { paso: anda && !k.espera ? 1 + f6 : 0, tecleo: quieto && (k.estado === 'trabajando' || k.estado === 'publicando') && Math.floor(ahora * 4) % 2, dormido: quieto && k.estado === 'descansando' };
    var bob = anda ? f6 : (k.estado === 'pedido' ? 0 : Math.floor(ahora * 1.6 + k.id.length) % 2);
    var spr = S.sprite(k, fr), x = Math.round(k.pos[0]), y = Math.round(k.pos[1]) - 37 - bob;
    a.save(); if (k.estado === 'pedido' && quieto) a.globalAlpha = 0.5;
    if (k.dir < 0) { a.translate(x, 0); a.scale(-1, 1); a.drawImage(spr, -14, y); } else a.drawImage(spr, x - 14, y);
    a.restore();
  }
  function fuente(px) { return Math.max(1, Math.round(px)) + 'px Silkscreen, ui-monospace, monospace'; }
  function burbuja(x, top, txt, s, fondoB) {
    c.font = fuente(6.5 * s); var tw = c.measureText(txt).width + 8 * s, th = 11 * s;
    c.fillStyle = '#1b1820'; c.fillRect(x - tw / 2 - s, top - th - s, tw + 2 * s, th + 2 * s);
    c.fillStyle = fondoB; c.fillRect(x - tw / 2, top - th, tw, th); c.fillRect(x - 2 * s, top, 4 * s, 3 * s);
    c.fillStyle = '#15171b'; c.fillText(txt, x, top - th / 2 + s / 2);
  }
  function textos(ahora) {
    var s = cam.s; function X(x) { return (x - cam.ox) * s; } function Y(y) { return (y - cam.oy) * s; }
    c.textBaseline = 'middle'; c.textAlign = 'center';
    mundo.salas.forEach(function (sa) {
      c.fillStyle = COL[sa.k.estado]; c.fillRect(X(sa.rx + 34), Y(sa.ry + 6), 4 * s, 4 * s);
      c.fillStyle = '#2a1d14'; c.font = fuente(7 * s); c.fillText(sa.k.nombre, X(sa.rx + 64), Y(sa.ry + 8.4));
    });
    c.fillStyle = '#2a1d14'; c.font = fuente(6.5 * s); c.fillText('TU OFICINA', X(mundo.AX + 75), Y(mundo.M + 8.4));
    c.fillStyle = '#ffffff'; c.font = fuente(6 * s); c.fillText('PARA TI: ' + jefe.bandeja, X(mundo.AX + 51), Y(mundo.M + 207));
    for (var i = 0; i < jefe.bandeja; i++) { c.fillStyle = i % 2 ? '#f3e6cc' : '#ffffff'; c.fillRect(X(mundo.AX + 24 + i * 11), Y(mundo.M + 211), 9 * s, 4 * s); }
    equipo.forEach(function (k) {
      var x = X(k.pos[0]), top = Y(k.pos[1] - 42);
      if (k.dice) burbuja(x, top, k.dice, s, '#ffffff');
      else if (k.responde && ahora > k.rDesde && ahora < k.rHasta) burbuja(x, top, k.responde, s, '#ffe9a8');
      else if (k.modo === 'quieto' && k.estado === 'descansando') {
        var q = (ahora * 0.7 + k.id.length * 0.37) % 1; c.globalAlpha = 1 - q; c.fillStyle = '#e8eef6'; c.font = fuente(8 * s);
        c.fillText('z', x + (12 + q * 6) * s, top + (8 - q * 10) * s); c.globalAlpha = 1;
      }
    });
  }
  function dibujar(ahora) {
    a.drawImage(fondo, 0, 0);
    a.save(); a.globalAlpha = 0.09; a.fillStyle = '#ffd27a';
    mundo.salas.forEach(function (sa) { a.beginPath(); a.arc(sa.rx + 106, sa.ry + 16, 18, 0, 7); a.fill(); }); a.restore();
    var L = muebles.slice(); equipo.forEach(function (k) { L.push({ y: k.pos[1], f: function () { knox(k, ahora); } }); });
    L.sort(function (p, q) { return p.y - q.y; }).forEach(function (o) { o.f(a); });
    c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.fillStyle = '#0d0f12'; c.fillRect(0, 0, cv.width, cv.height);
    var vw = cv.width / cam.s, vh = cv.height / cam.s, sx = Math.max(0, cam.ox), sy = Math.max(0, cam.oy), ex = Math.min(W, cam.ox + vw), ey = Math.min(H, cam.oy + vh);
    c.drawImage(arte, sx, sy, ex - sx, ey - sy, (sx - cam.ox) * cam.s, (sy - cam.oy) * cam.s, (ex - sx) * cam.s, (ey - sy) * cam.s);
    textos(ahora);
  }
  var t0 = performance.now() / 1000, ultimo = t0, ultimoDibujo = 0, hechos = {}, vueltaPrev = -1, guion = G.LoftGuion || [], ciclo = 42;
  function tick() {
    var ahora = performance.now() / 1000, dt = Math.min(0.1, ahora - ultimo); ultimo = ahora;
    var vuelta = Math.floor((ahora - t0) / ciclo), t = (ahora - t0) % ciclo;
    if (vuelta !== vueltaPrev) { vueltaPrev = vuelta; jefe.bandeja = 0; }
    guion.forEach(function (ev, i) { var key = i + ':' + vuelta; if (t >= ev.t && !hechos[key]) { hechos[key] = 1; iniciar(ev); } });
    equipo.forEach(function (k) { mover(k, dt, ahora); });
    if (ahora - ultimoDibujo >= 1 / 24) { ultimoDibujo = ahora; dibujar(ahora); }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  // mano: arrastrar, pellizcar, rueda, doble clic y tocar una oficina
  var punteros = {}, arrastre = null, pellizco = null;
  function local(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr]; }
  cv.addEventListener('pointerdown', function (e) {
    try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    punteros[e.pointerId] = [e.clientX, e.clientY]; var ids = Object.keys(punteros);
    if (ids.length === 1) arrastre = { x: e.clientX, y: e.clientY, ox: cam.ox, oy: cam.oy, movio: false };
    if (ids.length === 2) { var p1 = punteros[ids[0]], p2 = punteros[ids[1]]; pellizco = { d: Math.hypot(p1[0] - p2[0], p1[1] - p2[1]) || 1, s: cam.s }; if (arrastre) arrastre.movio = true; }
  });
  cv.addEventListener('pointermove', function (e) {
    if (!punteros[e.pointerId]) return; punteros[e.pointerId] = [e.clientX, e.clientY]; var ids = Object.keys(punteros);
    if (pellizco && ids.length === 2) {
      var p1 = punteros[ids[0]], p2 = punteros[ids[1]], r = cv.getBoundingClientRect();
      zoom(pellizco.s * Math.hypot(p1[0] - p2[0], p1[1] - p2[1]) / pellizco.d / cam.s, ((p1[0] + p2[0]) / 2 - r.left) * dpr, ((p1[1] + p2[1]) / 2 - r.top) * dpr); return;
    }
    if (arrastre) {
      var dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y; if (Math.abs(dx) + Math.abs(dy) > 5) arrastre.movio = true;
      if (arrastre.movio) { cam.ox = arrastre.ox - dx * dpr / cam.s; cam.oy = arrastre.oy - dy * dpr / cam.s; limitar(); }
    }
  });
  function soltar(e) {
    var clic = arrastre && !arrastre.movio && Object.keys(punteros).length === 1;
    delete punteros[e.pointerId]; if (Object.keys(punteros).length < 2) pellizco = null;
    if (clic) {
      var p = local(e), x = cam.ox + p[0] / cam.s, y = cam.oy + p[1] / cam.s, toco = null;
      mundo.salas.forEach(function (sa) { if (x >= sa.rx && x < sa.rx + mundo.RW && y >= sa.ry && y < sa.ry + mundo.RH) toco = sa.k; });
      alTocar(toco);
    }
    if (!Object.keys(punteros).length) arrastre = null;
  }
  cv.addEventListener('pointerup', soltar); cv.addEventListener('pointercancel', soltar);
  cv.addEventListener('wheel', function (e) { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); var p = local(e); zoom(Math.exp(-e.deltaY * 0.0016), p[0], p[1]); }, { passive: false });
  cv.addEventListener('dblclick', function (e) { var p = local(e); zoom(2, p[0], p[1]); });
  return {
    verTodo: verTodo, medir: medir,
    acercar: function () { zoom(1.5, cv.width / 2, cv.height / 2); }, alejar: function () { zoom(1 / 1.5, cv.width / 2, cv.height / 2); }
  };
}
G.Loft = { crear: crear, COL: COL };
})(window);
