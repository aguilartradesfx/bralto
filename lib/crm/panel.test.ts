import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enlaceLista, leerPagina, terminosDeBusqueda, totalPaginas } from './busqueda.ts'
import { diaCorto, duracion, fechaHora, haceCuanto, vencimiento } from './fechas.ts'
import { esLargo, nombreDelDia, porDia, textoLlamada, unirMensajes } from './historial.ts'
import { agruparTareas, armarTablero, dinero, grupoDe } from './tablero.ts'
import {
  leerCursor,
  leerValor,
  validarCambioOportunidad,
  validarCambioTarea,
  validarContacto,
  validarNota,
  validarNuevaOportunidad,
  validarTarea,
  venceDe,
} from './validar.ts'

// Viernes 30 de octubre de 2026, 15:00 en Costa Rica (21:00 UTC)
const AHORA = new Date('2026-10-30T21:00:00Z')

test('terminosDeBusqueda: palabras sin tildes, y un teléfono solo con sus números', () => {
  assert.deepEqual(terminosDeBusqueda('  José  PÉREZ '), ['jose', 'perez'])
  assert.deepEqual(terminosDeBusqueda('Muñoz'), ['munoz'])
  assert.deepEqual(terminosDeBusqueda('ana@ejemplo.test'), ['ana@ejemplo.test'])
  assert.deepEqual(terminosDeBusqueda('+506 7000-0001'), ['50670000001'])
  assert.deepEqual(terminosDeBusqueda('(305) 555'), ['305555'])
  assert.deepEqual(terminosDeBusqueda('12'), [])
  // Comodines y caracteres del filtro no pasan
  assert.deepEqual(terminosDeBusqueda('a%b_c,(d)'), ['a', 'b', 'c', 'd'])
  assert.deepEqual(terminosDeBusqueda(''), [])
  assert.deepEqual(terminosDeBusqueda(undefined), [])
})

test('paginación y enlaces de la lista', () => {
  assert.equal(leerPagina('3'), 3)
  assert.equal(leerPagina('0'), 1)
  assert.equal(leerPagina('-2'), 1)
  assert.equal(leerPagina('dos'), 1)
  assert.equal(leerPagina(undefined), 1)
  assert.equal(totalPaginas(0), 1)
  assert.equal(totalPaginas(30), 1)
  assert.equal(totalPaginas(31), 2)
  assert.equal(enlaceLista({}), '/crm')
  assert.equal(enlaceLista({ q: ' ana ', etiqueta: 'cliente nuevo', pagina: 2 }), '/crm?q=ana&etiqueta=cliente+nuevo&pagina=2')
  assert.equal(enlaceLista({ pagina: 1 }), '/crm')
})

test('haceCuanto y fechaHora, en hora de Costa Rica', () => {
  assert.equal(haceCuanto('2026-10-30T20:59:40Z', AHORA), 'hace un momento')
  assert.equal(haceCuanto('2026-10-30T20:15:00Z', AHORA), 'hace 45 min')
  assert.equal(haceCuanto('2026-10-30T14:05:00Z', AHORA), 'hoy, 08:05')
  // Las 23:30 del jueves en Costa Rica ya son viernes en UTC: igual es «ayer»
  assert.equal(haceCuanto('2026-10-30T05:30:00Z', AHORA), 'ayer')
  assert.equal(haceCuanto('2026-10-27T15:00:00Z', AHORA), 'hace 3 días')
  assert.equal(haceCuanto('2026-03-12T15:00:00Z', AHORA), '12 mar')
  assert.equal(haceCuanto('2025-03-12T15:00:00Z', AHORA), '12 mar 2025')
  assert.equal(fechaHora('2026-10-30T16:32:00Z', AHORA), 'Hoy, 10:32')
  assert.equal(fechaHora('2026-10-29T16:32:00Z', AHORA), 'Ayer, 10:32')
  assert.equal(fechaHora('2025-12-01T16:32:00Z', AHORA), '1 dic 2025, 10:32')
  assert.equal(diaCorto('2026-01-05', '2026-10-30'), '5 ene')
})

test('vencimiento y duración', () => {
  assert.equal(vencimiento('2026-10-30T15:00:00Z', AHORA), 'Vence hoy')
  assert.equal(vencimiento('2026-10-31T15:00:00Z', AHORA), 'Vence mañana')
  assert.equal(vencimiento('2026-10-29T15:00:00Z', AHORA), 'Venció ayer')
  assert.equal(vencimiento('2026-10-20T15:00:00Z', AHORA), 'Venció hace 10 días')
  assert.equal(vencimiento('2026-11-06T15:00:00Z', AHORA), 'Vence el viernes 6 de noviembre')
  assert.equal(vencimiento('2027-01-04T15:00:00Z', AHORA), 'Vence el lunes 4 de enero de 2027')
  assert.equal(duracion(45), '45 s')
  assert.equal(duracion(95), '2 min')
  assert.equal(duracion(3900), '1 h 5 min')
  assert.equal(duracion(3600), '1 h')
})

