import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adjuntoLabel, cuandoVuelve, estadoKnox, leerCuantas, leerFiltro, nombreConversacion, textoHistoria, vistaPrevia } from './vista.ts'
import { validarAjustes, validarEnvio, validarPrueba } from './validar.ts'

const AHORA = new Date('2026-10-30T21:00:00Z')

test('leerFiltro y leerCuantas: lo de la URL, con valores seguros', () => {
  assert.equal(leerFiltro('trabajo'), 'trabajo')
  assert.equal(leerFiltro('todas'), 'todas')
  assert.equal(leerFiltro('cualquier-cosa'), 'por_responder')
  assert.equal(leerFiltro(undefined), 'por_responder')
  assert.equal(leerCuantas(undefined), 50)
  assert.equal(leerCuantas('100'), 100)
  assert.equal(leerCuantas('73'), 100)
  assert.equal(leerCuantas('-5'), 50)
  assert.equal(leerCuantas('99999'), 500)
})

test('nombreConversacion: contacto, nombre de la red, @ o número', () => {
  assert.equal(nombreConversacion({ contacto: 'Ana Prueba', nombre: 'ana' }), 'Ana Prueba')
  assert.equal(nombreConversacion({ nombre: ' Beto Prueba ', usuario: 'beto' }), 'Beto Prueba')
  assert.equal(nombreConversacion({ usuario: 'carla.prueba' }), '@carla.prueba')
  assert.equal(nombreConversacion({ telefono: '+13055550100' }), '+1 305 555 0100')
  assert.equal(nombreConversacion({}), 'Sin nombre')
})

test('vistaPrevia: el último mensaje en una línea, con quién lo mandó si salió', () => {
  assert.equal(vistaPrevia({ texto: 'Hola,\n¿cómo vas?', autor: 'persona', direccion: 'entrante', adjunto: null }), 'Hola, ¿cómo vas?')
  assert.equal(vistaPrevia({ texto: null, autor: 'persona', direccion: 'entrante', adjunto: 'foto' }), 'Foto')
  assert.equal(vistaPrevia({ texto: 'Te escribo', autor: 'ale', direccion: 'saliente', adjunto: null }), 'Ale: Te escribo')
  assert.equal(vistaPrevia({ texto: 'Hola', autor: 'knox', direccion: 'saliente', adjunto: null }), 'Knox: Hola')
  assert.equal(vistaPrevia({ texto: 'Tu guía', autor: 'automatizacion', direccion: 'saliente', adjunto: null }), 'Automático: Tu guía')
  assert.equal(vistaPrevia({ texto: '', autor: null, direccion: 'entrante', adjunto: null }), 'Mensaje')
})

test('adjuntoLabel y textoHistoria', () => {
  assert.equal(adjuntoLabel('publicación compartida'), 'Publicación compartida')
  assert.equal(adjuntoLabel('algo-nuevo'), 'Archivo')
  assert.equal(adjuntoLabel(null), null)
  assert.equal(textoHistoria('respuesta'), 'Respondió a tu historia')
  assert.equal(textoHistoria('mencion'), 'Te mencionó en su historia')
  assert.equal(textoHistoria(null), null)
})

test('estadoKnox: prendido, en pausa hasta una hora o apagado en la conversación', () => {
  assert.deepEqual(estadoKnox(null, AHORA), { activo: true, siempre: false, hasta: null })
  assert.deepEqual(estadoKnox('infinity', AHORA), { activo: false, siempre: true, hasta: null })
  assert.deepEqual(estadoKnox('2026-10-31T09:00:00Z', AHORA), { activo: false, siempre: false, hasta: '2026-10-31T09:00:00Z' })
  assert.deepEqual(estadoKnox('2026-10-30T09:00:00Z', AHORA), { activo: true, siempre: false, hasta: null })
})

