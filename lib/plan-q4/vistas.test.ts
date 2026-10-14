import { test } from 'node:test'
import assert from 'node:assert/strict'
import { misTareas, resolveView, resumenEquipo, viewHref } from './vistas.ts'
import type { PlanTask } from './types.ts'

const TODAY = '2026-10-13' // martes; semana del 12 al 18 de octubre

function task(overrides: Partial<PlanTask> = {}): PlanTask {
  return {
    id: 'B8-01', bloque: 'b8', titulo: 'Tarea', responsable: 'alina', apoyo: null, fecha: '2026-10-16',
    tipo: 'unica', estado: 'pendiente', nota: null, origen: 'plan', actualizado_por: null, actualizado_en: null,
    ...overrides,
  }
}
const semanal = (overrides: Partial<PlanTask> = {}) => task({ tipo: 'semanal', estado: null, fecha: '2026-10-12', ...overrides })

test('misTareas: vencidas, esta semana, semanales, próximas, después por mes y hechas', () => {
  const tasks = [
    task({ id: 'V', fecha: '2026-10-10' }),
    task({ id: 'S', fecha: '2026-10-16' }),
    task({ id: 'SH', fecha: '2026-10-15', estado: 'hecho' }),
    semanal({ id: 'W' }),
    task({ id: 'P', fecha: '2026-10-30' }), // dentro de las 2 semanas siguientes (hasta el 1 nov)
    semanal({ id: 'WP', fecha: '2026-10-19' }), // semanal que arranca la semana que viene
    task({ id: 'D1', fecha: '2026-11-03' }),
    semanal({ id: 'WF', fecha: '2026-11-09' }), // semanal que todavía no empieza
    task({ id: 'D2', fecha: '2026-12-02' }),
    task({ id: 'OTRA', responsable: 'ale', fecha: '2026-10-14' }),
  ]
  const m = misTareas(tasks, TODAY, 'alina')
  assert.deepEqual(m.vencidas.map((t) => t.id), ['V'])
  assert.deepEqual(m.semana.map((t) => t.id), ['S'])
  assert.deepEqual(m.semanales.map((t) => t.id), ['W'])
  assert.deepEqual(m.proximas.map((t) => t.id), ['P', 'WP'])
  assert.deepEqual(m.despues.map((g) => [g.mes, g.tareas.map((t) => t.id)]), [[11, ['D1', 'WF']], [12, ['D2']]])
  assert.deepEqual(m.hechas.map((t) => t.id), ['SH'])
  assert.equal(misTareas(tasks, TODAY, 'todos').semana.length, 2)
})

test('resumenEquipo: por persona, lo de esta semana pendiente, vencidas y avance', () => {
  const tasks = [
    task({ id: 'A', responsable: 'ale', fecha: '2026-10-14' }),
    task({ id: 'B', responsable: 'ale', fecha: '2026-10-05' }),
    task({ id: 'C', responsable: 'ale', fecha: '2026-10-01', estado: 'hecho' }),
    semanal({ id: 'W1', responsable: 'ale' }),
    semanal({ id: 'W2', responsable: 'ale' }),
  ]
  const [ale, soshil] = resumenEquipo(tasks, TODAY, new Set(['W2']))
  assert.deepEqual(ale, { persona: 'ale', semana: 2, vencidas: 1, hechas: 1, total: 3 })
  assert.deepEqual(soshil, { persona: 'soshil', semana: 0, vencidas: 0, hechas: 0, total: 0 })
})

test('resolveView: vistas, bloques, etapas y los links viejos (?tab=b8)', () => {
  const keys = ['b0', 'b8', 'decisiones']
  assert.deepEqual(resolveView({}, keys, 'alina'), { vista: 'inicio', persona: 'alina', bloque: null, etapa: null })
  assert.deepEqual(resolveView({ vista: 'tareas', persona: 'todos' }, keys, 'alina'), { vista: 'tareas', persona: 'todos', bloque: null, etapa: null })
  assert.deepEqual(resolveView({ tab: 'b8' }, keys, 'ale'), { vista: 'estrategia', persona: 'ale', bloque: 'b8', etapa: null })
  assert.deepEqual(resolveView({ tab: 'resumen' }, keys, 'ale').vista, 'inicio')
  assert.deepEqual(resolveView({ vista: 'estrategia', bloque: 'b99' }, keys, null), { vista: 'estrategia', persona: 'todos', bloque: null, etapa: null })
  assert.deepEqual(resolveView({ vista: 'etapas', etapa: '11' }, keys, null).etapa, 11)
  assert.deepEqual(resolveView({ vista: 'etapas', etapa: '13' }, keys, null).etapa, null)
  assert.deepEqual(resolveView({ vista: 'otra' }, keys, null).vista, 'inicio')
})

test('viewHref arma la URL de cada vista', () => {
  assert.equal(viewHref({ vista: 'inicio' }, 'alina'), '/plan-q4?vista=inicio&persona=alina')
  assert.equal(viewHref({ vista: 'estrategia', bloque: 'b8' }, 'todos'), '/plan-q4?vista=estrategia&bloque=b8&persona=todos')
  assert.equal(viewHref({ vista: 'etapas', etapa: 11 }, 'ale'), '/plan-q4?vista=etapas&etapa=11&persona=ale')
})
