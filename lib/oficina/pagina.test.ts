import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Marca, TipoMarca } from './tipos.ts'
import {
  ETIQUETA, avisoDormida, chipsDe, cuandoCR, desdeCR, diaCR, encabezadoCR, horaDeTexto, horasCR, lasCR, lineaAhora, lineaDelDia, lineaFalla,
  marcaDeAhora, marcasNuevas, momentoCR, nombreDe, proximoDe, recortar, reintento, textoPlano, ultimoDe, type AgenteSnap,
} from './pagina.ts'

// Domingo 15/11/2026, 7:24 p. m. en Costa Rica
const AHORA = new Date('2026-11-16T01:24:00.000Z')

function ag(id: string, extra: Partial<AgenteSnap> = {}): AgenteSnap {
  return {
    id, nombre: id.charAt(0).toUpperCase() + id.slice(1), oficio: 'Oficio', area: 'Contenido', puesto: 0,
    aspecto: { tela: '#cccccc', ropa: '#333333', glifo: 'lineas' }, personalidad: '', frase: '', horario: null, cada_minutos: null,
    ruta: null, donde: 'sitio', estado_fijo: null, despierto_siempre: false, dura_min: 10, ultima_revision: null,
    estado: 'descansando', numeros: { tareas: 0, horas: 0, diasSinFallar: 0 }, ...extra,
  }
}

function mk(agente: string, tipo: TipoMarca, creado_en: string, extra: Partial<Marca> = {}): Marca {
  return {
    id: `${agente}-${tipo}-${creado_en}`, agente, tipo, para: null, texto: `${tipo} de ${agente}`, enlace: null, ref_tabla: null,
    ref_id: null, dura_seg: null, extra: null, visto_en: null, creado_en, ...extra,
  }
}

test('cada estado tiene su etiqueta', () => {
  assert.deepEqual(ETIQUETA, {
    trabajando: 'Trabajando', publicando: 'Publicando', listo: 'Te dejó algo', fallo: 'Falló', descansando: 'Descansando',
    pedido: 'Cuando lo pidas', pendiente: 'Pronto', 'a-medias': 'Se quedó a medias', durmiendo: 'Durmiendo',
  })
})

test('el nombre sale del catálogo; un id desconocido, con mayúscula', () => {
  const agentes = [ag('beta', { nombre: 'Beta' })]
  assert.equal(nombreDe('beta', agentes), 'Beta')
  assert.equal(nombreDe('eta', agentes), 'Eta')
})

test('día y hora de Costa Rica (UTC−6)', () => {
  assert.equal(horasCR(AHORA.getTime()), 19.4)
  assert.equal(diaCR(Date.parse('2026-11-15T06:00:00Z')), diaCR(Date.parse('2026-11-16T05:59:00Z')))
  assert.equal(diaCR(Date.parse('2026-11-15T05:59:00Z')), diaCR(Date.parse('2026-11-15T06:00:00Z')) - 1)
})

test('la una va en singular', () => {
  assert.equal(lasCR(new Date('2026-11-16T01:00:00Z')), 'las 7:00 p. m.')
  assert.equal(lasCR(new Date('2026-11-15T19:05:00Z')), 'la 1:05 p. m.')
})

test('cuándo, contado desde hoy', () => {
  assert.equal(cuandoCR(new Date('2026-11-16T01:30:00Z'), AHORA), 'a las 7:30 p. m.')
  assert.equal(cuandoCR(new Date('2026-11-16T01:30:00Z'), AHORA, { hoy: true }), 'hoy a las 7:30 p. m.')
  assert.equal(cuandoCR(new Date('2026-11-16T12:00:00Z'), AHORA), 'mañana a las 6:00 a. m.')
  assert.equal(cuandoCR(new Date('2026-11-15T03:14:00Z'), AHORA), 'ayer a las 9:14 p. m.')
  assert.equal(cuandoCR(new Date('2026-11-18T14:00:00Z'), AHORA), 'el miércoles a las 8:00 a. m.')
  assert.equal(cuandoCR(new Date('2026-11-22T14:00:00Z'), AHORA), 'el 22/11 a las 8:00 a. m.')
})

