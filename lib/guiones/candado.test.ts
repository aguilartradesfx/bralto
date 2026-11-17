import { test } from 'node:test'
import assert from 'node:assert/strict'
import { candado, type Sentinela } from './candado.ts'

// Un Wake Lock de mentira: cada pedido espera a que la prueba lo suelte (`dar`) o lo rechace (`negar`)
function navegador() {
  const pedidos: { resolver: (s: Sentinela) => void; rechazar: (e: Error) => void }[] = []
  const sentinelas: { released: boolean; release(): Promise<void> }[] = []
  return {
    pedidos,
    sentinelas,
    pedir: () =>
      new Promise<Sentinela>((resolver, rechazar) => {
        pedidos.push({ resolver, rechazar })
      }),
    dar(i = pedidos.length - 1) {
      const s = {
        released: false,
        async release() {
          s.released = true
        },
      }
      sentinelas.push(s)
      pedidos[i].resolver(s)
      return s
    },
    negar(i = pedidos.length - 1) {
      pedidos[i].rechazar(new Error('NotAllowedError'))
    },
  }
}

const tic = () => new Promise((r) => setImmediate(r))

test('candado: dos pedidos a la vez piden un solo Wake Lock', async () => {
  const n = navegador()
  const avisos: string[] = []
  const c = candado(n.pedir, (e) => avisos.push(e))
  void c.pedir()
  void c.pedir() // por ejemplo, la página vuelve a verse mientras el primero sigue en camino
  await tic()
  assert.equal(n.pedidos.length, 1)
  n.dar()
  await tic()
  assert.deepEqual(avisos, ['prendida'])
  void c.pedir() // ya hay uno vivo: no pide otro
  await tic()
  assert.equal(n.pedidos.length, 1)
})

test('candado: al soltar se libera, y el que llega tarde también', async () => {
  const n = navegador()
  const c = candado(n.pedir, () => {})
  void c.pedir()
  await tic()
  c.soltar() // se cierra la lectura antes de que el navegador conteste
  const tarde = n.dar()
  await tic()
  assert.equal(tarde.released, true)

  const m = navegador()
  const d = candado(m.pedir, () => {})
  void d.pedir()
  await tic()
  const s = m.dar()
  await tic()
  d.soltar()
  assert.equal(s.released, true)
  void d.pedir() // soltado ya no vuelve a pedir
  await tic()
  assert.equal(m.pedidos.length, 1)
})

test('candado: si el navegador lo suelta (la página se escondió), se vuelve a pedir', async () => {
  const n = navegador()
  const c = candado(n.pedir, () => {})
  void c.pedir()
  await tic()
  const s = n.dar()
  await tic()
  await s.release() // lo soltó el navegador
  void c.pedir()
  await tic()
  assert.equal(n.pedidos.length, 2)
})

test('candado: si el navegador no lo da, avisa «no» y deja pedir de nuevo', async () => {
  const n = navegador()
  const avisos: string[] = []
  const c = candado(n.pedir, (e) => avisos.push(e))
  void c.pedir()
  await tic()
  n.negar()
  await tic()
  assert.deepEqual(avisos, ['no'])
  void c.pedir()
  await tic()
  assert.equal(n.pedidos.length, 2)
})
