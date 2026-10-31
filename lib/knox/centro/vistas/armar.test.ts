import { test } from 'node:test'
import assert from 'node:assert/strict'
import { armarMovidas, armarPipelines, comentariosRecientes, diasAgenda, leadsDelMes, posicionesDia, programadas, rangoDia, topPosts } from './armar.ts'
import { esVista, esVistaConDatos, leerVista } from './tipos.ts'
import type { PostTop } from './tipos.ts'

// Viernes 30 de octubre, 17:42 en Costa Rica
const AHORA = new Date('2026-10-30T23:42:00Z')
const cr = (dia: string, hora: string) => new Date(`${dia}T${hora}:00-06:00`).toISOString()

test('las vistas: Hoy si no se entiende', () => {
  assert.equal(leerVista('ventas'), 'ventas')
  assert.equal(leerVista('otra'), 'hoy')
  assert.equal(leerVista(undefined), 'hoy')
  assert.equal(esVista('conexiones'), true)
  assert.equal(esVistaConDatos('hoy'), false)
  assert.equal(esVistaConDatos('agenda'), true)
})

test('ventas: las abiertas de cada pipeline por etapa, en orden, con cuántas y cuánto suman', () => {
  const pipelines = [
    { id: 'p2', nombre: 'Otro', orden: 2 },
    { id: 'p1', nombre: 'Clientes nuevos', orden: 1 },
    { id: 'p3', nombre: 'Vacío', orden: 3 },
  ]
  const etapas = [
    { id: 'e2', nombre: 'Etapa dos', orden: 2, pipeline_id: 'p1' },
    { id: 'e1', nombre: 'Etapa uno', orden: 1, pipeline_id: 'p1' },
    { id: 'e9', nombre: 'Única', orden: 1, pipeline_id: 'p2' },
  ]
  const abiertas = [
    { pipeline_id: 'p1', etapa_id: 'e1', valor: '1500.50' },
    { pipeline_id: 'p1', etapa_id: 'e1', valor: 0 },
    { pipeline_id: 'p1', etapa_id: 'e2', valor: null },
  ]
  const r = armarPipelines(pipelines, etapas, abiertas)
  assert.deepEqual(
    r.map((p) => p.nombre),
    ['Clientes nuevos', 'Otro'],
  )
  assert.deepEqual(r[0], {
    nombre: 'Clientes nuevos',
    abiertas: 3,
    valor: 1500.5,
    etapas: [
      { nombre: 'Etapa uno', cuantas: 2, valor: 1500.5 },
      { nombre: 'Etapa dos', cuantas: 1, valor: 0 },
    ],
  })
  assert.equal(r[1].abiertas, 0)
})

test('ventas: lo último que se movió, con su etapa', () => {
  const movidas = armarMovidas(
    [
      { nombre: 'Vieja', valor: 0, estado: 'abierta', etapa_id: 'e1', cambio_etapa_en: cr('2026-08-18', '13:00'), actualizado_en: cr('2026-10-01', '00:00'), contacto: 'Persona A' },
      { nombre: 'Nueva', valor: '200', estado: 'ganada', etapa_id: 'e2', cambio_etapa_en: cr('2026-10-29', '09:00'), actualizado_en: cr('2026-10-29', '09:00'), contacto: null },
      { nombre: 'Sin fecha', valor: 0, estado: 'abierta', etapa_id: 'x', cambio_etapa_en: null, actualizado_en: cr('2026-10-10', '00:00'), contacto: 'Persona C' },
    ],
    [
      { id: 'e1', nombre: 'Etapa uno' },
      { id: 'e2', nombre: 'Etapa dos' },
    ],
    2,
  )
  assert.deepEqual(
    movidas.map((m) => [m.nombre, m.etapa, m.contacto, m.valor]),
    [
      ['Nueva', 'Etapa dos', 'Sin contacto', 200],
      ['Sin fecha', '—', 'Persona C', 0],
    ],
  )
})

test('ventas: las personas nuevas de 30 días, por canal y día por día', () => {
  const l = leadsDelMes(
    [
      { clave: 'a', en: cr('2026-10-30', '09:00'), canal: 'Instagram' },
      { clave: 'b', en: cr('2026-10-30', '10:00'), canal: 'Sitio web' },
      { clave: 'c', en: cr('2026-10-01', '10:00'), canal: 'Instagram' }, // el primer día de los 30
      { clave: 'd', en: cr('2026-09-30', '10:00'), canal: 'WhatsApp' }, // fuera
    ],
    AHORA,
  )
  assert.equal(l.total, 3)
  assert.equal(l.desde, '2026-10-01')
  assert.equal(l.porDia.length, 30)
  assert.equal(l.porDia[0], 1)
  assert.equal(l.porDia[29], 2)
  assert.deepEqual(
    l.porCanal.map((c) => [c.canal, c.total]),
    [
      ['Instagram', 2],
      ['Sitio web', 1],
      ['WhatsApp', 0],
      ['Messenger', 0],
    ],
  )
})

