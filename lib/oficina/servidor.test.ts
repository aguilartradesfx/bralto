import { test } from 'node:test'
import assert from 'node:assert/strict'
import { idEstado, idsValidos } from './servidor.ts'

test('idEstado lee OFICINA_ESTADO_ID y cae a 1', () => {
  assert.equal(idEstado({ OFICINA_ESTADO_ID: '2' }), 2)
  assert.equal(idEstado({ OFICINA_ESTADO_ID: '1' }), 1)
  assert.equal(idEstado({}), 1)
  assert.equal(idEstado({ OFICINA_ESTADO_ID: '99' }), 1)
})

test('idsValidos deja solo uuids de redes_publicaciones, sin repetir', () => {
  const u = '0b7e3c1a-52d4-4f8e-9a61-2c3d4e5f6a7b'
  const r = (ref_tabla: string | null, ref_id: string | null) => ({ ref_tabla, ref_id })
  assert.deepEqual(idsValidos([
    r('redes_publicaciones', u), r('redes_publicaciones', u), r('redes_publicaciones', 'abc'),
    r('redes_publicaciones', ''), r('redes_publicaciones', null), r('otra_tabla', u),
  ]), [u])
})
