import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  blockProgress, buildUpdate, compareTasks, diffTask, isActiveWeekly, isDueThisWeek, isOverdue, isPending,
  nextMilestone, nextTaskId, pendingByBlock, planHref, resolvePersona, resolveTab, weekSummary, weekToggleError,
} from './rules.ts'
import type { PlanTask } from './types.ts'

const TODAY = '2026-10-13' // martes; semana del 12 al 18 de octubre

function task(overrides: Partial<PlanTask> = {}): PlanTask {
  return {
    id: 'B8-01', bloque: 'b8', titulo: 'Tarea', responsable: 'soshil', apoyo: null, fecha: '2026-10-16',
    tipo: 'unica', estado: 'pendiente', nota: null, origen: 'plan', actualizado_por: null, actualizado_en: null,
    ...overrides,
  }
}
const semanal = (overrides: Partial<PlanTask> = {}) => task({ tipo: 'semanal', estado: null, fecha: '2026-10-12', ...overrides })

test('vencida: única abierta con fecha antes de hoy', () => {
  assert.equal(isOverdue(task({ fecha: '2026-10-12' }), TODAY), true)
  assert.equal(isOverdue(task({ fecha: '2026-10-13' }), TODAY), false)
  assert.equal(isOverdue(task({ fecha: '2026-10-12', estado: 'hecho' }), TODAY), false)
  assert.equal(isOverdue(semanal({ fecha: '2026-10-01' }), TODAY), false)
})

test('de esta semana: de lunes a domingo', () => {
  assert.equal(isDueThisWeek(task({ fecha: '2026-10-12' }), TODAY), true)
  assert.equal(isDueThisWeek(task({ fecha: '2026-10-18' }), TODAY), true)
  assert.equal(isDueThisWeek(task({ fecha: '2026-10-19' }), TODAY), false)
  assert.equal(isDueThisWeek(task({ fecha: '2026-10-11' }), TODAY), false)
})

test('semanal activa desde la semana de su fecha de inicio', () => {
  assert.equal(isActiveWeekly(semanal({ fecha: '2026-10-12' }), TODAY), true)
  assert.equal(isActiveWeekly(semanal({ fecha: '2026-10-18' }), TODAY), true)
  assert.equal(isActiveWeekly(semanal({ fecha: '2026-10-19' }), TODAY), false)
})

test('pendientes: únicas no hechas y semanales activas sin check', () => {
  const done = new Set(['B9-02'])
  assert.equal(isPending(task({ estado: 'en_curso' }), TODAY, done), true)
  assert.equal(isPending(task({ estado: 'hecho' }), TODAY, done), false)
  assert.equal(isPending(semanal({ id: 'B9-02' }), TODAY, done), false)
  assert.equal(isPending(semanal({ id: 'B9-03' }), TODAY, done), true)
  assert.equal(isPending(semanal({ id: 'B6-06', fecha: '2026-11-09' }), TODAY, done), false)
})

test('pendingByBlock respeta el filtro de persona', () => {
  const tasks = [task({ id: 'B8-01' }), task({ id: 'B8-02', responsable: 'ale' }), task({ id: 'B2-01', bloque: 'b2', estado: 'hecho' })]
  assert.deepEqual([...pendingByBlock(tasks, TODAY, new Set(), 'todos')], [['b8', 2]])
  assert.deepEqual([...pendingByBlock(tasks, TODAY, new Set(), 'ale')], [['b8', 1]])
  assert.deepEqual([...pendingByBlock(tasks, TODAY, new Set(), 'alina')], [])
})

test('orden: abiertas por fecha, después semanales, hechas al final', () => {
  const list = [
    task({ id: 'B8-03', estado: 'hecho', fecha: '2026-10-01' }),
    semanal({ id: 'B8-10' }),
    task({ id: 'B8-02', fecha: '2026-10-20' }),
    task({ id: 'B8-01', fecha: '2026-10-10' }),
  ]
  assert.deepEqual(list.sort(compareTasks).map((t) => t.id), ['B8-01', 'B8-02', 'B8-10', 'B8-03'])
})

test('weekSummary: por persona, sin repetir vencidas en la semana', () => {
  const tasks = [
    task({ id: 'B8-01', fecha: '2026-10-12' }),
    task({ id: 'B8-02', fecha: '2026-10-16' }),
    task({ id: 'B8-03', fecha: '2026-10-30' }),
    semanal({ id: 'B9-02' }),
    semanal({ id: 'B5-04', responsable: 'ale' }),
  ]
  const [soshil] = weekSummary(tasks, TODAY, 'soshil')
  assert.equal(soshil.persona, 'soshil')
  assert.deepEqual(soshil.vencidas.map((t) => t.id), ['B8-01'])
  assert.deepEqual(soshil.semana.map((t) => t.id), ['B8-02'])
  assert.deepEqual(soshil.semanales.map((t) => t.id), ['B9-02'])
  assert.deepEqual(weekSummary(tasks, TODAY, 'todos').map((w) => w.persona), ['ale', 'soshil', 'alina'])
})

