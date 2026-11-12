import { test } from 'node:test'
import assert from 'node:assert/strict'
import { esGrupo, estaActivo, grupoActivo, menuPara, NAV, NAV_PIE, piePara, todosLosItems, tituloDe } from './navegacion.ts'
import { PRONTO } from './pronto.ts'

const ADMIN = { is_admin: true, can_view_contracts: false, can_view_clients: false, can_submit_proposals: false, can_view_proposals: false, can_view_plan: false }
const SOLO_PLAN = { ...ADMIN, is_admin: false, can_view_plan: true }
const NADA = { ...ADMIN, is_admin: false }

test('cada «Próximamente» tiene su página', () => {
  for (const i of todosLosItems()) {
    if (!i.pronto) continue
    const slug = i.href.replace('/pronto/', '')
    assert.ok(PRONTO[slug], `falta PRONTO['${slug}']`)
  }
})

test('las rutas del menú no se repiten', () => {
  const hrefs = todosLosItems().map((i) => i.href)
  assert.deepEqual(hrefs, [...new Set(hrefs)])
})

test('el administrador ve todo el menú', () => {
  assert.deepEqual(menuPara(ADMIN), NAV)
})

test('un colaborador solo ve lo suyo (sin Próximamente ni grupos vacíos)', () => {
  const menu = menuPara(SOLO_PLAN)
  assert.deepEqual(menu.map((e) => (esGrupo(e) ? e.id : e.href)), ['/admin', 'plan'])
  assert.deepEqual(menuPara(NADA).map((e) => (esGrupo(e) ? e.id : e.href)), ['/admin'])
})

test('Contactos queda activo en la lista, en la ficha y en Nuevo contacto; no en Mensajes', () => {
  const contactos = todosLosItems().find((i) => i.href === '/crm')!
  for (const p of ['/crm', '/crm/nuevo', '/crm/3f1c2a7e-1111-4a1a-9a9a-000000000000']) assert.equal(estaActivo(contactos, p), true, p)
  for (const p of ['/crm/mensajes', '/crm/mensajes/abc', '/crm/pipeline', '/crm/knox', '/crm/tareas']) assert.equal(estaActivo(contactos, p), false, p)
})

test('las vistas del Plan Q4 se distinguen por ?vista=', () => {
  const tareas = todosLosItems().find((i) => i.href === '/plan-q4?vista=tareas')!
  const inicio = todosLosItems().find((i) => i.href === '/plan-q4?vista=inicio')!
  assert.equal(estaActivo(tareas, '/plan-q4', 'tareas'), true)
  assert.equal(estaActivo(tareas, '/plan-q4', null), false)
  assert.equal(estaActivo(inicio, '/plan-q4', null), true)
  assert.equal(grupoActivo('/plan-q4', 'etapas'), 'plan')
})

test('el título de arriba y el grupo que se despliega', () => {
  assert.equal(tituloDe('/admin'), 'Inicio')
  assert.equal(tituloDe('/crm'), 'Contactos')
  assert.equal(tituloDe('/crm/mensajes/abc'), 'Mensajes')
  assert.equal(tituloDe('/contratos/nuevo'), 'Contratos')
  assert.equal(tituloDe('/usuarios'), 'Ajustes')
  assert.equal(tituloDe('/pronto/finanzas'), 'Finanzas')
  assert.equal(tituloDe('/pronto/notificaciones'), 'Notificaciones')
  assert.equal(tituloDe('/plan-q4'), 'Plan Q4')
  assert.equal(grupoActivo('/crm/pipeline'), 'crm')
  assert.equal(grupoActivo('/propuestas'), 'ventas')
  assert.equal(grupoActivo('/admin'), null)
})

test('abajo van Ayuda y Ajustes (Ayuda, que viene, solo para administradores)', () => {
  assert.deepEqual(NAV_PIE.map((i) => i.label), ['Ayuda', 'Ajustes'])
  assert.deepEqual(piePara(SOLO_PLAN).map((i) => i.label), ['Ajustes'])
})

test('«Ideas» está en Marketing, después del Calendario, y solo la ve el administrador', () => {
  const marketing = NAV.find((e) => esGrupo(e) && e.id === 'marketing')
  assert.ok(marketing && esGrupo(marketing))
  assert.deepEqual(marketing.items.slice(0, 3).map((i) => i.href), ['/calendario', '/ideas', '/analisis'])
  assert.equal(tituloDe('/ideas'), 'Ideas')
  assert.equal(grupoActivo('/ideas'), 'marketing')
  assert.equal(menuPara(SOLO_PLAN).some((e) => esGrupo(e) && e.items.some((i) => i.href === '/ideas')), false)
  assert.equal(tituloDe('/analisis'), 'Análisis de reels')
  assert.equal(menuPara(SOLO_PLAN).some((e) => esGrupo(e) && e.items.some((i) => i.href === '/analisis')), false)
})
