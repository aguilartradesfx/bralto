/* pagina.js · pestañas (Maqueta, Plano, Maqueta y día), panel de ahora, línea del día, ficha y avisos. Datos de ejemplo. */
(function (G) {
'use strict';
var equipo = G.LoftEquipo, COL = G.Loft.COL;
var NOMBRE = { trabajando: 'Trabajando', publicando: 'Publicando', listo: 'Te tiene algo listo', fallo: 'Algo falló', descansando: 'Descansando', pedido: 'Cuando lo pidas' };
var AHORA = { trabajando: 'En lo suyo, con la pantalla prendida', publicando: 'Subiendo un post', listo: 'Te dejó algo en tu oficina', fallo: 'Algo falló; lo vuelve a intentar', descansando: 'Descansando hasta su próxima tarea', pedido: 'Espera que le pidas algo' };
var CORTO = { drax: 'Repartiendo', plexi: 'Reel Gmail 3/5', pixa: 'Lámina 4 de 7', zap: 'Subiendo v3', echo: 'Guía REPORTE', atlas: 'Plan listo', volt: '8 respuestas', kash: 'Tilopay falló' };
var LARGO = { drax: 'Reparte las piezas de mañana', plexi: 'Escribe el reel «Gmail programar», versión 3 de 5', pixa: 'Arma la lámina 4 de 7 del post de las 6:00 p. m.',
  zap: 'Sube la prueba v3 de «La tienda» a Instagram', echo: 'Le manda la guía REPORTE a una persona (12 hoy)', atlas: 'Te dejó el plan de la semana',
  volt: 'Te dejó 8 respuestas a comentarios para tu OK', kash: 'Tilopay no contestó a las 7:10; reintenta 7:30' };
var PROX = { lynx: 'en minutos', argo: 'al terminar', tiko: '10 a. m.', vero: '8:00 p. m.', nova: 'con un enlace', quark: '12:40 a. m.', krono: 'dom 8 a. m.', dex: 'con cada DM', knox: '6:00 a. m.', luma: '10:00 p. m.', inko: '10 a. m.', ping: 'cada 5 min' };
var NEXT = [['7:30 p. m.', 'Kash · Cobros', 'Vuelve a intentar con Tilopay'], ['8:00 p. m.', 'Vero · Juez de las pruebas', 'Revisa las pruebas de hoy'],
  ['8:10 p. m.', 'Zap · Publicador', 'Prueba v4 de «La tienda»'], ['~9:30 p. m.', 'Argo · Vigilante', 'Revisa lo que dejó la noche'], ['10:00 p. m.', 'Luma · Saludo de la noche', 'El saludo de mañana']];
function corto(k) { return CORTO[k.id] || (k.estado === 'pedido' ? 'cuando pidas' : 'próx. ' + (PROX[k.id] || '—')); }
function $(id) { return document.getElementById(id); }
function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function porId(id) { for (var i = 0; i < equipo.length; i++) if (equipo[i].id === id) return equipo[i]; return null; }
function chips() {
  function n(e) { return equipo.filter(function (k) { return k.estado === e; }).length; }
  $('chips').innerHTML = '<span class="t">Domingo · 7:24 p. m.</span>' + [['trabajando', 'trabajando'], ['publicando', 'publicando'], ['listo', 'te tienen algo'], ['fallo', 'falló'], ['descansando', 'descansando']]
    .map(function (p) { return '<span class="chip"><span class="dot" style="background:' + COL[p[0]] + '"></span>' + n(p[0]) + ' ' + p[1] + '</span>'; }).join('');
  $('activos').textContent = (n('trabajando') + n('publicando')) + ' trabajando';
}
function lado() {
  function fila(k, extra) {
    return '<button type="button" class="row" data-id="' + k.id + '"><span class="dot" style="background:' + COL[k.estado] + '"></span><span class="tx"><b>' + esc(k.nombre) +
      '</b> <em>· ' + esc(k.rol) + '</em><small>' + esc(LARGO[k.id] || '') + '</small></span>' + (extra || '') + '</button>';
  }
  function de(e1, e2) { return equipo.filter(function (k) { return k.estado === e1 || k.estado === e2; }); }
  $('lado').innerHTML =
    '<section class="box"><h4>Ahora</h4>' + de('trabajando', 'publicando').map(function (k) { return fila(k); }).join('') + '</section>' +
    '<section class="box naranja"><h4>Para ti</h4>' + de('listo').map(function (k) { return fila(k, '<span class="btn">Ver</span>'); }).join('') + '</section>' +
    '<section class="box rojo"><h4>Falló</h4>' + de('fallo').map(function (k) { return fila(k); }).join('') + '</section>' +
    '<section class="box"><h4>Lo próximo</h4>' + NEXT.map(function (n) { return '<div class="row prox"><span class="h">' + n[0] + '</span><span class="tx"><b>' + esc(n[1]) + '</b><small>' + esc(n[2]) + '</small></span></div>'; }).join('') + '</section>';
}
var AREAS = ['Contenido', 'Publicación', 'Ideas y plan', 'Conversaciones', 'Oficina', 'Cuando pidas'], NOW = 19.4;
var EV = [['Contenido', 7, null, 'hecho'], ['Contenido', 19, NOW, 'trabajando'], ['Contenido', NOW, 21.5, 'next', 'sigue ~9:30'],
  ['Publicación', 8], ['Publicación', 9.67], ['Publicación', 10], ['Publicación', 11.5], ['Publicación', 13.25], ['Publicación', 15], ['Publicación', 16.75], ['Publicación', 18],
  ['Publicación', 19.33, null, 'publicando'], ['Publicación', 20.17, null, 'next'], ['Publicación', 21.67, null, 'next'],
  ['Ideas y plan', 6.67], ['Ideas y plan', 9.5], ['Ideas y plan', 12.67], ['Ideas y plan', 15.2], ['Ideas y plan', 17, null, 'listo'], ['Ideas y plan', 18.67],
  ['Conversaciones', 8.3], ['Conversaciones', 9.1], ['Conversaciones', 10.2], ['Conversaciones', 10.4], ['Conversaciones', 11], ['Conversaciones', 12.3], ['Conversaciones', 13.7],
  ['Conversaciones', 14.2], ['Conversaciones', 16], ['Conversaciones', 17.5], ['Conversaciones', 19, null, 'listo'], ['Conversaciones', 19.38, null, 'trabajando'], ['Conversaciones', 20, null, 'next'],
  ['Oficina', 6], ['Oficina', 10], ['Oficina', 19.17, null, 'fallo'], ['Oficina', 19.5, null, 'next'], ['Oficina', 22, null, 'next']];
var LABS = [['Contenido', 7, 'Argo'], ['Contenido', 19, 'La noche', 1], ['Publicación', 10, 'Excel con IA'], ['Ideas y plan', 17, 'Plan listo', 1],
  ['Conversaciones', 19, '8 respuestas', 1], ['Oficina', 6, 'Reporte'], ['Oficina', 19.17, 'Tilopay', 1], ['Oficina', 22, 'Saludos']];
function hoy() {
  function L(h) { return ((h - 6) / 18 * 100).toFixed(2); }
  var ax = [[6, '6 a. m.'], [9, '9'], [12, '12 m.'], [15, '3 p. m.'], [18, '6'], [21, '9'], [24, '12']];
  var s = '<div class="tl-fila eje"><div class="tl-nom">HOY</div><div class="tl-pista">' + ax.map(function (q) { return '<span style="left:' + L(q[0]) + '%">' + q[1] + '</span>'; }).join('') + '</div></div>';
  AREAS.forEach(function (ar) {
    var t = '';
    if (ar === 'Oficina') for (var h = 6; h < NOW; h += 1 / 6) t += '<i class="tl-t suave" style="left:' + L(h) + '%"></i>';
    EV.filter(function (e) { return e[0] === ar; }).forEach(function (e) {
      var st = e[3] || 'hecho', col = st === 'hecho' ? '#94a3b8' : (COL[st] || '#94a3b8');
      if (e[2] == null) t += '<i class="tl-t' + (st === 'next' ? ' sig' : '') + '" style="left:' + L(e[1]) + '%;background:' + col + '"></i>';
      else t += '<div class="tl-b' + (st === 'next' ? ' sig' : '') + '" style="left:' + L(e[1]) + '%;width:' + ((e[2] - e[1]) / 18 * 100).toFixed(2) + '%;background:' + col + '">' + (e[4] || '') + '</div>';
    });
    LABS.filter(function (l) { return l[0] === ar; }).forEach(function (l) {
      t += l[3] ? '<span class="tl-l" style="right:calc(' + (100 - L(l[1])) + '% + 6px)">' + l[2] + '</span>' : '<span class="tl-l" style="left:calc(' + L(l[1]) + '% + 6px)">' + l[2] + '</span>';
    });
    if (ar === 'Cuando pidas') t += '<span class="tl-l gris" style="left:6px">Nada pedido hoy</span>';
    t += '<div class="tl-ahora" style="left:' + L(NOW) + '%"></div>';
    s += '<div class="tl-fila"><div class="tl-nom">' + ar + '</div><div class="tl-pista">' + t + '</div></div>';
  });
  $('hoy').innerHTML = s;
}
function abrir(k) {
  var f = $('f-foto'), d = Math.max(1, Math.round(G.devicePixelRatio || 1)); f.width = 84 * d; f.height = 114 * d;
  var c = f.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, f.width, f.height); c.drawImage(G.KnoxSprite.sprite(k, {}), 0, 0, f.width, f.height);
  $('f-nombre').textContent = k.nombre; $('f-rol').textContent = k.rol;
  $('f-estado').innerHTML = '<span class="dot" style="background:' + COL[k.estado] + '"></span>' + NOMBRE[k.estado];
  $('f-tareas').textContent = k.tareas.toLocaleString('es-CR'); $('f-horas').textContent = k.horas; $('f-racha').textContent = k.racha;
  $('f-perso').textContent = k.personalidad; $('f-frase').textContent = '«' + k.frase + '»';
  $('f-area').textContent = k.area; $('f-ahora').textContent = LARGO[k.id] || AHORA[k.estado];
  $('ficha').classList.add('abierta'); $('ficha').setAttribute('aria-hidden', 'false');
}
function cerrar() { $('ficha').classList.remove('abierta'); $('ficha').setAttribute('aria-hidden', 'true'); }
var tAviso = null;
function avisar(txt) { var a = $('aviso'); a.textContent = txt; a.classList.add('ver'); clearTimeout(tAviso); tAviso = setTimeout(function () { a.classList.remove('ver'); }, 3800); }
function iniciar() {
  chips(); lado(); hoy();
  var tocar = function (k) { if (k) abrir(k); else cerrar(); };
  var loft = G.Loft.crear($('cv'), equipo, tocar, avisar), plano = G.PlanoPixel.crear($('cvp'), equipo, corto, tocar);
  function ver(v) {
    $('vistas').className = 'vistas v-' + v;
    [].forEach.call(document.querySelectorAll('.tabs [data-v]'), function (b) { b.setAttribute('aria-selected', b.getAttribute('data-v') === v ? 'true' : 'false'); });
    requestAnimationFrame(function () { loft.medir(); plano.medir(); });
    try { localStorage.setItem('oficina-vista', v); } catch (e) {}
  }
  [].forEach.call(document.querySelectorAll('.tabs [data-v]'), function (b) { b.addEventListener('click', function () { ver(b.getAttribute('data-v')); }); });
  $('mas').addEventListener('click', function () { loft.acercar(); }); $('menos').addEventListener('click', function () { loft.alejar(); }); $('todo').addEventListener('click', function () { loft.verTodo(); });
  $('lado').addEventListener('click', function (e) { var b = e.target.closest('[data-id]'); if (b) abrir(porId(b.getAttribute('data-id'))); });
  $('cerrar').addEventListener('click', cerrar);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
  var guardada = null; try { guardada = localStorage.getItem('oficina-vista'); } catch (e) {}
  ver(guardada === 'plano' || guardada === 'dia' ? guardada : 'maqueta');
}
try { document.fonts.load('10px Silkscreen').then(iniciar, iniciar); } catch (e) { iniciar(); }
})(window);
