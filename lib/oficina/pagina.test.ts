import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Marca, Social, TipoMarca } from './tipos.ts'
import {
  ETIQUETA, avisoDormida, chipsDe, cuandoCR, desdeCR, diaCR, enlaceSeguro, horaDeTexto, horasCR, lasCR, lineaAhora, lineaDelDia,
  lineaFalla, listaDelDia, marcaDeAhora, marcasNuevas, momentoCR, nombreDe, proximoDe, recortar, reintento, textoPlano, type AgenteSnap,
  alFallar, conOptimistas, copiaSocial, soltarOptimistas, urlOficina,
} from './pagina.ts'

// Domingo 15/11/2026, 7:24 p. m. en Costa Rica
const AHORA = new Date('2026-11-16T01:24:00.000Z')

function ag(id: string, extra: Partial<AgenteSnap> = {}): AgenteSnap {
  return {
    id, nombre: id.charAt(0).toUpperCase() + id.slice(1), oficio: 'Oficio', area: 'Contenido', puesto: 0,
    aspecto: { tela: '#cccccc', ropa: '#333333', glifo: 'lineas' }, personalidad: '', frase: '', horario: null, cada_minutos: null,
    ruta: null, donde: 'sitio', estado_fijo: null, despierto_siempre: false, dura_min: 10, ultima_revision: null, lugar: null,
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

test('el letrero de la oficina dormida', () => {
  assert.equal(avisoDormida({ dormida: true, desde: '2026-11-16T00:14:00Z', por: null }, AHORA), 'La oficina duerme desde las 6:14 p. m.')
  assert.equal(avisoDormida({ dormida: true, desde: '2026-11-15T19:05:00Z', por: null }, AHORA), 'La oficina duerme desde la 1:05 p. m.')
  assert.equal(avisoDormida({ dormida: true, desde: '2026-11-15T03:14:00Z', por: null }, AHORA), 'La oficina duerme desde ayer a las 9:14 p. m.')
  assert.equal(avisoDormida({ dormida: true, desde: null, por: null }, AHORA), 'La oficina está dormida.')
})

test('las cuentas despierta: las cuatro de siempre y «a medias» solo si hay; nunca los que descansan ni las fijas', () => {
  const agentes = [
    ag('a', { estado: 'trabajando' }), ag('b', { estado: 'trabajando' }), ag('c', { estado: 'publicando' }), ag('d', { estado: 'listo' }),
    ag('e', { estado: 'descansando' }), ag('f', { estado: 'pedido' }), ag('g', { estado: 'a-medias' }), ag('h', { estado: 'pendiente' }),
  ]
  const chips = chipsDe(agentes, false)
  assert.deepEqual(chips.map((c) => c.texto), ['2 trabajando', '1 publicando', '1 te dejó algo', '0 fallaron', '1 se quedó a medias'])
  assert.deepEqual(chips.map((c) => c.clave), ['trabajando', 'publicando', 'listo', 'fallo', 'a-medias'])
  assert.deepEqual(chips.map((c) => c.n), [2, 1, 1, 0, 1])
  assert.deepEqual(chipsDe([ag('x', { estado: 'fallo' }), ag('y', { estado: 'listo' }), ag('z', { estado: 'listo' })], false).map((c) => c.texto),
    ['0 trabajando', '0 publicando', '2 te dejaron algo', '1 falló'])
})

test('las cuentas dormida: los que duermen y los que se quedan de guardia', () => {
  const dormidos = Array.from({ length: 22 }, (_, i) => ag(`k${i}`, { estado: 'durmiendo' }))
  const guardia = [ag('lambda', { estado: 'trabajando', despierto_siempre: true }), ag('mu', { estado: 'fallo', despierto_siempre: true })]
  const chips = chipsDe([...dormidos, ...guardia], true)
  assert.deepEqual(chips.map((c) => c.texto), ['22 durmiendo', '2 de guardia'])
  assert.deepEqual(chips.map((c) => c.clave), ['durmiendo', 'guardia'])
  // recién dormida, antes de que el servidor cambie los estados, ya cuenta igual
  assert.deepEqual(chipsDe([ag('a', { estado: 'trabajando' }), ag('b')], true).map((c) => c.texto), ['2 durmiendo'])
  assert.deepEqual(chipsDe([ag('a'), ag('lambda', { despierto_siempre: true })], true).map((c) => c.texto), ['1 durmiendo', '1 de guardia'])
})

test('solo se abren enlaces web o del mismo sitio, con una forma conocida', () => {
  for (const bueno of ['https://bralto.io/x', 'http://bralto.io', '/calendario/abc', '/crm/mensajes?de=hoy#arriba', '/analisis']) {
    assert.equal(enlaceSeguro(bueno), true, bueno)
  }
  // «//…» va a otro sitio, y el navegador también lee como «//…» la barra invertida, el tab y el salto de línea
  const malos = [
    'javascript:alert(1)', '//otro.sitio/x', '/\\otro.sitio', '/\t/otro.sitio', '/\n/otro.sitio', '/', '', ' /calendario', 'calendario',
    'https://', 'https:///otro.sitio', 'https://bralto.io/\\x', '/calendario\r/x', null,
  ]
  for (const malo of malos) assert.equal(enlaceSeguro(malo), false, JSON.stringify(malo))
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
  assert.equal(reintento(ag('gama', { cada_minutos: 5, horario: '*/5 * * * *' }), AHORA), 'se reintenta a las 7:25 p. m.')
  assert.equal(reintento(ag('gama2', { cada_minutos: 5 }), AHORA), 'se reintenta en unos minutos')
  assert.equal(reintento(ag('iota', { horario: '30 1 * * *' }), AHORA), 'se reintenta a las 7:30 p. m.')
  assert.equal(reintento(ag('xi', { horario: '0 12 * * *' }), AHORA), 'se reintenta mañana a las 6:00 a. m.')
  assert.equal(reintento(ag('eta', { estado_fijo: 'pedido' }), AHORA), 'se reintenta cuando lo pidas')
  assert.equal(reintento(ag('epsilon'), AHORA), null)
  assert.equal(reintento(ag('vero', { cada_minutos: 60, horario: '0 * * * *' }), AHORA), 'se reintenta a las 8:00 p. m.')
  assert.equal(reintento(ag('zap', { horario: '30 1 * * *' }), AHORA, true), 'No se vuelve a intentar sola: revísala en el Calendario.')
})

test('lo próximo de la ficha', () => {
  assert.equal(proximoDe(ag('beta', { cada_minutos: 5, ultima_revision: '2026-11-16T01:20:00Z' }), AHORA, false), 'Revisa cada 5 min · última vez: 7:20 p. m.')
  assert.equal(proximoDe(ag('beta', { cada_minutos: 5 }), AHORA, false), 'Revisa cada 5 min')
  assert.equal(proximoDe(ag('vero', { cada_minutos: 60 }), AHORA, false), 'Revisa cada hora')
  assert.equal(proximoDe(ag('eta', { estado_fijo: 'pedido' }), AHORA, false), 'Cuando lo pidas')
  assert.equal(proximoDe(ag('zeta', { estado_fijo: 'pendiente', horario: '0 12 * * 1' }), AHORA, false), 'Todavía no empieza')
  assert.equal(proximoDe(ag('iota', { horario: '30 1 * * *' }), AHORA, false), 'Hoy a las 7:30 p. m.')
  assert.equal(proximoDe(ag('xi', { horario: '0 12 * * *' }), AHORA, false), 'Mañana a las 6:00 a. m.')
  assert.equal(proximoDe(ag('epsilon'), AHORA, false), 'Cuando le llegue trabajo')
  assert.equal(proximoDe(ag('raro', { horario: 'no es un cron' }), AHORA, false), 'Sin hora fija')
  assert.equal(proximoDe(ag('iota', { horario: '30 1 * * *' }), AHORA, true), 'En pausa mientras la oficina duerme')
  assert.equal(proximoDe(ag('lambda', { despierto_siempre: true }), AHORA, true), 'Cuando le llegue trabajo')
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

test('en el plano, quien está en la sala dice «en la sala» o «de siesta»', () => {
  const lugar = (rincon: 'cafe' | 'platica' | 'siesta') => ({ rincon, sitio: 0, con: null, hasta: null, por: 'turno' as const })
  assert.equal(textoPlano(ag('mu', { horario: '0 2 * * *' }), [], [], AHORA, lugar('cafe')), 'en la sala')
  assert.equal(textoPlano(ag('eta', { estado: 'pedido' }), [], [], AHORA, lugar('platica')), 'en la sala')
  assert.equal(textoPlano(ag('alfa', { horario: '0 1 * * *' }), [], [], AHORA, lugar('siesta')), 'de siesta')
  // sin lugar, lo de siempre
  assert.equal(textoPlano(ag('mu', { horario: '0 2 * * *' }), [], [], AHORA, undefined), 'próx. 8:00 p. m.')
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
  assert.equal(lineaFalla(ag('gama', { estado: 'fallo', cada_minutos: 5, horario: null }), marcas, AHORA), 'Falló a las 7:10 p. m. · se reintenta en unos minutos')
  assert.equal(lineaFalla(ag('iota', { estado: 'fallo', horario: '30 1 * * *' }), [], AHORA), 'Se reintenta a las 7:30 p. m.')
  assert.equal(lineaFalla(ag('epsilon', { estado: 'fallo' }), [], AHORA), null)
  const sin = [mk('zap', 'falla', '2026-11-16T01:10:00Z', { texto: 'No se pudo publicar «X»', extra: { sin_reintento: true } })]
  assert.equal(lineaFalla(ag('zap', { estado: 'fallo', horario: '30 1 * * *' }), sin, AHORA), 'Falló a las 7:10 p. m. · No se vuelve a intentar sola: revísala en el Calendario.')
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

  // cada nombre sabe de quién es (en la página es un botón a su ficha)
  assert.equal(contenido.barras[0].agente, 'alfa')
  const etiquetas = dia.filas.flatMap((f) => f.etiquetas)
  assert.ok(etiquetas.length >= 3)
  for (const e of etiquetas) assert.equal(nombreDe(e.agente, agentes), e.texto)
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

test('una raya de la línea del día conserva el Knox, el texto y el enlace de su marca', () => {
  const agentes = [ag('beta', { area: 'Publicación' })]
  const marcas = [
    mk('beta', 'entrega', '2026-11-15T20:00:00Z', { texto: 'El plan de la semana', enlace: '/ideas' }), // 2:00 p. m.
    mk('beta', 'termina', '2026-11-15T16:00:00Z', { texto: 'Subió el reel' }), // 10:00 a. m.
  ]
  const proximos = [{ cuando: '8:00 p. m.', agente: 'beta', texto: '«Post del lunes»' }]
  const rayas = lineaDelDia({ agentes, marcas, proximos, oficina: { dormida: false, desde: null, por: null } }, AHORA).filas[0].rayas
  const listo = rayas.find((r) => r.clase === 'listo')
  assert.deepEqual(listo && [listo.agente, listo.texto, listo.enlace], ['beta', 'El plan de la semana', '/ideas'])
  const hecho = rayas.find((r) => r.clase === 'hecho')
  assert.deepEqual(hecho && [hecho.agente, hecho.texto, hecho.enlace], ['beta', 'Subió el reel', null])
  // lo que sigue no tiene enlace: todavía no pasó
  const sig = rayas.find((r) => r.clase === 'sig')
  assert.deepEqual(sig && [sig.agente, sig.texto, sig.enlace], ['beta', '«Post del lunes»', null])
})

test('la lista del día: lo de hoy y lo que sigue hoy, de arriba abajo por hora', () => {
  const agentes = [
    ag('theta', { area: 'Contenido', puesto: 0 }),
    ag('alfa', { area: 'Contenido', puesto: 1, estado: 'trabajando' }),
    ag('beta', { area: 'Publicación', puesto: 2 }),
    ag('gama', { area: 'Oficina', puesto: 3, estado: 'fallo' }),
  ]
  const marcas = [
    mk('gama', 'falla', '2026-11-16T01:10:00Z', { texto: 'El cobro no contestó' }), // 7:10 p. m.
    mk('beta', 'entrega', '2026-11-15T20:00:00Z', { texto: 'El plan de la semana', enlace: '/ideas' }), // 2:00 p. m.
    mk('theta', 'pasa', '2026-11-15T13:05:00Z', { texto: 'Le pasó el reel a Alfa', para: 'alfa' }), // 7:05 a. m.
    mk('theta', 'termina', '2026-11-15T13:00:00Z', { texto: 'Revisó lo de la noche' }), // 7:00 a. m.
    mk('alfa', 'empieza', '2026-11-16T01:00:00Z'), // empezar no es una raya
    mk('theta', 'termina', '2026-11-15T03:00:00Z'), // ayer: no sale
    mk('nadie', 'termina', '2026-11-15T15:00:00Z'), // un Knox que no está en el catálogo: tampoco (como en la línea)
  ]
  const proximos = [
    { cuando: '8:00 p. m.', agente: 'beta', texto: '«Post del lunes»' },
    { cuando: '10:00 p. m.', agente: 'alfa', texto: 'Oficio' },
    { cuando: '6:00 a. m.', agente: 'theta', texto: 'Oficio' }, // ya es de mañana
  ]
  const lista = listaDelDia({ agentes, marcas, proximos, oficina: { dormida: false, desde: null, por: null } }, AHORA)
  assert.deepEqual(lista.map((e) => [e.cuando, e.agente, e.clase, e.futuro]), [
    ['7:00 a. m.', 'theta', 'hecho', false],
    ['7:05 a. m.', 'theta', 'suave', false],
    ['2:00 p. m.', 'beta', 'listo', false],
    ['7:10 p. m.', 'gama', 'fallo', false],
    ['8:00 p. m.', 'beta', 'sig', true],
    ['10:00 p. m.', 'alfa', 'sig', true],
  ])
  assert.deepEqual([lista[2].texto, lista[2].enlace], ['El plan de la semana', '/ideas'])
  assert.deepEqual([lista[4].texto, lista[4].enlace], ['«Post del lunes»', null])
  // lo que sigue va siempre después de lo hecho, aunque una marca llegue con la hora adelantada
  const adelantada = [...marcas, mk('beta', 'publica', '2026-11-16T02:30:00Z', { texto: 'Publicó antes de tiempo' })] // 8:30 p. m.
  const conAdelantada = listaDelDia({ agentes, marcas: adelantada, proximos, oficina: { dormida: false, desde: null, por: null } }, AHORA)
  assert.deepEqual(conAdelantada.map((e) => e.futuro), [false, false, false, false, false, true, true])
  // dormida, lo que sigue está en pausa: no sale
  const dormida = listaDelDia({ agentes, marcas, proximos, oficina: { dormida: true, desde: '2026-11-16T00:00:00Z', por: null } }, AHORA)
  assert.deepEqual(dormida.map((e) => e.futuro), [false, false, false, false])
})

// ---------- La copia del foro y lo optimista (usarOficina) ----------
const SOCIAL: Social = {
  foro: [{ id: 'p1', de: 'alfa', tipo: 'nota', titulo: 'T', texto: 'x', foto_id: null, likes: 3, te_gusta: false, idea_id: null, mostrar_desde: '2026-11-15T15:00:00Z', comentarios: [] }],
  ideas: [{ id: 'i1', texto: 'Idea', por_que: 'Porque sí', de: 'beta', post_id: 'p1', estado: 'nueva', mostrar_desde: '2026-11-15T15:00:00Z', decidida_en: null }],
  fotos: [],
  ronda: null,
}
const MIN = 60_000

test('la página pide el foro con la firma de su copia, salvo que no tenga copia o ya tenga 30 min', () => {
  const copia = copiaSocial({ social: SOCIAL, firmaSocial: 'ab12cd34' }, 1_000)
  assert.deepEqual(copia, { firma: 'ab12cd34', recibido: 1_000 })
  assert.equal(urlOficina(copia, 1_000 + 29 * MIN), '/api/oficina?social=ab12cd34')
  assert.equal(urlOficina(copia, 1_000 + 30 * MIN), '/api/oficina', 'a los 30 min se pide entero: los enlaces de las fotos vencen a la hora')
  // '' es lo que contesta el servidor cuando no pudo armar el bloque: no hay copia, así que se vuelve a pedir entero
  assert.deepEqual(copiaSocial({ social: null, firmaSocial: '' }, 1_000), { firma: null, recibido: null })
  // con social null y una firma, tampoco hay copia nueva (la página se queda con la que tenía)
  assert.deepEqual(copiaSocial({ social: null, firmaSocial: 'ab12cd34' }, 1_000), { firma: null, recibido: null })
  assert.equal(urlOficina(copiaSocial({ social: null, firmaSocial: '' }, 1_000), 2_000), '/api/oficina')
  assert.equal(urlOficina(copiaSocial(null, 1_000), 2_000), '/api/oficina')
  assert.equal(urlOficina(null, 2_000), '/api/oficina')
})

test('lo optimista se ve al tiro y se queda hasta que el servidor lo confirma (al menos 70 s, como mucho 3 min)', () => {
  const ideas = new Map([['i1', { valor: 'sirve' as const, desde: 0 }]])
  const likes = new Map([['p1', { valor: true, desde: 0 }]])
  const visto = conOptimistas(SOCIAL, ideas, likes)
  assert.equal(visto.ideas[0].estado, 'sirve')
  assert.equal(visto.foro[0].te_gusta, true)
  assert.equal(SOCIAL.ideas[0].estado, 'nueva', 'no toca la copia del servidor')
  assert.equal(conOptimistas(SOCIAL, new Map(), new Map()), SOCIAL)

  const real = (estado: string) => (id: string) => (id === 'i1' ? estado : undefined)
  // otra instancia del servidor puede traer todavía lo de antes: se queda
  assert.equal(soltarOptimistas(ideas, real('nueva'), 30_000), false)
  // aunque ya diga lo mismo, antes de 70 s se queda (una consulta siguiente podría traer lo viejo)
  assert.equal(soltarOptimistas(ideas, real('sirve'), 60_000), false)
  assert.equal(ideas.size, 1)
  // después de 70 s, si el servidor todavía dice otra cosa, se queda; si ya lo confirma, se suelta
  assert.equal(soltarOptimistas(ideas, real('nueva'), 90_000), false)
  assert.equal(soltarOptimistas(ideas, real('sirve'), 90_000), true)
  assert.equal(ideas.size, 0)
  // a los 3 min se suelta igual (lo pudo cambiar otro)
  assert.equal(soltarOptimistas(likes, () => false, 179_000), false)
  assert.equal(soltarOptimistas(likes, () => false, 180_000), true)
  assert.equal(likes.size, 0)
})

test('si dos toques seguidos no se guardan, termina viéndose lo del servidor (fallen en el orden que fallen)', () => {
  const a = { valor: 'sirve' as const, desde: 0 } // «Me sirve»
  const b = { valor: 'nueva' as const, desde: 1 } // el segundo toque lo deshace
  // falla primero el primero: se sigue viendo el segundo (todavía en camino); cuando falla ese, lo del servidor
  let r = alFallar([a, b], b, a)
  assert.deepEqual(r, { vivas: [b], visible: b })
  r = alFallar(r.vivas, r.visible ?? undefined, b)
  assert.deepEqual(r, { vivas: [], visible: null })
  // falla primero el segundo: se ve el primero (en camino o ya guardado: es lo que va a tener el servidor); cuando
  // falla ese también, lo del servidor
  r = alFallar([a, b], b, b)
  assert.deepEqual(r, { vivas: [a], visible: a })
  r = alFallar(r.vivas, r.visible ?? undefined, a)
  assert.deepEqual(r, { vivas: [], visible: null })
  // lo que ya se soltó (el servidor ya lo confirmó) no vuelve a aparecer
  assert.deepEqual(alFallar([a, b], undefined, b), { vivas: [a], visible: null })
  // una que ya no estaba entre las vivas no cambia nada
  assert.deepEqual(alFallar([b], b, a), { vivas: [b], visible: b })
})
