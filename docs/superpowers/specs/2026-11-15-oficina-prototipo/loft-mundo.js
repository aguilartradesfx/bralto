/* loft-mundo.js · el plano: 24 oficinas con puerta de verdad, pasillos, tu oficina, por dónde se camina (A*) y los muebles */
(function (G) {
'use strict';
var A = G.LoftArte, R = A.R, Cc = A.C;
var M = 6, HL = 24, RW = 120, RH = 96, CH = 40, AW = 150, X0 = M + HL, AX = X0 + 6 * RW;
var FILAS = [M, M + RH + CH, M + 2 * RH + CH, M + 3 * RH + 2 * CH], PAS = [M + RH, M + 3 * RH + CH];
var W = AX + AW + M, H = M + 4 * RH + 2 * CH + M, CEL = 4, GW = Math.ceil(W / CEL), GH = Math.ceil(H / CEL);
var PARA_TI = [AX + 50, M + 242];
function crearMundo(equipo) {
  var salas = [], porId = {}, libre = new Uint8Array(GW * GH);
  function marcar(x, y, w, h, v) {
    for (var j = Math.max(0, Math.floor(y / CEL)); j < Math.min(GH, Math.ceil((y + h) / CEL)); j++)
      for (var i = Math.max(0, Math.floor(x / CEL)); i < Math.min(GW, Math.ceil((x + w) / CEL)); i++) libre[j * GW + i] = v;
  }
  equipo.forEach(function (k, i) {
    var f = Math.floor(i / 6), col = i % 6, rx = X0 + col * RW, ry = FILAS[f];
    var s = { k: k, rx: rx, ry: ry, col: col, abajo: f % 2 === 0, asiento: [rx + 66, ry + 68], visita: [rx + 50, ry + 88] };
    k.sala = s; salas.push(s); porId[k.id] = k;
  });
  // por dónde se puede caminar: el carril va por el centro del pasillo
  PAS.forEach(function (py) { marcar(M + 4, py + 22, AX - M - 2, 14, 1); });
  marcar(M + 4, PAS[0] + 22, HL - 6, PAS[1] - PAS[0] + 14, 1);
  salas.forEach(function (s) {
    var x = s.rx, y = s.ry;
    marcar(x + 6, y + 48, RW - 12, RH - 54, 1);
    if (s.abajo) marcar(x + 10, y + RH - 10, 18, 36, 1); else marcar(x + 10, y - 14, 18, 64, 1);
    marcar(x + 32, y + 57, 68, 24, 0); marcar(x + 98, y + 44, 22, 34, 0); marcar(x + 98, y + 80, 22, 16, 0);
    marcar(x + 58, y + 50, 16, 22, 1);
  });
  marcar(AX + 6, M + 48, AW - 12, H - 2 * M - 54, 1);
  PAS.forEach(function (py) { marcar(AX - 10, py + 22, 20, 14, 1); });
  marcar(AX + 34, M + 46, 84, 40, 0); marcar(AX + 16, M + 212, 70, 20, 0); marcar(AX + 16, M + 372, 60, 30, 0);
  marcar(AX + 122, M + 44, 22, 34, 0); marcar(AX + 6, M + 420, 22, 40, 0); marcar(AX + 122, M + 420, 22, 40, 0);
  // A*: 4 direcciones, castiga los giros para que camine derechito
  function celda(p) { return [Math.min(GW - 1, Math.max(0, Math.floor(p[0] / CEL))), Math.min(GH - 1, Math.max(0, Math.floor(p[1] / CEL)))]; }
  function cerca(c) {
    if (libre[c[1] * GW + c[0]]) return c;
    for (var r = 1; r < 14; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
      var x = c[0] + dx, y = c[1] + dy; if (x >= 0 && y >= 0 && x < GW && y < GH && libre[y * GW + x]) return [x, y];
    }
    return c;
  }
  function centro(i) { return [(i % GW) * CEL + CEL / 2, ((i / GW) | 0) * CEL + CEL / 2]; }
  function ruta(a, b) {
    var s = cerca(celda(a)), t = cerca(celda(b)), N = GW * GH, si = s[1] * GW + s[0], ti = t[1] * GW + t[0];
    var g = new Float32Array(N).fill(1e9), de = new Int32Array(N).fill(-1), dir = new Int8Array(N).fill(-1), listo = new Uint8Array(N), heap = [];
    function hh(i) { return Math.abs(i % GW - t[0]) + Math.abs(((i / GW) | 0) - t[1]); }
    function meter(i, f) { heap.push([f, i]); var n = heap.length - 1; while (n > 0) { var p = (n - 1) >> 1; if (heap[p][0] <= heap[n][0]) break; var q = heap[p]; heap[p] = heap[n]; heap[n] = q; n = p; } }
    function sacar() {
      var top = heap[0], ult = heap.pop();
      if (heap.length) { heap[0] = ult; var n = 0; for (;;) { var l = 2 * n + 1, r = l + 1, m = n; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === n) break; var q = heap[m]; heap[m] = heap[n]; heap[n] = q; n = m; } }
      return top;
    }
    var D = [[1, 0], [-1, 0], [0, 1], [0, -1]]; g[si] = 0; meter(si, hh(si));
    while (heap.length) {
      var cur = sacar()[1]; if (listo[cur]) continue; listo[cur] = 1; if (cur === ti) break;
      var cx = cur % GW, cy = (cur / GW) | 0;
      for (var d = 0; d < 4; d++) {
        var nx = cx + D[d][0], ny = cy + D[d][1]; if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        var ni = ny * GW + nx; if (!libre[ni] || listo[ni]) continue;
        var costo = g[cur] + 1 + (dir[cur] >= 0 && dir[cur] !== d ? 0.6 : 0);
        if (costo < g[ni]) { g[ni] = costo; de[ni] = cur; dir[ni] = d; meter(ni, costo + hh(ni) * 1.001); }
      }
    }
    if (si !== ti && de[ti] < 0) return [b.slice()];
    var cs = []; for (var i = ti; i >= 0; i = de[i]) { cs.push(i); if (i === si) break; }
    cs.reverse();
    var pts = [centro(cs[0])];
    for (var j = 1; j < cs.length - 1; j++) if (dir[cs[j]] !== dir[cs[j + 1]]) pts.push(centro(cs[j]));
    pts.push(b.slice()); return pts;
  }
  // el fondo (lo que no se mueve)
  function sala(b, s) {
    var x = s.rx, y = s.ry;
    A.ladrillos(b, x, y, RW, 44); A.piso(b, x, y + 44, RW, RH - 44, Cc.piso, Cc.pisoLinea); R(b, x, y + 43, RW, 2, '#4a2a1d');
    if (s.abajo && s.col === 0) A.ventana(b, x + 9, y + 10, 16, 26);
    A.letrero(b, x + 30, y + 3, 60); A.pantallaPared(b, x + 44, y + 15, s.k.glifo); A.lampara(b, x + 106, y);
    R(b, x + 30, y + 70, 70, 22, Cc.naranja); R(b, x + 31, y + 71, 68, 20, Cc.alfombra);
    A.viga(b, x - 2, y, 4, RH); A.viga(b, x + RW - 2, y, 4, RH);
    if (s.abajo) {
      A.viga(b, x, y - 2, RW, 4); A.viga(b, x, y + RH - 2, 8, 4); A.viga(b, x + 30, y + RH - 2, RW - 30, 4);
      R(b, x + 8, y + RH - 1, 22, 2, Cc.naranja); R(b, x + 6, y + RH - 16, 2, 16, Cc.borde); R(b, x + 30, y + RH - 16, 2, 16, Cc.borde);
      R(b, x + 32, y + RH - 20, 4, 18, '#7a4a2a'); R(b, x + 33, y + RH - 19, 2, 16, '#9a6238'); R(b, x + 34, y + RH - 12, 1, 2, '#ffd27a');
    } else {
      A.viga(b, x, y - 2, 8, 4); A.viga(b, x + 30, y - 2, RW - 30, 4);
      A.piso(b, x + 8, y, 22, 46, Cc.pasillo, Cc.pasilloLinea); R(b, x + 8, y, 22, 6, '#6f7378');
      R(b, x + 6, y, 2, 45, Cc.borde); R(b, x + 30, y, 2, 45, Cc.borde); R(b, x + 6, y, 26, 3, Cc.borde);
      R(b, x + 32, y + 8, 4, 36, '#7a4a2a'); R(b, x + 33, y + 9, 2, 34, '#9a6238'); R(b, x + 34, y + 26, 1, 2, '#ffd27a');
      R(b, x + 9, y + 45, 20, 3, Cc.naranja);
    }
  }
  function fondo() {
    var f = document.createElement('canvas'); f.width = W; f.height = H; var b = f.getContext('2d');
    R(b, 0, 0, W, H, '#15171b');
    PAS.forEach(function (py) {
      A.piso(b, M, py, AX - M, CH, Cc.pasillo, Cc.pasilloLinea); R(b, M, py + 1, AX - M, 3, '#6b717b'); R(b, M, py + 1, AX - M, 1, '#8b929c');
      A.franjas(b, X0 + 40, py + CH - 5, 40); R(b, X0 + 266, py + 4, 100, 18, '#cdbb9c'); R(b, X0 + 267, py + 5, 98, 16, '#d8c8aa');
    });
    A.piso(b, M, PAS[0], HL, PAS[1] - PAS[0] + CH, Cc.pasillo, Cc.pasilloLinea);
    R(b, M, M, HL, PAS[0] - M, '#24272c'); R(b, M, PAS[1] + CH, HL, H - M - PAS[1] - CH, '#24272c');
    salas.forEach(function (s) { sala(b, s); });
    var x = AX, y = M, h = H - 2 * M;
    A.ladrillos(b, x, y, AW, 44); A.piso(b, x, y + 44, AW, h - 44, '#a3a5a8', '#939598'); R(b, x, y + 43, AW, 2, '#4a2a1d');
    A.ventana(b, x + 8, y + 10, 22, 26); A.ventana(b, x + AW - 30, y + 10, 22, 26); A.letrero(b, x + 36, y + 3, 78); A.pantallaPared(b, x + 53, y + 15, 'barras');
    R(b, x + 24, y + 92, 100, 60, Cc.naranja); R(b, x + 25, y + 93, 98, 58, '#5a3d32'); R(b, x + 10, y + 300, 120, 50, '#cdbb9c'); R(b, x + 11, y + 301, 118, 48, '#d8c8aa');
    A.viga(b, x - 2, y, 4, PAS[0] - y); A.viga(b, x - 2, PAS[0] + CH, 4, PAS[1] - PAS[0] - CH); A.viga(b, x - 2, PAS[1] + CH, 4, H - M - PAS[1] - CH);
    PAS.forEach(function (py) { R(b, x - 1, py + 6, 2, CH - 10, Cc.naranja); });
    A.viga(b, M - 2, M - 2, W - 2 * M + 4, 4); A.viga(b, M - 2, H - M - 2, W - 2 * M + 4, 4); A.viga(b, M - 2, M, 4, H - 2 * M); A.viga(b, W - M - 2, M, 4, H - 2 * M);
    return f;
  }
  // muebles que tapan o son tapados según quién está más abajo
  function muebles() {
    var L = [];
    salas.forEach(function (s) {
      var x = s.rx, y = s.ry;
      L.push({ y: y + 76, f: function (c) { A.escritorio(c, x + 36, y + 58, 60); } });
      L.push({ y: y + 74, f: function (c) { A.archivero(c, x + 102, y + 48); } });
      L.push({ y: y + 94, f: function (c) { A.planta(c, x + 109, y + 94); } });
    });
    PAS.forEach(function (py) {
      L.push({ y: py + 21, f: function (c) { A.sofa(c, X0 + 278, py + 3); } });
      L.push({ y: py + 20, f: function (c) { A.mesita(c, X0 + 330, py + 11); } });
      L.push({ y: py + 21, f: function (c) { A.planta(c, X0 + 361, py + 21, true); } });
    });
    var x = AX, y = M;
    L.push({ y: y + 62, f: function (c) { R(c, x + 66, y + 46, 20, 16, '#2b2f36'); R(c, x + 68, y + 40, 16, 8, '#3a3f48'); } });
    L.push({ y: y + 84, f: function (c) { A.escritorio(c, x + 36, y + 66, 80); } });
    L.push({ y: y + 230, f: function (c) { R(c, x + 18, y + 216, 66, 6, '#d9a066'); R(c, x + 18, y + 216, 66, 1, '#efc08a'); R(c, x + 20, y + 222, 3, 8, Cc.borde); R(c, x + 79, y + 222, 3, 8, Cc.borde); } });
    L.push({ y: y + 396, f: function (c) { A.sofa(c, x + 24, y + 378); } });
    L.push({ y: y + 74, f: function (c) { A.archivero(c, x + 126, y + 48); } });
    [[x + 16, y + 456], [x + 132, y + 456], [x + 16, y + 280], [x + 132, y + 280]].forEach(function (p) { L.push({ y: p[1], f: function (c) { A.planta(c, p[0], p[1]); } }); });
    return L;
  }
  return { W: W, H: H, AX: AX, M: M, PAS: PAS, RW: RW, RH: RH, salas: salas, porId: porId, ruta: ruta, fondo: fondo, muebles: muebles, PARA_TI: PARA_TI };
}
G.LoftMundo = { crear: crearMundo };
})(window);
