import { test } from 'node:test'
import assert from 'node:assert/strict'
import { desdeGuiones, filasTeToca } from './te-toca.ts'

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

const HOY = '2026-11-16'
const g = (n: number, dia: string, titulo = `Guion ${n}`) => ({ id: `3f1c2a7e-1111-4a1a-9a9a-00000000000${n}`, titulo, dia })

test('desdeGuiones: hoy menos 2 días (también al cambiar de mes)', () => {
  assert.equal(desdeGuiones('2026-11-16'), '2026-11-14')
  assert.equal(desdeGuiones('2026-12-01'), '2026-11-29')
  assert.equal(desdeGuiones('2027-01-01'), '2026-12-30')
})

test('filasTeToca: una fila por guion por grabar, cada una con su ancla en /guiones y para qué día es', () => {
  const r = filasTeToca([{ clave: 'guiones', n: 2, hoy: HOY, guiones: [g(1, '2026-11-17', 'Ordena tus pedidos'), g(2, '2026-11-16', 'Cobra por internet')] }])
  assert.deepEqual(r, [
    { clave: `guion:${g(1, '').id}`, n: 1, texto: 'Por grabar: «Ordena tus pedidos»', sub: 'Para mañana, martes 17 de noviembre', boton: 'Abrir el guion', href: `/guiones#${g(1, '').id}` },
    { clave: `guion:${g(2, '').id}`, n: 1, texto: 'Por grabar: «Cobra por internet»', sub: 'Para hoy, lunes 16 de noviembre', boton: 'Abrir el guion', href: `/guiones#${g(2, '').id}` },
  ])
  // cada fila con su propia clave: la Oficina las usa como key
  assert.equal(new Set(r.map((f) => f.clave)).size, r.length)
})

test('filasTeToca: solo los de hace 2 días en adelante; los más viejos ya no salen (siguen en /guiones)', () => {
  const r = filasTeToca([
    { clave: 'guiones', n: 5, hoy: HOY, guiones: [g(1, '2026-11-17'), g(2, '2026-11-16'), g(3, '2026-11-15'), g(4, '2026-11-14'), g(5, '2026-11-13')] },
  ])
  assert.deepEqual(r.map((f) => f.sub.split(',')[0]), ['Para mañana', 'Para hoy', 'Para el domingo 15 de noviembre', 'Para el sábado 14 de noviembre'])
  assert.deepEqual(filasTeToca([{ clave: 'guiones', n: 1, hoy: HOY, guiones: [g(5, '2026-11-13')] }]), [])
  assert.deepEqual(filasTeToca([{ clave: 'guiones', n: 0, hoy: HOY, guiones: [] }]), [])
})

test('filasTeToca: un título larguísimo se corta', () => {
  const [f] = filasTeToca([{ clave: 'guiones', n: 1, hoy: HOY, guiones: [g(1, HOY, 'Palabra '.repeat(20).trim())] }])
  assert.ok(f.texto.length <= 'Por grabar: «»'.length + 70, f.texto)
  assert.match(f.texto, /…»$/)
})

test('filasTeToca: los guiones van en el lugar de su fuente, junto a las demás filas', () => {
  const r = filasTeToca([
    { clave: 'grabar', n: 1 },
    { clave: 'guiones', n: 2, hoy: HOY, guiones: [g(1, HOY), g(2, HOY)] },
    { clave: 'ideas', n: 1 },
  ])
  assert.deepEqual(r.map((f) => f.clave), ['grabar', `guion:${g(1, '').id}`, `guion:${g(2, '').id}`, 'ideas'])
})
