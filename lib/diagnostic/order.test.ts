import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  finalizeOrder,
  newOrderNumber,
  reconcileAction,
  type OrderDeps,
  type StoredOrder,
} from './diagnostic.ts'
import type { PaymentStatus } from '../payments/types.ts'

const booking = {
  slot: '2026-10-08-3pm',
  firstName: 'Ana',
  lastName: 'Rojas',
  phone: '+50688881234',
  email: 'ana@empresa.com',
  locale: 'es' as const,
  answers: { size: 'a', revenue: 'b', challenge: 'c', industry: 'd', timeline: 'e' },
}

const stored: StoredOrder = {
  orderNumber: 'BRD-261007-K7F3Q9XZ',
  kind: 'diagnostic',
  provider: 'tilopay',
  money: { amount: 97, currency: 'USD' },
  booking,
  sessionId: 'sess-12345678',
  createdAt: Date.UTC(2026, 9, 7, 20, 0, 0),
  status: 'pending',
}

const paid = (over: Partial<Extract<PaymentStatus, { state: 'approved' }>> = {}): PaymentStatus => ({
  state: 'approved',
  money: { amount: 97, currency: 'USD' },
  environment: 'PROD',
  reference: '123456',
  ...over,
})

// Dobles con estado real: claims, horarios ocupados y estado de la orden
function fakes(status: PaymentStatus, opts: { expected?: 'PROD' | 'TEST'; taken?: string[]; calendarFails?: boolean; order?: StoredOrder | null } = {}) {
  const claimed = new Set<string>()
  const booked = new Map<string, Set<string>>()
  for (const s of opts.taken ?? []) booked.set('bralto:booked_slots', new Set([s]))
  const calls = { released: [] as string[], saved: 0, pushed: 0, logs: [] as string[], marks: [] as string[], consulted: 0 }
  const deps: OrderDeps = {
    getOrder: async (n) => (opts.order === undefined ? (n === stored.orderNumber ? stored : null) : opts.order),
    getStatus: async () => {
      calls.consulted++
      return status
    },
    expected: opts.expected ?? 'PROD',
    claim: async (key) => {
      if (claimed.has(key)) return false
      claimed.add(key)
      return true
    },
    bookSlot: async (setKey, slot) => {
      const set = booked.get(setKey) ?? new Set<string>()
      booked.set(setKey, set)
      if (set.has(slot)) return false
      set.add(slot)
      return true
    },
    releaseLock: async (slot) => {
      calls.released.push(slot)
    },
    saveBooking: async () => {
      calls.saved++
    },
    pushToCalendar: async () => {
      calls.pushed++
      if (opts.calendarFails) throw new Error('calendar down')
    },
    markOrder: async (_n, s) => {
      calls.marks.push(s)
    },
    log: (m) => {
      calls.logs.push(m)
    },
  }
  return { deps, booked, calls }
}

test('pago aprobado en producción: ocupa el horario, guarda la reserva y crea la cita', async () => {
  const { deps, booked, calls } = fakes(paid())
  const r = await finalizeOrder(stored.orderNumber, deps)
  assert.equal(r.status, 'confirmed')
  assert.ok(booked.get('bralto:booked_slots')?.has(booking.slot))
  assert.deepEqual(calls.released, [booking.slot])
  assert.equal(calls.saved, 1)
  assert.equal(calls.pushed, 1)
  assert.deepEqual(calls.marks, ['paid'])
})

test('la segunda confirmación (webhook, barrido o recarga) no repite nada', async () => {
  const { deps, calls } = fakes(paid())
  await finalizeOrder(stored.orderNumber, deps)
  const r = await finalizeOrder(stored.orderNumber, deps)
  assert.equal(r.status, 'already')
  assert.equal(calls.pushed, 1)
  assert.equal(calls.saved, 1)
})

test('pago de pruebas en un ambiente de pruebas: confirma sin tocar horarios reales ni el calendario', async () => {
  const { deps, booked, calls } = fakes(paid({ environment: 'TEST' }), { expected: 'TEST' })
  const r = await finalizeOrder(stored.orderNumber, deps)
  assert.equal(r.status, 'confirmed')
  assert.equal(r.status === 'confirmed' && r.live, false)
  assert.ok(booked.get('bralto:test:booked_slots')?.has(booking.slot))
  assert.equal(booked.get('bralto:booked_slots'), undefined)
  assert.equal(calls.saved, 0)
  assert.equal(calls.pushed, 0)
})

