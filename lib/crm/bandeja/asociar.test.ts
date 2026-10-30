import { test } from 'node:test'
import assert from 'node:assert/strict'
import { condicionesIdentidad, identidadesNuevas, nombreDeContacto } from './asociar.ts'

// Ids, @ y números inventados
test('condicionesIdentidad: WhatsApp por número, Instagram por id o @, Messenger por id', () => {
  assert.deepEqual(condicionesIdentidad('whatsapp', { id: '13055550100', usuario: null, telefono: '+13055550100' }), [
    'and(canal.in.(whatsapp,telefono),valor.eq."+13055550100")',
  ])
  assert.deepEqual(condicionesIdentidad('instagram', { id: '1000000000000001', usuario: 'Ana.Prueba', telefono: null }), [
    'and(canal.eq.instagram,valor.eq."1000000000000001")',
    'and(canal.eq.instagram,alias.in.("@ana.prueba","ana.prueba"))',
  ])
  assert.deepEqual(condicionesIdentidad('messenger', { id: '2000000000000002', usuario: null, telefono: null }), ['and(canal.eq.messenger,valor.eq."2000000000000002")'])
  // Sin número no hay con qué buscar en WhatsApp; las comillas y barras no pasan al filtro
  assert.deepEqual(condicionesIdentidad('whatsapp', { id: 'US.abc', usuario: null, telefono: null }), [])
  assert.deepEqual(condicionesIdentidad('messenger', { id: '1"),or(x', usuario: null, telefono: null }), ['and(canal.eq.messenger,valor.eq."1),or(x")'])
})

test('identidadesNuevas: lo que reconoce al contacto la próxima vez', () => {
  assert.deepEqual(identidadesNuevas('c1', 'whatsapp', { id: '13055550100', usuario: null, telefono: '+13055550100' }), [
    { contacto_id: 'c1', canal: 'whatsapp', valor: '+13055550100' },
    { contacto_id: 'c1', canal: 'telefono', valor: '+13055550100' },
  ])
  assert.deepEqual(identidadesNuevas('c1', 'instagram', { id: '1000000000000001', usuario: 'Ana.Prueba', telefono: null }), [
    { contacto_id: 'c1', canal: 'instagram', valor: '1000000000000001', alias: '@ana.prueba' },
  ])
  assert.deepEqual(identidadesNuevas('c1', 'messenger', { id: '2000000000000002', usuario: null, telefono: null }), [
    { contacto_id: 'c1', canal: 'messenger', valor: '2000000000000002' },
  ])
  assert.deepEqual(identidadesNuevas('c1', 'instagram', { id: null, usuario: 'x', telefono: null }), [])
})

test('nombreDeContacto: el de la red, lo que contó o su @', () => {
  assert.equal(nombreDeContacto({ nombre: ' Ana Prueba ', usuario: 'ana' }, 'Ana'), 'Ana Prueba')
  assert.equal(nombreDeContacto({ nombre: null, usuario: 'ana' }, 'Ana Contada'), 'Ana Contada')
  assert.equal(nombreDeContacto({ nombre: null, usuario: 'ana.prueba' }, null), '@ana.prueba')
  assert.equal(nombreDeContacto({ nombre: null, usuario: null }, null), '')
})
