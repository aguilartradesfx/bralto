import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DE_LADO, escribirDireccion, estadoConMarca, leerDireccion, type Direccion, type Pestana, type Seccion } from './direccion.ts'

const UUID = '3f2a9c4e-1b7d-4e8a-9c0f-5d6e7f8a9b0c'
const d = (pestana: Pestana, modo: Direccion['modo'] = null, seccion: Seccion | null = null, foco: string | null = null): Direccion => ({
  pestana, modo, seccion, foco,
})

test('las secciones que se pueden ver al lado, en el orden del selector', () => {
  assert.deepEqual(DE_LADO, ['parati', 'chat', 'ahora', 'dia'])
})

test('una sección al lado o en grande, en la oficina y en el plano', () => {
  assert.deepEqual(leerDireccion('#oficina/lado/chat'), d('oficina', 'lado', 'chat'))
  assert.deepEqual(leerDireccion('#oficina/chat'), d('oficina', 'grande', 'chat'))
  assert.deepEqual(leerDireccion('#plano/lado/parati'), d('plano', 'lado', 'parati'))
  assert.deepEqual(leerDireccion('#plano/ahora'), d('plano', 'grande', 'ahora'))
  assert.deepEqual(leerDireccion('#oficina/lado/dia'), d('oficina', 'lado', 'dia'))
  assert.deepEqual(leerDireccion('#plano/dia'), d('plano', 'grande', 'dia'))
})

test('la maqueta y el plano abren en grande, cada uno en su pestaña; al lado se ignora', () => {
  assert.deepEqual(leerDireccion('#oficina/maqueta'), d('oficina', 'grande', 'maqueta'))
  assert.deepEqual(leerDireccion('#plano/plano'), d('plano', 'grande', 'plano'))
  assert.deepEqual(leerDireccion('#oficina/lado/maqueta'), d('oficina'))
  assert.deepEqual(leerDireccion('#plano/lado/plano'), d('plano'))
  assert.deepEqual(leerDireccion('#plano/maqueta'), d('plano'))
  assert.deepEqual(leerDireccion('#oficina/plano'), d('oficina'))
})

test('una sección en una pestaña que no es la suya se ignora (queda la pestaña)', () => {
  assert.deepEqual(leerDireccion('#foro/chat'), d('foro'))
  assert.deepEqual(leerDireccion('#ideas/lado/parati'), d('ideas'))
  assert.deepEqual(leerDireccion('#foro/maqueta'), d('foro'))
})

test('el foro y las ideas llevan foco (el id de un post o de una idea)', () => {
  assert.deepEqual(leerDireccion(`#foro/${UUID}`), d('foro', null, null, UUID))
  assert.deepEqual(leerDireccion(`#ideas/${UUID}`), d('ideas', null, null, UUID))
  assert.deepEqual(leerDireccion('#foro'), d('foro'))
  assert.deepEqual(leerDireccion('#ideas'), d('ideas'))
  assert.deepEqual(leerDireccion('#ideas/no-es-un-id'), d('ideas'))
  assert.deepEqual(leerDireccion(`#foro/${UUID}/de-mas`), d('foro'))
  // en la oficina y el plano un id no es una sección
  assert.deepEqual(leerDireccion(`#oficina/${UUID}`), d('oficina'))
})

test('lo que no se entiende es #oficina', () => {
  for (const h of ['', '#', '#nada', '#nada/chat', '#Oficina', '#oficina/grande/chat', '#oficina/lado', '#oficina/chat/de-mas', 'javascript:alert(1)'])
    assert.deepEqual(leerDireccion(h), d('oficina'), h)
})

test('escribirDireccion vuelve a escribir cada una igual', () => {
  const hashes = [
    '#oficina', '#plano', '#foro', '#ideas',
    '#oficina/lado/chat', '#oficina/chat', '#plano/lado/ahora', '#plano/parati', '#oficina/lado/dia', '#plano/dia',
    '#oficina/maqueta', '#plano/plano', `#foro/${UUID}`, `#ideas/${UUID}`,
  ]
  for (const h of hashes) assert.equal(escribirDireccion(leerDireccion(h)), h)
  // lo que se ignora se escribe solo con la pestaña
  assert.equal(escribirDireccion(leerDireccion('#oficina/lado/maqueta')), '#oficina')
  assert.equal(escribirDireccion(leerDireccion('#foro/chat')), '#foro')
  assert.equal(escribirDireccion(leerDireccion('#nada')), '#oficina')
  assert.equal(escribirDireccion(leerDireccion('')), '#oficina')
})

test('el estado de la historia guarda lo que ya tenía (las llaves de Next.js) y solo cambia la marca', () => {
  // sin __NA, Next.js recarga la página al volver a esa entrada
  const deNext = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: ['', { children: ['knox-office', {}] }] }
  const marcado = estadoConMarca(deNext, 'oficinaAbrio', 'carga-1')
  assert.deepEqual(marcado, { ...deNext, oficinaAbrio: 'carga-1' })
  assert.notEqual(marcado, deNext)
  assert.equal('oficinaAbrio' in deNext, false, 'no toca el estado que había')
  assert.deepEqual(estadoConMarca(marcado, 'oficinaAbrio', null), { ...deNext, oficinaAbrio: null })
  // sin estado, o con uno que no es un objeto, queda solo la marca
  assert.deepEqual(estadoConMarca(null, 'oficinaAbrio', 'carga-1'), { oficinaAbrio: 'carga-1' })
  assert.deepEqual(estadoConMarca('texto', 'oficinaAbrio', null), { oficinaAbrio: null })
  assert.deepEqual(estadoConMarca(['x'], 'oficinaAbrio', null), { oficinaAbrio: null })
})

test('escribirDireccion no escribe lo que no cuadra', () => {
  assert.equal(escribirDireccion(d('oficina', 'lado', 'maqueta')), '#oficina')
  assert.equal(escribirDireccion(d('plano', 'grande', 'maqueta')), '#plano')
  assert.equal(escribirDireccion(d('foro', 'lado', 'chat')), '#foro')
  assert.equal(escribirDireccion(d('oficina', null, 'chat')), '#oficina')
  assert.equal(escribirDireccion(d('oficina', 'grande', null)), '#oficina')
  // el foco solo va en el foro y las ideas, y solo si es un id
  assert.equal(escribirDireccion(d('oficina', null, null, UUID)), '#oficina')
  assert.equal(escribirDireccion(d('ideas', null, null, 'no-es-un-id')), '#ideas')
})