test('armarTablero: una columna por etapa en su orden, con lo que suma', () => {
  const etapas = [
    { id: 'b', nombre: 'Etapa B', orden: 1 },
    { id: 'a', nombre: 'Etapa A', orden: 0 },
  ]
  const ops = [
    { id: '1', etapa_id: 'a', valor: 100.1 },
    { id: '2', etapa_id: 'a', valor: 200.2 },
    { id: '3', etapa_id: 'b', valor: 0 },
    { id: '4', etapa_id: 'otra', valor: 50 },
  ]
  const t = armarTablero(etapas, ops)
  assert.deepEqual(t.map((c) => [c.etapa.nombre, c.tarjetas.map((x) => x.id), c.suma]), [
    ['Etapa A', ['1', '2'], 300.3],
    ['Etapa B', ['3'], 0],
  ])
  assert.equal(dinero(1500), '$1,500')
  assert.equal(dinero(1500.5), '$1,500.5')
  assert.equal(dinero(0), '$0')
})

test('agruparTareas: atrasadas, hoy, mañana, esta semana, más adelante y sin fecha', () => {
  const t = (id: string, vence_en: string | null) => ({ id, vence_en })
  const grupos = agruparTareas(
    [t('sin', null), t('lejos', '2026-12-01T15:00:00Z'), t('hoy', '2026-10-30T15:00:00Z'), t('atrasada', '2026-10-01T15:00:00Z'), t('mañana', '2026-10-31T15:00:00Z'), t('semana', '2026-11-04T15:00:00Z')],
    AHORA,
  )
  assert.deepEqual(grupos.map(([g, lista]) => [g, lista.map((x) => x.id)]), [
    ['atrasadas', ['atrasada']],
    ['hoy', ['hoy']],
    ['manana', ['mañana']],
    ['semana', ['semana']],
    ['despues', ['lejos']],
    ['sin_fecha', ['sin']],
  ])
  assert.equal(grupoDe('2026-11-06T15:00:00Z', '2026-10-30'), 'semana')
  assert.equal(grupoDe('2026-11-07T15:00:00Z', '2026-10-30'), 'despues')
})

test('validarContacto: crear pide nombre; el teléfono queda en E.164 y el correo en minúsculas', () => {
  const ok = validarContacto({ nombre: ' Ana ', apellido: 'Prueba', telefono: '7000-0001', correo: 'Ana@Ejemplo.TEST', empresa: '', etiquetas: ['Cliente', 'cliente', ' vip '] })
  assert.deepEqual(ok, {
    ok: true,
    datos: { nombre: 'Ana', apellido: 'Prueba', telefono: '+50670000001', correo: 'ana@ejemplo.test', empresa: null, etiquetas: ['cliente', 'vip'] },
  })
  assert.deepEqual(validarContacto({ nombre: '' }), { ok: false, error: 'Escribe el nombre' })
  assert.equal(validarContacto({ nombre: 'Ana', telefono: '123' }).ok, false)
  assert.deepEqual(validarContacto({ nombre: 'Ana', correo: 'ana@' }), { ok: false, error: 'Ese correo no está bien escrito' })
  assert.deepEqual(validarContacto(null), { ok: false, error: 'Faltan los datos del contacto' })
})

test('validarContacto parcial: solo lo que viene; vaciar el teléfono se puede, el nombre no', () => {
  assert.deepEqual(validarContacto({ telefono: '' }, { parcial: true }), { ok: true, datos: { telefono: null } })
  assert.deepEqual(validarContacto({ empresa: 'Inventada S.A.' }, { parcial: true }), { ok: true, datos: { empresa: 'Inventada S.A.' } })
  assert.deepEqual(validarContacto({ nombre: '  ' }, { parcial: true }), { ok: false, error: 'Escribe el nombre' })
  assert.deepEqual(validarContacto({}, { parcial: true }), { ok: false, error: 'No hay nada que cambiar' })
})

test('validarNota, validarTarea y validarCambioTarea', () => {
  assert.deepEqual(validarNota({ texto: '  Llamar\r\nel lunes ' }), { ok: true, datos: { texto: 'Llamar\nel lunes' } })
  assert.deepEqual(validarNota({ texto: '' }), { ok: false, error: 'Escribe la nota' })
  assert.equal(validarNota({ texto: 'x'.repeat(5001) }).ok, false)
  // Vence ese día a las 9:00 de Costa Rica (15:00 UTC)
  assert.deepEqual(validarTarea({ titulo: 'Mandar propuesta', vence: '2026-11-02' }), { ok: true, datos: { titulo: 'Mandar propuesta', vence_en: '2026-11-02T15:00:00.000Z' } })
  assert.deepEqual(validarTarea({ titulo: 'Sin fecha' }), { ok: true, datos: { titulo: 'Sin fecha', vence_en: null } })
  assert.deepEqual(validarTarea({ titulo: 'x', vence: '2026-02-30' }), { ok: false, error: 'La fecha no es válida' })
  assert.deepEqual(validarTarea({ titulo: ' ' }), { ok: false, error: 'Escribe qué hay que hacer' })
  assert.equal(venceDe('mañana'), null)
  assert.deepEqual(validarCambioTarea({ hecha: true }), { ok: true, datos: { hecha: true } })
  assert.equal(validarCambioTarea({ hecha: 'sí' }).ok, false)
})