const post = (titulo: string, vistas: number | null): PostTop => ({
  cuenta: 'cuenta.prueba',
  titulo,
  tipo: 'reel',
  en: cr('2026-10-20', '10:00'),
  imagen: null,
  enlace: null,
  vistas,
  alcance: null,
  guardados: null,
  compartidos: null,
})

test('redes: las de más vistas, los comentarios de otros y lo que sale', () => {
  assert.deepEqual(
    topPosts([post('a', 10), post('b', null), post('c', 300), post('d', 50)], 3).map((p) => p.titulo),
    ['c', 'd', 'a'],
  )
  const comentarios = comentariosRecientes(
    [
      { usuario: 'otra.persona', texto: 'Me encanta', en: cr('2026-10-30', '10:00'), publicacion: 'x' },
      { usuario: 'Cuenta.Prueba', texto: 'Gracias', en: cr('2026-10-30', '11:00'), publicacion: 'x' }, // propia
      { usuario: 'alguien', texto: 'Viejo', en: cr('2026-10-01', '11:00'), publicacion: 'x' }, // antes de la semana
      { usuario: 'alguien', texto: '¿Precio?', en: cr('2026-10-30', '12:00'), publicacion: 'x' },
    ],
    new Set(['cuenta.prueba']),
    new Date(cr('2026-10-23', '17:42')),
  )
  assert.deepEqual(
    comentarios.map((c) => c.texto),
    ['¿Precio?', 'Me encanta'],
  )
  assert.deepEqual(
    programadas(
      [
        { titulo: 'Mañana', tipo: 'reel', estado: 'programado', publicar_en: cr('2026-10-31', '10:00') },
        { titulo: 'Cancelado', tipo: 'reel', estado: 'cancelado', publicar_en: cr('2026-10-31', '11:00') },
        { titulo: 'Ya pasó', tipo: 'carrusel', estado: 'publicado', publicar_en: cr('2026-10-30', '10:00') },
        { titulo: 'Hace un rato', tipo: 'carrusel', estado: 'publicando', publicar_en: cr('2026-10-30', '17:30') },
      ],
      AHORA,
    ).map((p) => p.titulo),
    ['Hace un rato', 'Mañana'],
  )
})

test('agenda: la regla de horas y dónde va cada cosa, sin taparse ni salirse', () => {
  assert.deepEqual(rangoDia([9.5, 15, 18], 17.7), { desde: 8, hasta: 20 })
  assert.deepEqual(rangoDia([6.5, 22.5], null), { desde: 6, hasta: 24 })
  assert.deepEqual(rangoDia([], 23.2), { desde: 8, hasta: 24 })
  const rango = { desde: 8, hasta: 20 }
  // 12 horas en 600 px: 50 px por hora
  assert.deepEqual(posicionesDia([9, 15], 600, rango), [40, 340])
  // Dos a la misma hora: la segunda baja lo justo para no taparse
  const juntas = posicionesDia([10, 10, 10.25], 600, rango)!
  assert.deepEqual(juntas, [90, 148, 206])
  // La última no se sale por abajo
  const tarde = posicionesDia([19.9, 19.95], 600, rango)!
  assert.ok(tarde[1] + 52 <= 600 && tarde[1] - tarde[0] >= 58)
  // Si no caben, en lista
  assert.equal(posicionesDia([9, 10, 11], 120, rango), null)
  assert.deepEqual(posicionesDia([], 600, rango), [])
})

test('agenda: hoy y mañana con sus citas, posts y tareas', () => {
  const dias = diasAgenda(
    {
      citas: [
        { titulo: 'Cita de hoy', inicio: cr('2026-10-30', '15:00') },
        { titulo: 'Cita de mañana', inicio: cr('2026-10-31', '09:00') },
        { titulo: 'Cita de pasado', inicio: cr('2026-11-01', '09:00') },
      ],
      posts: [{ titulo: 'Post de mañana', tipo: 'reel', estado: 'programado', publicar_en: cr('2026-10-31', '08:00') }],
      tareas: [{ titulo: 'Tarea de hoy', vence_en: cr('2026-10-30', '19:00'), hecha: false, contacto: null }],
    },
    AHORA,
  )
  assert.deepEqual(
    dias.map((d) => [d.dia, d.items.map((i) => i.titulo)]),
    [
      ['2026-10-30', ['Cita de hoy', 'Tarea de hoy']],
      ['2026-10-31', ['Post de mañana', 'Cita de mañana']],
    ],
  )
  // Lista para más días cuando la agenda los traiga
  assert.equal(diasAgenda({ citas: [], posts: [], tareas: [] }, AHORA, 7).length, 7)
})