test('validarEnvio: texto y una clave de idempotencia con forma', () => {
  assert.deepEqual(validarEnvio({ texto: ' Hola ', clave: '6f1c2b3a-4d5e-4f60-8a7b-9c0d1e2f3a4b' }), {
    ok: true,
    datos: { texto: 'Hola', clave: '6f1c2b3a-4d5e-4f60-8a7b-9c0d1e2f3a4b' },
  })
  assert.equal(validarEnvio({ texto: '', clave: '6f1c2b3a-4d5e' }).ok, false)
  assert.equal(validarEnvio({ texto: 'Hola', clave: 'corta' }).ok, false)
  assert.equal(validarEnvio({ texto: 'Hola', clave: 'con espacios y comillas"' }).ok, false)
  assert.equal(validarEnvio(null).ok, false)
})

test('validarAjustes: el modo de la lista y la ficha como texto', () => {
  assert.deepEqual(validarAjustes({ modo: 'automatico' }), { ok: true, datos: { modo: 'automatico' } })
  assert.deepEqual(validarAjustes({ ficha: '  Servicios\r\nPrecios  ' }), { ok: true, datos: { ficha: 'Servicios\nPrecios' } })
  assert.deepEqual(validarAjustes({ ficha: '' }), { ok: true, datos: { ficha: '' } })
  assert.deepEqual(validarAjustes({ modo: 'turbo' }), { ok: false, error: 'Ese modo no existe' })
  assert.equal(validarAjustes({ ficha: 'x'.repeat(20_001) }).ok, false)
  assert.deepEqual(validarAjustes({}), { ok: false, error: 'No hay nada que cambiar' })
})

test('validarPrueba: el chat inventado, que termina en un mensaje del cliente', () => {
  const r = validarPrueba(
    { canal: 'whatsapp', mensajes: [{ autor: 'persona', texto: 'Hola' }, { autor: 'knox', texto: '¡Hola! Soy Knox' }, { autor: 'persona', texto: ' ¿Precio? ' }], ficha: 'Ficha inventada' },
    AHORA,
  )
  assert.ok(r.ok)
  assert.equal(r.datos.ficha, 'Ficha inventada')
  assert.equal(r.datos.ctx.canal, 'whatsapp')
  assert.equal(r.datos.ctx.contacto, null)
  assert.deepEqual(
    r.datos.ctx.mensajes.map((m) => [m.autor, m.texto, m.en]),
    [
      ['persona', 'Hola', '2026-10-30T20:58:00.000Z'],
      ['knox', '¡Hola! Soy Knox', '2026-10-30T20:59:00.000Z'],
      ['persona', '¿Precio?', '2026-10-30T21:00:00.000Z'],
    ],
  )
  assert.equal(validarPrueba({ canal: 'instagram', mensajes: [{ autor: 'persona', texto: 'Hola' }] }, AHORA).ok, true)
  assert.deepEqual(validarPrueba({ canal: 'telegram', mensajes: [{ autor: 'persona', texto: 'x' }] }, AHORA), { ok: false, error: 'Elige el canal' })
  assert.deepEqual(validarPrueba({ canal: 'instagram', mensajes: [] }, AHORA), { ok: false, error: 'Escribe un mensaje' })
  assert.deepEqual(validarPrueba({ canal: 'instagram', mensajes: [{ autor: 'persona', texto: 'Hola' }, { autor: 'knox', texto: 'Hola' }] }, AHORA), {
    ok: false,
    error: 'El último mensaje tiene que ser del cliente',
  })
  assert.equal(validarPrueba({ canal: 'instagram', mensajes: [{ autor: 'ale', texto: 'x' }] }, AHORA).ok, false)
  assert.equal(validarPrueba({ canal: 'instagram', mensajes: Array.from({ length: 21 }, () => ({ autor: 'persona', texto: 'x' })) }, AHORA).ok, false)
})

test('cuandoVuelve: la hora en que Knox vuelve, dicha como una persona (hora de Costa Rica)', () => {
  assert.equal(cuandoVuelve('2026-10-31T04:15:00Z', AHORA), 'hoy a las 22:15')
  assert.equal(cuandoVuelve('2026-10-31T15:30:00Z', AHORA), 'mañana a las 09:30')
  assert.equal(cuandoVuelve('2026-11-02T16:00:00Z', AHORA), 'el lunes 2 de noviembre a las 10:00')
})