test('la hora corta de las listas dice «ayer» si no es de hoy', () => {
  assert.equal(momentoCR(new Date('2026-11-16T01:10:00Z'), AHORA), '7:10 p. m.')
  assert.equal(momentoCR(new Date('2026-11-15T03:15:00Z'), AHORA), 'ayer 9:15 p. m.')
  assert.equal(momentoCR(new Date('2026-11-12T03:15:00Z'), AHORA), 'miércoles 9:15 p. m.')
})

test('el encabezado dice el día y la hora', () => {
  assert.equal(encabezadoCR(AHORA), 'Domingo · 7:24 p. m.')
})

test('el letrero de la oficina dormida', () => {
  assert.equal(avisoDormida({ dormida: true, desde: '2026-11-16T00:14:00Z', por: null }, AHORA), 'La oficina duerme desde las 6:14 p. m.')
  assert.equal(avisoDormida({ dormida: true, desde: '2026-11-15T19:05:00Z', por: null }, AHORA), 'La oficina duerme desde la 1:05 p. m.')
  assert.equal(avisoDormida({ dormida: true, desde: '2026-11-15T03:14:00Z', por: null }, AHORA), 'La oficina duerme desde ayer a las 9:14 p. m.')
  assert.equal(avisoDormida({ dormida: true, desde: null, por: null }, AHORA), 'La oficina está dormida.')
})

test('las cuentas por estado: las cinco de siempre, «a medias» y «durmiendo» solo si hay, y nunca las fijas', () => {
  const agentes = [
    ag('a', { estado: 'trabajando' }), ag('b', { estado: 'trabajando' }), ag('c', { estado: 'publicando' }), ag('d', { estado: 'listo' }),
    ag('e', { estado: 'descansando' }), ag('f', { estado: 'pedido' }), ag('g', { estado: 'a-medias' }), ag('h', { estado: 'pendiente' }),
  ]
  assert.deepEqual(chipsDe(agentes, false).map((c) => c.texto), [
    '2 trabajando', '1 publicando', '1 te dejó algo', '0 fallaron', '1 se quedó a medias', '1 descansando',
  ])
  const dormidos = [ag('a', { estado: 'durmiendo' }), ag('b', { estado: 'durmiendo' }), ag('lambda', { estado: 'trabajando' })]
  assert.deepEqual(chipsDe(dormidos, true).map((c) => c.texto), ['1 trabajando', '2 durmiendo'])
  assert.deepEqual(chipsDe([ag('x', { estado: 'fallo' }), ag('y', { estado: 'listo' }), ag('z', { estado: 'listo' })], false).map((c) => c.texto),
    ['0 trabajando', '0 publicando', '2 te dejaron algo', '1 falló', '0 descansando'])
})

test('la marca que explica lo que hace ahora', () => {
  const marcas = [
    mk('alfa', 'empieza', '2026-11-16T01:10:00Z', { texto: 'Reparte las piezas de mañana' }),
    mk('alfa', 'empieza', '2026-11-15T01:00:00Z', { texto: 'la de ayer' }),
    mk('beta', 'publica', '2026-11-16T01:20:00Z', { texto: 'Sube la prueba v3' }),
    mk('gama', 'falla', '2026-11-16T01:10:00Z', { texto: 'El cobro no contestó' }),
  ]
  const paraTi = [mk('zeta', 'entrega', '2026-11-16T00:00:00Z', { texto: 'el plan de la semana' })]
  assert.equal(marcaDeAhora(ag('alfa', { estado: 'trabajando' }), marcas, paraTi)?.texto, 'Reparte las piezas de mañana')
  assert.equal(marcaDeAhora(ag('alfa', { estado: 'a-medias' }), marcas, paraTi)?.texto, 'Reparte las piezas de mañana')
  assert.equal(marcaDeAhora(ag('beta', { estado: 'publicando' }), marcas, paraTi)?.texto, 'Sube la prueba v3')
  assert.equal(marcaDeAhora(ag('gama', { estado: 'fallo' }), marcas, paraTi)?.texto, 'El cobro no contestó')
  assert.equal(marcaDeAhora(ag('zeta', { estado: 'listo' }), marcas, paraTi)?.texto, 'el plan de la semana')
  assert.equal(marcaDeAhora(ag('delta', { estado: 'descansando' }), marcas, paraTi), null)
})

