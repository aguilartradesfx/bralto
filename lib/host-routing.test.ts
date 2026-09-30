import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hostKind, isPanelPath, isPrivateSurface, PRIVATE_SURFACE_JS, resolveHostRouting } from './host-routing.ts'

test('hostKind reconoce hosts con mayúsculas y puerto', () => {
  assert.equal(hostKind('Admin.Bralto.io:443'), 'admin')
  assert.equal(hostKind('admin.bralto.io'), 'admin')
  assert.equal(hostKind('www.bralto.io'), 'public')
  assert.equal(hostKind('bralto.io'), 'public')
  assert.equal(hostKind('localhost:3000'), 'other')
  assert.equal(hostKind('bralto-git-feat-fusion.vercel.app'), 'other')
  assert.equal(hostKind(null), 'other')
})

test('isPanelPath: secciones del panel y login', () => {
  for (const p of ['/admin', '/contratos', '/contratos/nuevo', '/contratos/abc/editar', '/clientes',
    '/solicitudes', '/solicitudes/nueva', '/usuarios', '/login', '/propuestas']) {
    assert.equal(isPanelPath(p), true, p)
  }
})

test('isPanelPath: rutas públicas y falsos prefijos', () => {
  for (const p of ['/', '/es', '/es/precios', '/c/abc', '/propuestas/abc123', '/contratosx', '/loginx', '/admin-foo']) {
    assert.equal(isPanelPath(p), false, p)
  }
})

test('admin: la raíz va a /admin', () => {
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/'), { action: 'redirect', url: 'https://admin.bralto.io/admin' })
})

test('admin: las rutas del panel pasan', () => {
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/contratos/abc'), { action: 'next' })
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/login'), { action: 'next' })
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/propuestas'), { action: 'next' })
})

test('admin: links viejos de contratos y propuestas van al sitio público', () => {
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/c/acme-x1y2'), { action: 'redirect', url: 'https://www.bralto.io/c/acme-x1y2' })
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/c/acme-x1y2/firmado'), { action: 'redirect', url: 'https://www.bralto.io/c/acme-x1y2/firmado' })
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/propuestas/abc123'), { action: 'redirect', url: 'https://www.bralto.io/propuestas/abc123' })
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/es/precios', '?plan=87'), { action: 'redirect', url: 'https://www.bralto.io/es/precios?plan=87' })
})

test('admin: /api nunca se redirige (aceptación de propuestas viejas)', () => {
  assert.deepEqual(resolveHostRouting('admin.bralto.io', '/api/proposals/123/accept'), { action: 'next' })
})

test('público: el panel redirige a admin conservando el query', () => {
  assert.deepEqual(resolveHostRouting('www.bralto.io', '/solicitudes', '?success=1'), { action: 'redirect', url: 'https://admin.bralto.io/solicitudes?success=1' })
  assert.deepEqual(resolveHostRouting('bralto.io', '/login'), { action: 'redirect', url: 'https://admin.bralto.io/login' })
  assert.deepEqual(resolveHostRouting('www.bralto.io', '/propuestas'), { action: 'redirect', url: 'https://admin.bralto.io/propuestas' })
})

test('público: sitio y páginas de cliente pasan', () => {
  for (const p of ['/', '/es', '/en/pricing', '/c/acme-x1y2', '/propuestas/abc123']) {
    assert.deepEqual(resolveHostRouting('www.bralto.io', p), { action: 'next' }, p)
  }
})

test('otros hosts (localhost, previews): todo pasa', () => {
  assert.deepEqual(resolveHostRouting('localhost:3000', '/contratos'), { action: 'next' })
  assert.deepEqual(resolveHostRouting('localhost:3000', '/es'), { action: 'next' })
  assert.deepEqual(resolveHostRouting('bralto-git-x.vercel.app', '/login'), { action: 'next' })
})

const SURFACES: [host: string, pathname: string, isPrivate: boolean][] = [
  ['admin.bralto.io', '/admin', true],
  ['admin.bralto.io', '/login', true],
  ['Admin.Bralto.io', '/contratos/abc', true],
  ['www.bralto.io', '/c/acme-x1y2', true],
  ['www.bralto.io', '/c/acme-x1y2/firmado', true],
  ['localhost', '/solicitudes', true],
  ['www.bralto.io', '/', false],
  ['www.bralto.io', '/es/precios', false],
  ['www.bralto.io', '/propuestas/abc123', false],
  ['www.bralto.io', '/contacto', false],
  ['localhost', '/es', false],
]

test('isPrivateSurface: panel y firma de contratos, sin analítica ni banner de cookies', () => {
  for (const [host, pathname, expected] of SURFACES) {
    assert.equal(isPrivateSurface(host, pathname), expected, `${host}${pathname}`)
  }
})

test('PRIVATE_SURFACE_JS (snippet inline de GTM) decide igual que isPrivateSurface', () => {
  const evaluate = new Function('location', `return ${PRIVATE_SURFACE_JS}`)
  for (const [host, pathname, expected] of SURFACES) {
    // location.hostname del navegador nunca trae puerto
    assert.equal(evaluate({ hostname: host, pathname }), expected, `${host}${pathname}`)
  }
})