test('blockProgress cuenta solo únicas', () => {
  const tasks = [task({ id: 'B8-01', estado: 'hecho' }), task({ id: 'B8-02' }), semanal({ id: 'B9-02', bloque: 'b9' })]
  assert.deepEqual([...blockProgress(tasks, 'todos')], [['b8', { hechas: 1, total: 2 }]])
})

test('nextMilestone: el de hoy cuenta, los pasados no', () => {
  const hitos = [{ fecha: '2026-10-27', titulo: 'B' }, { fecha: '2026-10-20', titulo: 'A' }]
  assert.deepEqual(nextMilestone(hitos, TODAY), { hito: { fecha: '2026-10-20', titulo: 'A' }, dias: 7 })
  assert.equal(nextMilestone(hitos, '2026-10-20')?.dias, 0)
  assert.equal(nextMilestone(hitos, '2026-10-28'), null)
})

test('nextTaskId: sigue el número más alto del bloque', () => {
  assert.equal(nextTaskId('B8', ['B8-01', 'B8-12', 'B8-03']), 'B8-13')
  assert.equal(nextTaskId('B1', ['B12-04', 'B1-02']), 'B1-03')
  assert.equal(nextTaskId('B4', []), 'B4-01')
})

test('resolveTab, resolvePersona y planHref: lo inválido cae en Resumen y en el usuario', () => {
  assert.equal(resolveTab('b8', ['resumen', 'b8']), 'b8')
  assert.equal(resolveTab('b99', ['resumen', 'b8']), 'resumen')
  assert.equal(resolveTab(undefined, ['resumen', 'b8']), 'resumen')
  assert.equal(resolvePersona('alina', 'ale'), 'alina')
  assert.equal(resolvePersona('todos', 'ale'), 'todos')
  assert.equal(resolvePersona('pedro', 'ale'), 'ale')
  assert.equal(resolvePersona(undefined, null), 'todos')
  assert.equal(planHref('b8', 'alina'), '/plan-q4?tab=b8&persona=alina')
})

test('diffTask: solo lo que cambió; delegar al apoyo lo deja vacío', () => {
  const t = task({ responsable: 'ale', apoyo: 'soshil', nota: null })
  const form = { estado: 'pendiente' as const, responsable: 'ale' as const, apoyo: 'soshil' as const, fecha: '2026-10-16', nota: '  ' }
  assert.deepEqual(diffTask(t, form), {})
  assert.deepEqual(diffTask(t, { ...form, responsable: 'soshil' }), { responsable: 'soshil', apoyo: null })
  assert.deepEqual(diffTask(t, { ...form, estado: 'hecho', nota: ' ojo ' }), { estado: 'hecho', nota: 'ojo' })
  assert.deepEqual(diffTask(semanal(), { ...form, responsable: 'soshil', apoyo: null, fecha: '2026-10-12', estado: 'hecho' }), {})
})

test('buildUpdate: firma el cambio y limpia el apoyo al delegarle', () => {
  const current = { tipo: 'unica' as const, responsable: 'ale' as const, apoyo: 'soshil' as const }
  assert.deepEqual(buildUpdate(current, { responsable: 'soshil' }, 'ale', '2026-10-13T20:00:00Z'), {
    ok: true,
    update: { responsable: 'soshil', apoyo: null, actualizado_por: 'ale', actualizado_en: '2026-10-13T20:00:00Z' },
  })
  const sameApoyo = buildUpdate(current, { apoyo: 'ale' }, 'soshil', 'x')
  assert.equal(sameApoyo.ok && sameApoyo.update.apoyo, null)
})

test('buildUpdate: las semanales no tienen estado', () => {
  assert.equal(buildUpdate({ tipo: 'semanal', responsable: 'soshil', apoyo: null }, { estado: 'hecho' }, 'soshil', 'x').ok, false)
})

test('weekToggleError: solo semanales y no antes de su inicio', () => {
  assert.equal(weekToggleError({ tipo: 'semanal', fecha: '2026-10-14' }, '2026-10-12'), null)
  assert.match(weekToggleError({ tipo: 'semanal', fecha: '2026-10-19' }, '2026-10-12') ?? '', /anterior/)
  assert.match(weekToggleError({ tipo: 'unica', fecha: '2026-10-12' }, '2026-10-12') ?? '', /Solo las semanales/)
})