test('cuándo se reintenta lo que falló', () => {
  assert.equal(reintento(ag('gama', { cada_minutos: 5, horario: '*/5 * * * *' }), AHORA), 'se reintenta en unos minutos')
  assert.equal(reintento(ag('iota', { horario: '30 1 * * *' }), AHORA), 'se reintenta a las 7:30 p. m.')
  assert.equal(reintento(ag('xi', { horario: '0 12 * * *' }), AHORA), 'se reintenta mañana a las 6:00 a. m.')
  assert.equal(reintento(ag('eta', { estado_fijo: 'pedido' }), AHORA), 'se reintenta cuando lo pidas')
  assert.equal(reintento(ag('epsilon'), AHORA), null)
})

test('lo próximo de la ficha', () => {
  assert.equal(proximoDe(ag('beta', { cada_minutos: 5, ultima_revision: '2026-11-16T01:20:00Z' }), AHORA, false), 'Revisa cada 5 min · última vez: 7:20 p. m.')
  assert.equal(proximoDe(ag('beta', { cada_minutos: 5 }), AHORA, false), 'Revisa cada 5 min')
  assert.equal(proximoDe(ag('eta', { estado_fijo: 'pedido' }), AHORA, false), 'Cuando lo pidas')
  assert.equal(proximoDe(ag('zeta', { estado_fijo: 'pendiente', horario: '0 12 * * 1' }), AHORA, false), 'Todavía no empieza')
  assert.equal(proximoDe(ag('iota', { horario: '30 1 * * *' }), AHORA, false), 'Hoy a las 7:30 p. m.')
  assert.equal(proximoDe(ag('xi', { horario: '0 12 * * *' }), AHORA, false), 'Mañana a las 6:00 a. m.')
  assert.equal(proximoDe(ag('epsilon'), AHORA, false), 'Cuando le llegue trabajo')
  assert.equal(proximoDe(ag('raro', { horario: 'no es un cron' }), AHORA, false), 'Sin hora fija')
  assert.equal(proximoDe(ag('iota', { horario: '30 1 * * *' }), AHORA, true), 'En pausa mientras la oficina duerme')
  assert.equal(proximoDe(ag('lambda', { despierto_siempre: true }), AHORA, true), 'Cuando le llegue trabajo')
})

test('lo último que hizo: su marca más nueva con la hora', () => {
  const marcas = [
    mk('delta', 'termina', '2026-11-15T03:15:00Z', { texto: 'Revisó 3 piezas' }),
    mk('delta', 'pasa', '2026-11-16T01:05:00Z', { texto: 'Le pasó el reel a Beta' }),
  ]
  assert.equal(ultimoDe('delta', marcas, AHORA), 'Le pasó el reel a Beta · 7:05 p. m.')
  assert.equal(ultimoDe('delta', [marcas[0]], AHORA), 'Revisó 3 piezas · ayer 9:15 p. m.')
  assert.equal(ultimoDe('alfa', marcas, AHORA), null)
})

