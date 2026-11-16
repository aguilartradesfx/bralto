import { test } from 'node:test'
import assert from 'node:assert/strict'
import { conOficinaCon, textoEcho } from './envoltorio.ts'
import type { NuevaMarca } from './tipos.ts'

function armar(o: { dormida?: boolean | 'lanza', marcaLanza?: boolean } = {}) {
  const marcas: NuevaMarca[] = []
  const revisados: string[] = []
  let t = 1_000_000
  const ultimas: Record<string, number> = {}
  const deps = {
    async dormida() {
      if (o.dormida === 'lanza') throw new Error('base caída')
      return !!o.dormida
    },
    async marcar(m: NuevaMarca) {
      if (o.marcaLanza) throw new Error('no se pudo marcar')
      marcas.push(m)
      if (m.tipo === 'saltada') ultimas[m.agente] = t
    },
    async revisado(a: string) { revisados.push(a) },
    async ultimaSaltada(a: string) { return a in ultimas ? new Date(ultimas[a]) : null },
    ahora: () => t,
  }
  return { deps, marcas, revisados, avanzar: (ms: number) => { t += ms } }
}

test('dormida: no corre el trabajo y marca una sola saltada en una hora', async () => {
  const x = armar({ dormida: true })
  let llamadas = 0
  const trabajo = async () => { llamadas++; return { hizo: true, resumen: 'x' } }
  for (let i = 0; i < 3; i++) {
    assert.deepEqual(await conOficinaCon(x.deps, 'zap', trabajo), { salto: 'dormida' })
    x.avanzar(10 * 60_000)
  }
  assert.equal(llamadas, 0)
  assert.equal(x.marcas.filter((m) => m.tipo === 'saltada').length, 1)
  assert.equal(x.marcas[0].texto, 'Me la salté porque la oficina estaba durmiendo')
  x.avanzar(60 * 60_000)
  await conOficinaCon(x.deps, 'zap', trabajo)
  assert.equal(x.marcas.length, 2)
})

test('hizo false: cero marcas y se llama a revisado', async () => {
  const x = armar()
  const r = await conOficinaCon(x.deps, 'nova', async () => ({ hizo: false, resumen: 'nada', detalle: 7 }))
  assert.equal(x.marcas.length, 0)
  assert.deepEqual(x.revisados, ['nova'])
  assert.deepEqual(r, { hizo: false, resumen: 'nada', detalle: 7 })
})

test('hizo true: termina con resumen y dura_seg', async () => {
  const x = armar()
  await conOficinaCon(x.deps, 'zap', async () => { x.avanzar(12_400); return { hizo: true, resumen: 'Publicó 1 post' } })
  assert.deepEqual(x.marcas, [{ agente: 'zap', tipo: 'termina', texto: 'Publicó 1 post', dura_seg: 12 }])
  assert.deepEqual(x.revisados, ['zap'])
})

test('error: marca falla en una línea y relanza el mismo error', async () => {
  const x = armar()
  const err = new Error('algo\nse rompió ' + 'x'.repeat(300))
  await assert.rejects(conOficinaCon(x.deps, 'kash', async () => { throw err }), (e) => e === err)
  assert.equal(x.marcas.length, 1)
  assert.equal(x.marcas[0].tipo, 'falla')
  assert.match(x.marcas[0].texto, /^Falló: algo se rompió x+…$/)
  assert.ok(!x.marcas[0].texto.includes('\n'))
  assert.ok(x.marcas[0].texto.length <= 150)
})

test('inicio: empieza y termina, también con hizo false', async () => {
  const x = armar()
  await conOficinaCon(x.deps, 'krono', async () => ({ hizo: true, resumen: 'listo' }), { inicio: 'Armando el reporte' })
  assert.deepEqual(x.marcas.map((m) => [m.tipo, m.texto]), [['empieza', 'Armando el reporte'], ['termina', 'listo']])
  const y = armar()
  await conOficinaCon(y.deps, 'krono', async () => ({ hizo: false, resumen: 'sin novedades' }), { inicio: 'Armando el reporte' })
  assert.deepEqual(y.marcas.map((m) => m.tipo), ['empieza', 'termina'])
})

test('resiliencia: marcar que lanza no frena ni cambia el resultado', async () => {
  const x = armar({ marcaLanza: true })
  const r = await conOficinaCon(x.deps, 'zap', async () => ({ hizo: true, resumen: 'ok', detalle: 'd' }), { inicio: 'a' })
  assert.deepEqual(r, { hizo: true, resumen: 'ok', detalle: 'd' })
  const z = armar({ marcaLanza: true })
  const err = new Error('falló lo real')
  await assert.rejects(conOficinaCon(z.deps, 'zap', async () => { throw err }), (e) => e === err)
})

test('resiliencia: dormida que lanza se trata como despierta', async () => {
  const x = armar({ dormida: 'lanza' })
  let corrio = false
  const r = await conOficinaCon(x.deps, 'zap', async () => { corrio = true; return { hizo: true, resumen: 'ok' } })
  assert.equal(corrio, true)
  assert.equal((r as { hizo: boolean }).hizo, true)
})

test('textoEcho', () => {
  assert.equal(textoEcho(1), 'Le mandó la guía a 1 persona')
  assert.equal(textoEcho(12), 'Le mandó la guía a 12 personas')
})