test('pago de pruebas en producción: no se agenda (la cuenta quedó en modo pruebas)', async () => {
  const { deps, booked, calls } = fakes(paid({ environment: 'TEST' }), { expected: 'PROD' })
  const r = await finalizeOrder(stored.orderNumber, deps)
  assert.equal(r.status, 'mismatch')
  assert.equal(booked.size, 0)
  assert.equal(calls.pushed, 0)
  assert.ok(calls.logs.some((l) => l.includes('TEST')))
})

test('monto distinto al de la orden: no se agenda', async () => {
  const { deps, booked } = fakes(paid({ money: { amount: 1, currency: 'USD' } }))
  assert.equal((await finalizeOrder(stored.orderNumber, deps)).status, 'mismatch')
  assert.equal(booked.size, 0)
})

test('moneda distinta a la de la orden: no se agenda', async () => {
  const { deps, booked } = fakes(paid({ money: { amount: 97, currency: 'CRC' } }))
  assert.equal((await finalizeOrder(stored.orderNumber, deps)).status, 'mismatch')
  assert.equal(booked.size, 0)
})

test('sin transacción en Tilopay: queda sin pagar y no se marca nada', async () => {
  const { deps, calls } = fakes({ state: 'not_found' })
  assert.equal((await finalizeOrder(stored.orderNumber, deps)).status, 'unpaid')
  assert.deepEqual(calls.marks, [])
})

test('rechazada: queda sin pagar y la orden se marca fallida', async () => {
  const { deps, calls } = fakes({ state: 'declined', reason: 'Fondos insuficientes' })
  assert.equal((await finalizeOrder(stored.orderNumber, deps)).status, 'unpaid')
  assert.deepEqual(calls.marks, ['failed'])
})

test('respuesta ambigua del API: error, sin decidir nada', async () => {
  const { deps, booked, calls } = fakes({ state: 'unknown' })
  assert.equal((await finalizeOrder(stored.orderNumber, deps)).status, 'error')
  assert.equal(booked.size, 0)
  assert.deepEqual(calls.marks, [])
})

test('orden que no es nuestra: inválida, sin consultar la pasarela', async () => {
  const { deps, calls } = fakes(paid(), { order: null })
  assert.equal((await finalizeOrder('TPYS-881WROIBQA1405468', deps)).status, 'invalid')
  assert.equal(calls.consulted, 0)
})

test('horario ocupado por otro pago: conflicto registrado, sin cita nueva', async () => {
  const { deps, calls } = fakes(paid(), { taken: [booking.slot] })
  const r = await finalizeOrder(stored.orderNumber, deps)
  assert.equal(r.status, 'conflict')
  assert.equal(calls.pushed, 0)
  assert.deepEqual(calls.marks, ['paid'])
  assert.ok(calls.logs.some((l) => l.includes('CONFLICTO')))
})

test('si el calendario falla, la reserva igual queda confirmada (y se registra)', async () => {
  const { deps, calls } = fakes(paid(), { calendarFails: true })
  assert.equal((await finalizeOrder(stored.orderNumber, deps)).status, 'confirmed')
  assert.equal(calls.logs.length, 1)
})

// ── Número de orden ─────────────────────────────────────────────────────────────

test('número de orden: prefijo, fecha y 8 caracteres aleatorios sin ambigüedad', () => {
  const at = new Date(Date.UTC(2026, 9, 7, 20, 0, 0))
  const n = newOrderNumber(at, new Uint8Array([0, 1, 2, 3, 4, 5, 6, 31]))
  assert.match(n, /^BRD-261007-[0-9A-HJKMNP-TV-Z]{8}$/)
  assert.equal(n, 'BRD-261007-0123456Z')
  assert.notEqual(newOrderNumber(at, new Uint8Array(8).fill(1)), newOrderNumber(at, new Uint8Array(8).fill(2)))
})

// ── Barrido de conciliación ─────────────────────────────────────────────────────

test('barrido: lo resuelto sale de pendientes; lo impago espera hasta vencer; un error se reintenta', () => {
  const now = stored.createdAt + 10 * 60_000
  assert.equal(reconcileAction({ status: 'confirmed', booking, live: true }, stored, now), 'done')
  assert.equal(reconcileAction({ status: 'conflict', booking, live: true }, stored, now), 'done')
  assert.equal(reconcileAction({ status: 'mismatch' }, stored, now), 'done')
  assert.equal(reconcileAction({ status: 'unpaid' }, stored, now), 'keep')
  assert.equal(reconcileAction({ status: 'unpaid' }, stored, stored.createdAt + 3 * 3_600_000), 'expire')
  assert.equal(reconcileAction({ status: 'error' }, stored, stored.createdAt + 3 * 3_600_000), 'keep')
})
