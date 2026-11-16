import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filasTeToca } from './te-toca.ts'

test('filasTeToca: texto, sub, botón y enlace de cada fila, en el orden de las fuentes', () => {
  assert.deepEqual(filasTeToca([
    { clave: 'mensajes', n: 12, clientes: 3 },
    { clave: 'tareas', n: 2 },
    { clave: 'grabar', n: 2 },
    { clave: 'ideas', n: 3 },
  ]), [
    { clave: 'mensajes', n: 12, texto: '12 mensajes por contestar', sub: '3 son clientes posibles', boton: 'Abrir Mensajes', href: '/crm/mensajes?filtro=por_responder' },
    { clave: 'tareas', n: 2, texto: '2 tareas del CRM para hoy', sub: 'Vencen hoy o ya vencieron', boton: 'Abrir Tareas', href: '/crm/tareas' },
    { clave: 'grabar', n: 2, texto: '2 ideas que dijiste «Lo grabo yo»', sub: 'Te esperan para grabar', boton: 'Abrir Ideas', href: '/ideas?f=yo' },
    { clave: 'ideas', n: 3, texto: '3 ideas nuevas del equipo', sub: 'Salieron del chat y del foro', boton: 'Ver ideas', href: '#ideas' },
  ])
})

test('filasTeToca: en singular cuando es 1', () => {
  const r = filasTeToca([
    { clave: 'mensajes', n: 1, clientes: 1 },
    { clave: 'tareas', n: 1 },
    { clave: 'grabar', n: 1 },
    { clave: 'ideas', n: 1 },
  ])
  assert.deepEqual(r.map((f) => [f.texto, f.sub]), [
    ['1 mensaje por contestar', '1 es cliente posible'],
    ['1 tarea del CRM para hoy', 'Vence hoy o ya venció'],
    ['1 idea que dijiste «Lo grabo yo»', 'Te espera para grabar'],
    ['1 idea nueva del equipo', 'Salió del chat o del foro'],
  ])
})

test('filasTeToca: lo que está en 0 no sale, y sin clientes posibles no hay sub', () => {
  const r = filasTeToca([
    { clave: 'mensajes', n: 4, clientes: 0 },
    { clave: 'tareas', n: 0 },
    { clave: 'grabar', n: 0 },
    { clave: 'ideas', n: 2 },
  ])
  assert.deepEqual(r.map((f) => f.clave), ['mensajes', 'ideas'])
  assert.equal(r[0].sub, '')
  assert.deepEqual(filasTeToca([{ clave: 'mensajes', n: 0, clientes: 2 }]), [])
  assert.deepEqual(filasTeToca([]), [])
})

test('filasTeToca: respeta el orden en que llegan las cuentas', () => {
  const r = filasTeToca([{ clave: 'ideas', n: 1 }, { clave: 'grabar', n: 5 }, { clave: 'mensajes', n: 2, clientes: 0 }])
  assert.deepEqual(r.map((f) => f.clave), ['ideas', 'grabar', 'mensajes'])
  assert.equal(r[0].href, '#ideas')
})