test('el texto corto del plano', () => {
  const marcas = [mk('epsilon', 'empieza', '2026-11-16T01:10:00Z', { texto: 'Escribe el guion «Ideas para el lunes»' })]
  assert.equal(textoPlano(ag('epsilon', { estado: 'trabajando' }), marcas, [], AHORA), 'Escribe el guion…')
  assert.equal(textoPlano(ag('mu', { horario: '0 2 * * *' }), [], [], AHORA), 'próx. 8:00 p. m.')
  assert.equal(textoPlano(ag('beta', { cada_minutos: 5 }), [], [], AHORA), 'revisa cada 5 min')
  assert.equal(textoPlano(ag('eta', { estado: 'pedido' }), [], [], AHORA), 'cuando lo pidas')
  assert.equal(textoPlano(ag('nu', { estado: 'pendiente' }), [], [], AHORA), 'pronto')
  assert.equal(textoPlano(ag('zeta', { estado: 'listo' }), [], [], AHORA), 'te dejó algo')
  assert.equal(textoPlano(ag('alfa', { estado: 'a-medias' }), [], [], AHORA), 'se quedó a medias')
  assert.equal(textoPlano(ag('delta', { estado: 'durmiendo' }), [], [], AHORA), 'durmiendo')
  assert.equal(textoPlano(ag('gama', { estado: 'fallo' }), [], [], AHORA), 'falló')
  for (const t of ['próx. 12:40 a. m.', 'se quedó a medias']) assert.ok(t.length <= 18, t)
})

test('las marcas nuevas son las que no se habían visto, de la más vieja a la más nueva', () => {
  const a = mk('alfa', 'pasa', '2026-11-16T01:00:00Z'), b = mk('epsilon', 'pasa', '2026-11-16T01:05:00Z'), c = mk('beta', 'entrega', '2026-11-16T01:10:00Z')
  assert.deepEqual(marcasNuevas(new Set([a.id]), [c, b, a]).map((m) => m.id), [b.id, c.id])
  assert.deepEqual(marcasNuevas(new Set([a.id, b.id, c.id]), [c, b, a]), [])
})

test('la hora de «Lo próximo» se vuelve a leer como número', () => {
  assert.equal(horaDeTexto('7:30 p. m.'), 19.5)
  assert.equal(horaDeTexto('12:15 a. m.'), 0.25)
  assert.equal(horaDeTexto('12:00 p. m.'), 12)
  assert.equal(horaDeTexto('cuando pidas'), null)
})

test('«desde» y textos recortados', () => {
  assert.equal(desdeCR(new Date('2026-11-16T01:00:00Z'), AHORA), 'desde las 7:00 p. m.')
  assert.equal(desdeCR(new Date('2026-11-15T19:05:00Z'), AHORA), 'desde la 1:05 p. m.')
  assert.equal(desdeCR(new Date('2026-11-15T05:50:00Z'), AHORA), 'desde ayer a las 11:50 p. m.')
  assert.equal(recortar('Te paso 2 reels', 36), 'Te paso 2 reels')
  assert.equal(recortar('Le mandó la guía REPORTE a doce personas en una hora', 20), 'Le mandó la guía RE…')
})

test('la línea de «Ahora» para cada estado', () => {
  const marcas = [
    mk('alfa', 'empieza', '2026-11-16T01:00:00Z', { texto: 'Reparte las piezas de mañana' }),
    mk('beta', 'publica', '2026-11-16T01:20:00Z', { texto: 'Sube la prueba v3' }),
    mk('gama', 'falla', '2026-11-16T01:10:00Z', { texto: 'El cobro no contestó' }),
  ]
  const paraTi = [mk('zeta', 'entrega', '2026-11-16T00:00:00Z', { texto: 'el plan de la semana' })]
  assert.equal(lineaAhora(ag('alfa', { estado: 'trabajando' }), marcas, paraTi, AHORA), 'Reparte las piezas de mañana · desde las 7:00 p. m.')
  assert.equal(lineaAhora(ag('alfa', { estado: 'a-medias' }), marcas, paraTi, AHORA), 'Se quedó a medias: Reparte las piezas de mañana · empezó a las 7:00 p. m.')
  assert.equal(lineaAhora(ag('beta', { estado: 'publicando' }), marcas, paraTi, AHORA), 'Sube la prueba v3 · 7:20 p. m.')
  assert.equal(lineaAhora(ag('gama', { estado: 'fallo' }), marcas, paraTi, AHORA), 'El cobro no contestó')
  assert.equal(lineaAhora(ag('zeta', { estado: 'listo' }), marcas, paraTi, AHORA), 'Te dejó: el plan de la semana')
  assert.equal(lineaAhora(ag('delta', { estado: 'descansando' }), marcas, paraTi, AHORA), null)
  assert.equal(lineaFalla(ag('gama', { estado: 'fallo', cada_minutos: 5 }), marcas, AHORA), 'Falló a las 7:10 p. m. · se reintenta en unos minutos')
  assert.equal(lineaFalla(ag('iota', { estado: 'fallo', horario: '30 1 * * *' }), [], AHORA), 'Se reintenta a las 7:30 p. m.')
  assert.equal(lineaFalla(ag('epsilon', { estado: 'fallo' }), [], AHORA), null)
})

