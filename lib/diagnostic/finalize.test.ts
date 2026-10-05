import { test } from 'node:test'
import assert from 'node:assert/strict'
import { finalizeDiagnostic, type CheckoutSessionLike, type FinalizeDeps } from './diagnostic.ts'

const metadata = {
  product_kind: 'diagnostic',
  slot: '2026-10-08-3pm',
  first_name: 'Ana',
  last_name: 'Rojas',
  phone: '+50688881234',
  email: 'ana@empresa.com',
  locale: 'es',
  answers: JSON.stringify({ size: '6 a 20 personas', revenue: '$15,001 – $30,000 USD', challenge: 'x', industry: 'y', timeline: 'z' }),
}

// Dobles con estado real (claims y horarios ocupados), que registran los efectos
function fakes(session: CheckoutSessionLike, opts: { taken?: string[]; calendarFails?: boolean } = {}) {
  const claimed = new Set<string>()
  const booked = new Map<string, Set<string>>()
  for (const s of opts.taken ?? []) booked.set('bralto:booked_slots', new Set([s]))
  const calls = { released: [] as string[], saved: 0, pushed: 0, logs: 0 }
  const deps: FinalizeDeps = {
    getSession: async (id) => {
      assert.equal(id, session.id)
      return session
    },
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
    log: () => {
      calls.logs++
    },
  }
  return { deps, booked, calls }
}

const paidLive: CheckoutSessionLike = { id: 'cs_live_1', payment_status: 'paid', livemode: true, metadata }

test('pago confirmado: ocupa el horario, libera la retención y crea la cita', async () => {
  const { deps, booked, calls } = fakes(paidLive)
  const r = await finalizeDiagnostic('cs_live_1', deps)
  assert.equal(r.status, 'confirmed')
  if (r.status !== 'confirmed') return
  assert.equal(r.booking.slot, '2026-10-08-3pm')
  assert.equal(r.booking.email, 'ana@empresa.com')
  assert.ok(booked.get('bralto:booked_slots')?.has('2026-10-08-3pm'))
  assert.deepEqual(calls.released, ['2026-10-08-3pm'])
  assert.equal(calls.saved, 1)
  assert.equal(calls.pushed, 1)
})

test('la segunda confirmación (página de éxito + webhook) no repite nada', async () => {
  const { deps, calls } = fakes(paidLive)
  await finalizeDiagnostic('cs_live_1', deps)
  const again = await finalizeDiagnostic('cs_live_1', deps)
  assert.equal(again.status, 'already')
  if (again.status !== 'already') return
  assert.equal(again.booking.slot, '2026-10-08-3pm')
  assert.equal(calls.saved, 1)
  assert.equal(calls.pushed, 1)
})

test('sin pago no se toca nada', async () => {
  const { deps, booked, calls } = fakes({ ...paidLive, payment_status: 'unpaid' })
  const r = await finalizeDiagnostic('cs_live_1', deps)
  assert.equal(r.status, 'unpaid')
  assert.equal(booked.size, 0)
  assert.equal(calls.saved + calls.pushed, 0)
})

test('una sesión de otro producto no es un diagnóstico', async () => {
  const { deps } = fakes({ ...paidLive, metadata: { product_kind: 'bralto_essentials' } })
  assert.equal((await finalizeDiagnostic('cs_live_1', deps)).status, 'invalid')
})

test('modo prueba: no crea la cita real ni escribe en Supabase, y usa su propio registro de horarios', async () => {
  const { deps, booked, calls } = fakes({ ...paidLive, livemode: false })
  const r = await finalizeDiagnostic('cs_live_1', deps)
  assert.equal(r.status, 'confirmed')
  assert.ok(booked.get('bralto:test:booked_slots')?.has('2026-10-08-3pm'))
  assert.equal(booked.get('bralto:booked_slots')?.has('2026-10-08-3pm') ?? false, false)
  assert.equal(calls.saved + calls.pushed, 0)
})

test('si el horario se ocupó mientras pagaba: conflicto, queda el registro y no se crea la cita', async () => {
  const { deps, calls } = fakes(paidLive, { taken: ['2026-10-08-3pm'] })
  const r = await finalizeDiagnostic('cs_live_1', deps)
  assert.equal(r.status, 'conflict')
  assert.equal(calls.saved, 1)
  assert.equal(calls.pushed, 0)
  assert.ok(calls.logs > 0, 'queda en los logs para dar seguimiento')
})

test('si el calendario falla, el pago igual queda confirmado y se registra el error', async () => {
  const { deps, calls } = fakes(paidLive, { calendarFails: true })
  const r = await finalizeDiagnostic('cs_live_1', deps)
  assert.equal(r.status, 'confirmed')
  assert.ok(calls.logs > 0)
})
