import { test } from 'node:test'
import assert from 'node:assert/strict'
import { contarFiltros, filtrarIdeas, leerAccion, MAX_INTENTOS, rescatar, temaDeIdea, type IdeaFila } from './cola.ts'
import type { Analisis } from './analisis.ts'
import type { Metricas } from './metricas.ts'

const analisis: Analisis = {
  tema: 'Cómo hacer que una IA te arme un Excel',
  formato: 'a_camara',
  gancho: { texto: '¿Cotizas a mano?', por_que: 'Toca un dolor diario' },
  partes: ['Gancho', 'Resultado', 'Pasos'],
  por_que_pego: ['Promete ahorrar horas'],
  por_que_guardan: 'Son pasos para después',
  herramientas: ['Claude'],
  de_tu_tema: 9,
  tu_version: {
    titulo: 'Tu cotización en 1 minuto',
    idea: 'Una IA te deja la cotización lista en Excel',
    ganchos: ['¿Cotizas a mano?', 'Esto te ahorra 2 horas', 'Mae, deja de copiar y pegar'],
    guion: ['Abres Claude', 'Le pegas lo que vendes', 'Te da el Excel'],
    comenta: 'EXCEL',
  },
}

const metricas = { cuenta: 'una.cuenta', publicado_en: '2026-11-06T00:21:49.000Z' } as Metricas

const fila = (x: Partial<IdeaFila> = {}): IdeaFila => ({
  id: 'idea-1',
  url: 'https://www.instagram.com/p/AAA111/',
  red: 'instagram',
  origen: 'tu',
  estado: 'lista',
  metricas,
  analisis,
  decision: null,
  decidida_en: null,
  tema_id: null,
  error: null,
  intentos: 1,
  creada_en: '2026-11-10T20:00:00.000Z',
  actualizada_en: '2026-11-10T20:01:00.000Z',
  analizada_en: '2026-11-10T20:01:00.000Z',
  ...x,
})

test('«Que lo haga Knox» arma un tema de reel (dato) con prioridad, los ganchos y el guion, y de dónde salió', () => {
  const t = temaDeIdea(fila())
  assert.equal(t.clave, 'idea:idea-1')
  assert.equal(t.tipo, 'dato')
  assert.equal(t.titulo, 'Tu cotización en 1 minuto')
  assert.equal(t.dato, 'Una IA te deja la cotización lista en Excel')
  assert.equal(t.puntaje, 10)
  assert.equal(t.estado, 'candidato')
  assert.deepEqual(t.herramientas, ['Claude'])
  assert.deepEqual(t.pasos, [
    'Gancho: ¿Cotizas a mano?',
    'Gancho: Esto te ahorra 2 horas',
    'Gancho: Mae, deja de copiar y pegar',
    'Abres Claude',
    'Le pegas lo que vendes',
    'Te da el Excel',
    'Cierre: Comenta EXCEL',
  ])
  assert.deepEqual(t.origenes, [{ tipo: 'instagram', url: 'https://www.instagram.com/p/AAA111/', cuenta: 'una.cuenta', fecha: '2026-11-06T00:21:49.000Z' }])
})

test('una idea sin análisis no se le puede pasar a Knox', () => {
  assert.throws(() => temaDeIdea(fila({ analisis: null, estado: 'pendiente' })))
})

test('las acciones del panel', () => {
  assert.deepEqual(leerAccion({ accion: 'knox' }), { ok: true, accion: 'knox' })
  assert.deepEqual(leerAccion({ accion: 'yo' }), { ok: true, accion: 'yo' })
  assert.deepEqual(leerAccion({ accion: 'descartar' }), { ok: true, accion: 'descartar' })
  assert.deepEqual(leerAccion({ accion: 'deshacer' }), { ok: true, accion: 'deshacer' })
  assert.deepEqual(leerAccion({ accion: 'reintentar' }), { ok: true, accion: 'reintentar' })
  assert.equal(leerAccion({ accion: 'borrar' }).ok, false)
  assert.equal(leerAccion(null).ok, false)
})

test('una idea trabada «analizando» vuelve a la cola, y al tercer intento queda con error', () => {
  const ahora = new Date('2026-11-10T20:30:00.000Z')
  const vieja = { estado: 'analizando' as const, actualizada_en: '2026-11-10T20:00:00.000Z' }
  assert.deepEqual(rescatar({ ...vieja, intentos: 1 }, ahora), { estado: 'pendiente' })
  assert.deepEqual(rescatar({ ...vieja, intentos: MAX_INTENTOS }, ahora), { estado: 'error', error: 'El análisis se cortó varias veces. Prueba de nuevo.' })
  assert.equal(rescatar({ estado: 'analizando', actualizada_en: '2026-11-10T20:25:00.000Z', intentos: 1 }, ahora), null)
  assert.equal(rescatar({ ...vieja, estado: 'lista', intentos: 1 }, ahora), null)
})

test('los filtros: nuevas (sin decidir), para Knox, las que grabas tú y descartadas', () => {
  const ideas = [
    fila({ id: 'a' }),
    fila({ id: 'b', estado: 'pendiente', analisis: null }),
    fila({ id: 'c', decision: 'knox' }),
    fila({ id: 'd', decision: 'yo' }),
    fila({ id: 'e', decision: 'descartada' }),
    fila({ id: 'f', estado: 'error', analisis: null, error: 'x' }),
  ]
  assert.deepEqual(filtrarIdeas(ideas, 'nuevas').map((i) => i.id), ['a', 'b', 'f'])
  assert.deepEqual(filtrarIdeas(ideas, 'knox').map((i) => i.id), ['c'])
  assert.deepEqual(filtrarIdeas(ideas, 'yo').map((i) => i.id), ['d'])
  assert.deepEqual(filtrarIdeas(ideas, 'descartadas').map((i) => i.id), ['e'])
  assert.deepEqual(contarFiltros(ideas), { nuevas: 3, knox: 1, yo: 1, descartadas: 1 })
})