test('la línea del día: solo lo de hoy, cada marca en su área y su hora', () => {
  const agentes = [
    ag('theta', { area: 'Contenido', puesto: 0 }),
    ag('alfa', { area: 'Contenido', puesto: 1, estado: 'trabajando' }),
    ag('beta', { area: 'Publicación', puesto: 2 }),
    ag('gama', { area: 'Oficina', puesto: 3, estado: 'fallo' }),
    ag('eta', { area: 'Cuando pidas', puesto: 4, estado: 'pedido', estado_fijo: 'pedido' }),
  ]
  const marcas = [
    mk('alfa', 'empieza', '2026-11-16T01:00:00Z'), // 7:00 p. m., sigue abierta
    mk('gama', 'falla', '2026-11-16T01:10:00Z'), // 7:10 p. m.
    mk('beta', 'publica', '2026-11-15T16:00:00Z'), // 10:00 a. m.
    mk('theta', 'termina', '2026-11-15T13:00:00Z'), // 7:00 a. m.
    mk('theta', 'pasa', '2026-11-15T13:05:00Z'),
    mk('beta', 'entrega', '2026-11-15T20:00:00Z'), // 2:00 p. m.
    mk('theta', 'termina', '2026-11-15T03:00:00Z'), // ayer: no sale
  ]
  const proximos = [
    { cuando: '8:00 p. m.', agente: 'beta', texto: '«Post del lunes»' },
    { cuando: '10:00 p. m.', agente: 'alfa', texto: 'Oficio' },
    { cuando: '6:00 a. m.', agente: 'theta', texto: 'Oficio' }, // ya es de mañana
    { cuando: '9:00 p. m.', agente: 'beta', texto: 'mañana a la misma hora' }, // después de pasar la medianoche
  ]
  const dia = lineaDelDia({ agentes, marcas, proximos, oficina: { dormida: false, desde: null, por: null } }, AHORA)
  const X = (h: number) => ((h - 6) / 18) * 100
  const cerca = (a: number, b: number) => Math.abs(a - b) < 0.01

  assert.deepEqual(dia.ejes.map((e) => e.texto), ['6 a. m.', '9', '12 m.', '3 p. m.', '6', '9', '12'])
  assert.ok(cerca(dia.ahora, X(19.4)))
  assert.deepEqual(dia.filas.map((f) => f.area), ['Contenido', 'Publicación', 'Oficina', 'Cuando pidas'])

  const [contenido, publicacion, oficina, pidas] = dia.filas
  assert.deepEqual(contenido.rayas.filter((r) => r.clase !== 'sig').map((r) => r.clase).sort(), ['hecho', 'suave'])
  assert.ok(cerca(contenido.rayas.find((r) => r.clase === 'hecho')!.x, X(7)))
  assert.equal(contenido.barras.length, 1)
  assert.equal(contenido.barras[0].estado, 'trabajando')
  assert.ok(cerca(contenido.barras[0].x, X(19)))
  assert.ok(cerca(contenido.barras[0].x + contenido.barras[0].w, X(19.4)))

  assert.deepEqual(publicacion.rayas.map((r) => r.clase), ['publicando', 'listo', 'sig'])
  assert.ok(cerca(publicacion.rayas[2].x, X(20)))
  assert.deepEqual(contenido.rayas.filter((r) => r.clase === 'sig').map((r) => r.x), [X(22)])
  assert.deepEqual(oficina.rayas.map((r) => r.clase), ['fallo'])
  assert.equal(pidas.vacio, 'Nada pedido hoy')
  assert.equal(contenido.vacio, null)
})

