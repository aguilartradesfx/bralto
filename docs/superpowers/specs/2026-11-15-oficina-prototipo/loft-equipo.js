/* loft-equipo.js · los 24 Knox: aspecto, oficio y ficha (los números son de ejemplo) */
(function (G) {
'use strict';
// id, nombre, oficio, área, tela, ropa, orejas, cabeza, gorro, extra, pantalla, estado, personalidad, frase, tareas, horas, racha
var D = [
 ['drax', 'Drax', 'Jefe de la noche', 'Contenido', '#b9c2cc', '#1f2026', 'oso', 'gorra', '#1f2026', 'audifonos', 'flujo', 'trabajando', 'Serio pero buena gente. No se va a dormir hasta que todo quede programado.', 'Nadie se va hasta que todo salga.', 412, 96, 1],
 ['plexi', 'Plexi', 'Guiones de reels', 'Contenido', '#a8e6c8', '#3b5bdb', 'gato', 'pompon', '#f1ece2', '', 'lineas', 'trabajando', 'Habla rápido y siempre trae tres ganchos para escoger.', '¿Cuál gancho te gusta más?', 287, 71, 9],
 ['pixa', 'Pixa', 'Diseño de posts', 'Contenido', '#c4b0f0', '#e8590c', 'oso', '', '', 'libreta', 'play', 'trabajando', 'Detallista: mueve un pixel diez veces hasta que quede.', 'Un pixel más a la izquierda…', 198, 64, 12],
 ['lynx', 'Lynx', 'Corrector', 'Contenido', '#d7dbe0', '#2b8a3e', '', 'cresta', '', 'lentes', 'check', 'descansando', 'No se le escapa una tilde. Odia la palabra «pana».', 'Eso no lo diría Ale.', 356, 22, 15],
 ['argo', 'Argo', 'Vigilante', 'Contenido', '#9fd3f5', '#f08c00', 'gato', 'gorra', '#f08c00', '', 'ojo', 'descansando', 'Madrugador. Revisa todo dos veces y te avisa si algo falta.', 'Todo en orden, jefe.', 61, 9, 5],
 ['zap', 'Zap', 'Publicador', 'Publicación', '#f5b8c8', '#1c7ed6', 'conejo', 'gorra', '#1c7ed6', 'celular', 'avion', 'publicando', 'Puntual como reloj: si dice 10:00, sale a las 10:00.', 'Arriba en 3, 2, 1…', 1204, 40, 30],
 ['tiko', 'Tiko', 'TikTok', 'Publicación', '#f7d774', '#d6336c', '', 'trenzas', '', '', 'play', 'descansando', 'El más tico de todos: todo lo dice con «mae».', 'Mae, ya está en TikTok.', 233, 12, 18],
 ['vero', 'Vero', 'Juez de las pruebas', 'Publicación', '#f2c09a', '#495057', '', 'bucket', '#495057', 'lentes', 'barras', 'descansando', 'Justo: deja que los números decidan.', 'Ganó la versión 2.', 148, 30, 21],
 ['nova', 'Nova', 'Ideas', 'Ideas y plan', '#ffe08a', '#7048e8', 'conejo', 'pompon', '#7048e8', '', 'foco', 'descansando', 'Curiosa: ve un video que pegó y ya tiene tres ideas.', '¡Esto lo podemos hacer!', 89, 18, 7],
 ['quark', 'Quark', 'Analista', 'Ideas y plan', '#b9c2cc', '#0c8599', 'oso', '', '', 'lentes', 'barras', 'descansando', 'Callado, pero sabe cuánto rinde cada reel.', 'Los números no mienten.', 176, 44, 11],
 ['krono', 'Krono', 'Auditor del domingo', 'Ideas y plan', '#d9825f', '#5c3d2e', 'gato', 'gorra', '#5c3d2e', '', 'reloj', 'descansando', 'Los domingos repasa la semana con un café.', 'Esto pegó; esto, no.', 4, 6, 4],
 ['atlas', 'Atlas', 'Plan de la semana', 'Ideas y plan', '#9ad19a', '#c99a2e', 'oso', 'pompon', '#c99a2e', 'libreta', 'mapa', 'listo', 'Organizado: tiene la semana entera en un mapa.', 'Te dejé el plan.', 3, 5, 3],
 ['echo', 'Echo', 'El «Comenta»', 'Conversaciones', '#f2a37a', '#37b24d', 'conejo', 'bucket', '#e8590c', 'megafono', 'chat', 'trabajando', 'Contesta al toque: nadie se queda sin su guía.', '¡Ahí te va la guía!', 2310, 15, 40],
 ['volt', 'Volt', 'Responde comentarios', 'Conversaciones', '#8fb8f0', '#f59f00', '', 'cresta', '', '', 'chat', 'listo', 'Encuentra las preguntas buenas entre cien comentarios.', 'Esta pregunta da para un reel.', 57, 8, 6],
 ['dex', 'Dex', 'Contesta los DM', 'Conversaciones', '#d9b3f2', '#495057', 'gato', '', '', 'audifonos', 'chat', 'descansando', 'Amable y paciente. Si no sabe algo, dice «debo confirmarlo».', 'Ya le escribo.', 204, 19, 13],
 ['knox', 'Knox', 'Tu reporte de la mañana', 'Oficina', '#e2c39f', '#2a2b31', 'conejo', 'bucket', '#1f2026', '', 'sol', 'descansando', 'El de siempre: te cuenta cómo amaneció todo.', '¿Qué hay, Ale?', 46, 4, 46],
 ['luma', 'Luma', 'El saludo de la noche', 'Oficina', '#f5e6c8', '#9c2c4a', 'conejo', 'pompon', '#9c2c4a', '', 'sol', 'descansando', 'Cierra el día con una frase bonita.', 'Mañana va a ser un gran día.', 45, 3, 45],
 ['kash', 'Kash', 'Cobros', 'Oficina', '#7fd1a8', '#1f6f4a', '', 'gorra', '#1f6f4a', 'celular', 'plata', 'fallo', 'Cuida cada colón del diagnóstico.', 'Ya vuelvo a intentar.', 640, 11, 0],
 ['inko', 'Inko', 'Contratos', 'Oficina', '#f3a6c8', '#1e3a8a', 'gato', 'bucket', '#1e3a8a', 'libreta', 'firma', 'descansando', 'Persigue firmas con cariño.', 'Solo falta su firma.', 38, 3, 20],
 ['ping', 'Ping', 'Telegram', 'Oficina', '#7cc7f2', '#e9ecef', 'oso', '', '', 'audifonos', 'avion', 'descansando', 'Siempre atento a tus «dale» y «frénala».', 'Recibido.', 980, 30, 33],
 ['mira', 'Mira', 'Tu perfil', 'Cuando pidas', '#6cc5b0', '#e64980', 'conejo', 'trenzas', '', '', 'ojo', 'pedido', 'Espera tu pedido para dejarte el perfil como nuevo.', 'Cuando quieras.', 0, 0, 0],
 ['remix', 'Remix', 'Recicla videos', 'Cuando pidas', '#f4a261', '#5f3dc4', 'oso', 'gorra', '#5f3dc4', '', 'play', 'pedido', 'De un video largo saca una semana de posts.', 'Pásame el video.', 0, 0, 0],
 ['clip', 'Clip', 'Historias', 'Cuando pidas', '#b197fc', '#2a2b31', 'gato', 'pompon', '#ff7a2f', 'celular', 'camara', 'pedido', 'Arma las historias del día con encuestas.', '¿Encuesta o pregunta?', 0, 0, 0],
 ['quip', 'Quip', 'Comentarios en otras cuentas', 'Cuando pidas', '#ffd43b', '#2f9e44', '', 'cresta', '', 'libreta', 'lineas', 'pedido', 'Te deja comentarios escritos; tú los pones.', 'Te dejé tres.', 0, 0, 0]
];
G.LoftEquipo = D.map(function (a) {
  return { id: a[0], nombre: a[1], rol: a[2], area: a[3], tela: a[4], ropa: a[5], orejas: a[6], cabeza: a[7], gorro: a[8] || undefined,
    extra: a[9], glifo: a[10], estado: a[11], personalidad: a[12], frase: a[13], tareas: a[14], horas: a[15], racha: a[16] };
});
})(window);
