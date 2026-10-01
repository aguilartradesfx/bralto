import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  allowedTransitions, canViewTask, compareTasks, costaRicaDate, costaRicaDayRange, noticesForAssignment, noticesForTransition,
  transitionKind, type TaskRef, type TaskStatus,
} from './rules.ts'

const ADMIN = { id: 'admin', isAdmin: true }
const ANA = { id: 'ana', isAdmin: false }

function task(status: TaskStatus, assignee: string | null = 'ana', creator: string | null = 'admin'): TaskRef {
  return { status, assignee_id: assignee, created_by: creator }
}

test('canViewTask: el admin ve todo, el colaborador solo lo suyo', () => {
  assert.equal(canViewTask(ADMIN, { assignee_id: 'otro' }), true)
  assert.equal(canViewTask(ADMIN, { assignee_id: null }), true)
  assert.equal(canViewTask(ANA, { assignee_id: 'ana' }), true)
  assert.equal(canViewTask(ANA, { assignee_id: 'otro' }), false)
  assert.equal(canViewTask(ANA, { assignee_id: null }), false)
})

test('allowedTransitions: el responsable avanza hasta revisión', () => {
  assert.deepEqual(allowedTransitions(ANA, task('pendiente')), ['en_progreso', 'bloqueada'])
  assert.deepEqual(allowedTransitions(ANA, task('en_progreso')), ['en_revision', 'bloqueada'])
  assert.deepEqual(allowedTransitions(ANA, task('bloqueada')), ['en_progreso'])
})

test('allowedTransitions: el responsable no aprueba ni se salta la revisión', () => {
  assert.deepEqual(allowedTransitions(ANA, task('en_revision')), [])
  assert.deepEqual(allowedTransitions(ANA, task('hecha')), [])
  assert.equal(allowedTransitions(ANA, task('en_progreso')).includes('hecha'), false)
})

test('allowedTransitions: nada sobre tareas ajenas', () => {
  assert.deepEqual(allowedTransitions(ANA, task('pendiente', 'otro')), [])
  assert.deepEqual(allowedTransitions(ANA, task('pendiente', null)), [])
})

test('allowedTransitions: el admin puede mover a cualquier otro estado', () => {
  assert.deepEqual(allowedTransitions(ADMIN, task('en_revision')), ['pendiente', 'en_progreso', 'bloqueada', 'hecha'])
  assert.deepEqual(allowedTransitions(ADMIN, task('hecha')), ['pendiente', 'en_progreso', 'bloqueada', 'en_revision'])
})

test('transitionKind: bloquear y devolver exigen nota', () => {
  assert.deepEqual(transitionKind('en_progreso', 'bloqueada'), { kind: 'bloqueo', noteRequired: true })
  assert.deepEqual(transitionKind('en_revision', 'en_progreso'), { kind: 'devolucion', noteRequired: true })
  assert.deepEqual(transitionKind('en_revision', 'hecha'), { kind: 'estado', noteRequired: false })
  assert.deepEqual(transitionKind('pendiente', 'en_progreso'), { kind: 'estado', noteRequired: false })
})

test('noticesForAssignment: avisa al nuevo responsable, nunca al actor', () => {
  assert.deepEqual(noticesForAssignment('admin', 'ana', null), [{ to: 'ana', email: 'asignada' }])
  assert.deepEqual(noticesForAssignment('admin', 'ana', 'ana'), [])
  assert.deepEqual(noticesForAssignment('admin', 'admin', null), [])
  assert.deepEqual(noticesForAssignment('admin', null, 'ana'), [])
})

test('noticesForTransition: revisión y bloqueo al creador, devolución al responsable', () => {
  assert.deepEqual(noticesForTransition('ana', task('en_progreso'), 'en_revision'), [{ to: 'admin', email: 'en_revision' }])
  assert.deepEqual(noticesForTransition('ana', task('en_progreso'), 'bloqueada'), [{ to: 'admin', email: 'bloqueada' }])
  assert.deepEqual(noticesForTransition('admin', task('en_revision'), 'en_progreso'), [{ to: 'ana', email: 'devuelta' }])
})

test('noticesForTransition: sin aviso al actor ni sin destinatario', () => {
  assert.deepEqual(noticesForTransition('admin', task('en_progreso', 'ana', 'admin'), 'bloqueada'), [])
  assert.deepEqual(noticesForTransition('ana', task('en_progreso', 'ana', null), 'en_revision'), [])
  assert.deepEqual(noticesForTransition('ana', task('pendiente'), 'en_progreso'), [])
})

test('costaRicaDayRange: el día calendario de Costa Rica (UTC−6)', () => {
  // 21:00 del 30-sep en Costa Rica
  assert.deepEqual(costaRicaDayRange(new Date('2026-10-01T03:00:00Z')), {
    start: '2026-09-30T06:00:00.000Z',
    end: '2026-10-01T06:00:00.000Z',
  })
  assert.equal(costaRicaDayRange(new Date('2026-10-01T12:00:00Z')).start, '2026-10-01T06:00:00.000Z')
  // medianoche exacta en Costa Rica
  assert.equal(costaRicaDayRange(new Date('2026-10-01T06:00:00Z')).start, '2026-10-01T06:00:00.000Z')
})

test('costaRicaDate: fecha calendario de Costa Rica', () => {
  assert.equal(costaRicaDate(new Date('2026-10-01T03:00:00Z')), '2026-09-30')
  assert.equal(costaRicaDate(new Date('2026-10-01T12:00:00Z')), '2026-10-01')
})

test('compareTasks: prioridad, luego fecha límite (sin fecha al final), luego actividad reciente', () => {
  const t = (id: string, priority: string, due_date: string | null, updated_at: string) =>
    ({ id, priority, due_date, updated_at }) as Parameters<typeof compareTasks>[0]
  const sorted = [
    t('normal-sin-fecha', 'normal', null, '2026-10-01T10:00:00Z'),
    t('urgente', 'urgente', null, '2026-09-01T10:00:00Z'),
    t('normal-viernes', 'normal', '2026-10-09', '2026-09-01T10:00:00Z'),
    t('normal-lunes', 'normal', '2026-10-05', '2026-09-01T10:00:00Z'),
    t('baja', 'baja', '2026-10-02', '2026-10-01T10:00:00Z'),
    t('normal-sin-fecha-vieja', 'normal', null, '2026-09-20T10:00:00Z'),
  ].sort(compareTasks).map((x) => x.id)
  assert.deepEqual(sorted, ['urgente', 'normal-lunes', 'normal-viernes', 'normal-sin-fecha', 'normal-sin-fecha-vieja', 'baja'])
})