test('la línea del día empieza antes de las 6 si hubo algo de madrugada, y muestra la siesta', () => {
  const agentes = [ag('kappa', { area: 'Ideas y plan' })]
  const marcas = [mk('kappa', 'termina', '2026-11-15T10:30:00Z')] // 4:30 a. m.
  const dia = lineaDelDia({
    agentes, marcas, proximos: [{ cuando: '8:00 p. m.', agente: 'kappa', texto: 'x' }],
    oficina: { dormida: true, desde: '2026-11-16T00:00:00Z', por: null }, // 6:00 p. m.
  }, AHORA)
  assert.equal(dia.ejes[0].texto, '3 a. m.')
  const X = (h: number) => ((h - 3) / 21) * 100
  assert.ok(Math.abs(dia.filas[0].rayas[0].x - X(4.5)) < 0.01)
  assert.ok(dia.sueno && Math.abs(dia.sueno.x - X(18)) < 0.01 && Math.abs(dia.sueno.x + dia.sueno.w - X(19.4)) < 0.01)
  assert.equal(dia.filas[0].rayas.filter((r) => r.clase === 'sig').length, 0, 'dormida: nada punteado')
})

test('con varias corridas abiertas en un área, la primera lleva el nombre y ninguna etiqueta tapa una barra', () => {
  const ids = ['alfa', 'beta', 'gama']
  const agentes = ids.map((id, i) => ag(id, { area: 'Contenido', puesto: i, estado: 'trabajando', dura_min: 60 }))
  const marcas = [28, 12, 9].map((min, i) => mk(ids[i], 'empieza', new Date(AHORA.getTime() - min * 60_000).toISOString()))
  const ancho = 900
  const fila = lineaDelDia({ agentes, marcas, proximos: [], oficina: { dormida: false, desde: null, por: null } }, AHORA, ancho).filas[0]
  assert.equal(fila.barras.length, 3)
  const conNombre = [...fila.etiquetas.map((e) => e.texto), ...fila.barras.flatMap((b) => (b.texto ? [b.texto] : []))]
  assert.deepEqual(conNombre, ['Alfa'])
  const px = (x: number) => (x / 100) * ancho
  for (const e of fila.etiquetas) {
    const w = e.texto.length * 7.5 + 4, p = px(e.x)
    const [a, b] = e.lado === 'der' ? [p + 6, p + 6 + w] : [p - 6 - w, p - 6]
    for (const bar of fila.barras) assert.ok(b <= px(bar.x) || a >= px(bar.x + bar.w), `${e.texto} tapa una barra`)
  }
})

test('las etiquetas de la línea del día no se enciman', () => {
  const agentes = ['alfa', 'beta', 'gama', 'delta', 'epsilon'].map((id, i) => ag(id, { area: 'Contenido', puesto: i }))
  const marcas = agentes.map((a, i) => mk(a.id, 'termina', new Date(Date.parse('2026-11-15T18:00:00Z') + i * 4 * 60_000).toISOString()))
  const dia = lineaDelDia({ agentes, marcas, proximos: [], oficina: { dormida: false, desde: null, por: null } }, AHORA, 600)
  const fila = dia.filas[0]
  assert.ok(fila.etiquetas.length >= 1)
  const tramos = fila.etiquetas.map((e) => {
    const px = (e.x / 100) * 600, w = e.texto.length * 7.5 + 4
    return e.lado === 'der' ? [px + 6, px + 6 + w] : [px - 6 - w, px - 6]
  }).sort((p, q) => p[0] - q[0])
  for (let i = 1; i < tramos.length; i++) assert.ok(tramos[i][0] >= tramos[i - 1][1], JSON.stringify(tramos))
  for (const [a, b] of tramos) assert.ok(a >= 0 && b <= 600, JSON.stringify(tramos))
})
