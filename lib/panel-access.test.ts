import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apiAccessStatus, hasPermission, requiredPermission } from './panel-access.ts'

function profile(overrides: Partial<Record<string, boolean>> = {}) {
  return {
    is_admin: false,
    can_view_contracts: false,
    can_view_clients: false,
    can_submit_proposals: false,
    can_view_proposals: false,
    ...overrides,
  }
}

test('requiredPermission por sección', () => {
  assert.equal(requiredPermission('/admin'), null)
  assert.equal(requiredPermission('/login'), null)
  assert.equal(requiredPermission('/contratos'), 'can_view_contracts')
  assert.equal(requiredPermission('/contratos/abc/editar'), 'can_view_contracts')
  assert.equal(requiredPermission('/clientes'), 'can_view_clients')
  assert.equal(requiredPermission('/solicitudes/nueva'), 'can_submit_proposals')
  assert.equal(requiredPermission('/propuestas'), 'can_view_proposals')
  assert.equal(requiredPermission('/usuarios'), 'is_admin')
  assert.equal(requiredPermission('/contratosx'), null)
})

test('sin fila en user_profiles: solo lo que no pide permiso', () => {
  assert.equal(hasPermission(null, null), true)
  assert.equal(hasPermission(null, 'can_view_contracts'), false)
  assert.equal(hasPermission(null, 'is_admin'), false)
})

test('admin ve todo', () => {
  const admin = profile({ is_admin: true })
  for (const p of ['can_view_contracts', 'can_view_clients', 'can_submit_proposals', 'can_view_proposals', 'is_admin'] as const) {
    assert.equal(hasPermission(admin, p), true, p)
  }
})

test('colaborador ve solo lo asignado', () => {
  const user = profile({ can_view_clients: true, can_submit_proposals: true })
  assert.equal(hasPermission(user, 'can_view_clients'), true)
  assert.equal(hasPermission(user, 'can_submit_proposals'), true)
  assert.equal(hasPermission(user, 'can_view_contracts'), false)
  assert.equal(hasPermission(user, 'is_admin'), false)
})

test('APIs: sin sesión → 401', () => {
  assert.equal(apiAccessStatus(false, null, ['can_view_contracts']), 401)
})

test('APIs: cuenta sin perfil o sin el permiso → 403', () => {
  assert.equal(apiAccessStatus(true, null, ['can_submit_proposals']), 403)
  assert.equal(apiAccessStatus(true, profile({ can_view_clients: true }), ['can_view_contracts']), 403)
})

test('APIs: basta con uno de los permisos aceptados', () => {
  const soloContratos = profile({ can_view_contracts: true })
  assert.equal(apiAccessStatus(true, soloContratos, ['can_view_clients', 'can_view_contracts']), 200)
  assert.equal(apiAccessStatus(true, profile({ is_admin: true }), ['is_admin']), 200)
})
