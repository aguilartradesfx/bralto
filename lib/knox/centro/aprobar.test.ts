import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aprobarBorradores, leerIds, type BorradorPendiente, type DepsAprobar } from './aprobar.ts'

const AHORA = new Date('2026-10-30T23:42:00Z')
const haceHoras = (h: number) => new Date(AHORA.getTime() - h * 3600_000).toISOString()
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

// Un enviador falso: anota lo que «mandaría» y nunca sale nada a nadie
function falso(o: { pendientes: BorradorPendiente[]; ultimo: Record<string, string | null>; fallan?: string[]; revienta?: string[] }) {
  const mandados: string[] = []
  const deps: DepsAprobar = {
    ahora: () => AHORA,
    pendientes: async (ids) => o.pendientes.filter((b) => ids.includes(b.id)),
    ultimoEntrante: async (conv) => o.ultimo[conv] ?? null,
    enviar: async (decisionId) => {
      if (o.revienta?.includes(decisionId)) throw new Error('se cayó la conexión')
      mandados.push(decisionId)
      return { ok: !o.fallan?.includes(decisionId) }
    },
  }
  return { deps, mandados }
}

test('manda las que siguen pendientes y dentro de las 24 horas', async () => {
  const { deps, mandados } = falso({
    pendientes: [
      { id: id(1), conversacionId: 'c1', canal: 'instagram' },
      { id: id(2), conversacionId: 'c2', canal: 'whatsapp' },
      { id: id(3), conversacionId: 'c3', canal: 'messenger' },
    ],
    ultimo: { c1: haceHoras(2), c2: haceHoras(23.5), c3: haceHoras(30) },
  })
  const r = await aprobarBorradores(deps, [id(1), id(2), id(3), id(4)])
  // La 3 pasó las 24 horas: no se intenta. La 4 ya no estaba pendiente: no cuenta
  assert.deepEqual(r, { enviadas: 2, fallidas: 1 })
  assert.deepEqual(mandados, [id(1), id(2)])
})

test('si Zernio no la manda (o se cae), cuenta como fallida y sigue con las demás', async () => {
  const { deps, mandados } = falso({
    pendientes: [
      { id: id(1), conversacionId: 'c1', canal: 'instagram' },
      { id: id(2), conversacionId: 'c2', canal: 'instagram' },
      { id: id(3), conversacionId: 'c3', canal: 'instagram' },
    ],
    ultimo: { c1: haceHoras(1), c2: haceHoras(1), c3: haceHoras(1) },
    fallan: [id(1)],
    revienta: [id(2)],
  })
  assert.deepEqual(await aprobarBorradores(deps, [id(1), id(2), id(3)]), { enviadas: 1, fallidas: 2 })
  assert.deepEqual(mandados, [id(1), id(3)])
})

test('sin saber cuándo escribió la persona, Knox no manda', async () => {
  const { deps, mandados } = falso({ pendientes: [{ id: id(1), conversacionId: 'c1', canal: 'instagram' }], ultimo: {} })
  assert.deepEqual(await aprobarBorradores(deps, [id(1)]), { enviadas: 0, fallidas: 1 })
  assert.deepEqual(mandados, [])
})

test('los ids: sin repetidos, con forma de id y con un máximo', () => {
  assert.deepEqual(leerIds({ ids: [id(1), id(1), 'no', 3, id(2)] }), [id(1), id(2)])
  assert.equal(leerIds({ ids: [] }), null)
  assert.equal(leerIds({ ids: 'x' }), null)
  assert.equal(leerIds(null), null)
  assert.equal(leerIds({ ids: Array.from({ length: 51 }, (_, i) => id(i)) }), null)
})