test('leerValor y los cambios de una oportunidad', () => {
  assert.equal(leerValor('1,500'), 1500)
  assert.equal(leerValor('$ 1500.50'), 1500.5)
  assert.equal(leerValor(''), 0)
  assert.equal(leerValor(97), 97)
  assert.equal(leerValor('-5'), null)
  assert.equal(leerValor('mil'), null)
  assert.equal(leerValor('1.234'), null)
  assert.equal(leerValor(20_000_000), null)
  const etapas = ['e1', 'e2']
  assert.deepEqual(validarCambioOportunidad({ etapa_id: 'e2' }, etapas), { ok: true, datos: { etapa_id: 'e2' } })
  assert.deepEqual(validarCambioOportunidad({ estado: 'ganada', valor: '2,000' }, etapas), { ok: true, datos: { estado: 'ganada', valor: 2000 } })
  assert.deepEqual(validarCambioOportunidad({ etapa_id: 'de-otro-pipeline' }, etapas), { ok: false, error: 'Esa etapa no es de este pipeline' })
  assert.deepEqual(validarCambioOportunidad({ estado: 'cerrada' }, etapas), { ok: false, error: 'Ese estado no existe' })
  assert.deepEqual(validarCambioOportunidad({}, etapas), { ok: false, error: 'No hay nada que cambiar' })
  const todas = [{ id: 'e1', pipeline_id: 'p1' }]
  assert.deepEqual(validarNuevaOportunidad({ nombre: 'Página web', etapa_id: 'e1', valor: '1500' }, todas), {
    ok: true,
    datos: { nombre: 'Página web', pipeline_id: 'p1', etapa_id: 'e1', valor: 1500 },
  })
  assert.equal(validarNuevaOportunidad({ nombre: 'x', etapa_id: 'nada' }, todas).ok, false)
})

test('historial: unir sin repetir, lo más nuevo arriba y por día de Costa Rica', () => {
  const m = (id: string, enviado_en: string) => ({ id, enviado_en })
  const primera = [m('c', '2026-10-30T16:00:00Z'), m('b', '2026-10-30T05:30:00Z')]
  const mas = [m('b', '2026-10-30T05:30:00Z'), m('a', '2026-10-28T16:00:00Z'), m('a2', '2026-10-28T16:00:00Z')]
  const todos = unirMensajes(primera, mas)
  assert.deepEqual(todos.map((x) => x.id), ['c', 'b', 'a2', 'a'])
  // Las 23:30 del jueves (05:30 UTC del viernes) van en el jueves
  assert.deepEqual(porDia(todos).map(([dia, lista]) => [dia, lista.map((x) => x.id)]), [
    ['2026-10-30', ['c']],
    ['2026-10-29', ['b']],
    ['2026-10-28', ['a2', 'a']],
  ])
  assert.equal(nombreDelDia('2026-10-30', AHORA), 'Hoy')
  assert.equal(nombreDelDia('2026-10-29', AHORA), 'Ayer')
  assert.equal(nombreDelDia('2026-10-28', AHORA), 'miércoles 28 de octubre')
  assert.equal(nombreDelDia('2025-12-31', AHORA), 'miércoles 31 de diciembre de 2025')
})

test('textoLlamada y esLargo', () => {
  assert.equal(textoLlamada('saliente', { estado: 'contestada', segundos: 95 }), 'Llamaste · 2 min')
  assert.equal(textoLlamada('entrante', { estado: 'sin_respuesta' }), 'Te llamó · no contestó')
  assert.equal(textoLlamada(null, null), 'Llamaste')
  assert.equal(esLargo('corto'), false)
  assert.equal(esLargo('x'.repeat(500)), true)
  assert.equal(esLargo('a\nb\nc\nd\ne\nf\ng\nh\ni'), true)
  assert.equal(esLargo(null), false)
})

test('leerCursor: solo una fecha de la base y un id', () => {
  const id = '6f1c2b3a-4d5e-4f60-8a7b-9c0d1e2f3a4b'
  assert.deepEqual(leerCursor('2026-10-29T02:21:58.185+00:00', id), { en: '2026-10-29T02:21:58.185+00:00', id })
  assert.deepEqual(leerCursor('2026-10-29T02:21:58.123456Z', id), { en: '2026-10-29T02:21:58.123456Z', id })
  assert.equal(leerCursor('2026-10-29),id.gt.(0', id), null)
  assert.equal(leerCursor('2026-10-29T02:21:58Z', 'nope'), null)
})
