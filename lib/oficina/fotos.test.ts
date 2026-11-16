import { test } from 'node:test'
import assert from 'node:assert/strict'
import { correrFotoGrupo, elegirArchivos, escenaPendiente, inicioSemanaCR, promptFotoGrupo, TOPE_FOTOS_SEMANA, type DepsFoto, type EscenaEnEspera } from './fotos.ts'

// Miércoles 18/11/2026 11:00 a. m. CR
const HORA_BUENA = new Date('2026-11-18T17:00:00Z')
const ESCENA = { de: 'drax', titulo: 'Cafe', donde: 'la cocina', que: 'brindan', texto: 't', likes: 3 }
const enEspera = (id: string, creada_en: string, agentes = ['drax', 'plexi']): EscenaEnEspera => ({ id, agentes, escena: ESCENA, creada_en })

test('inicioSemanaCR: domingo de noche y lunes de madrugada caen en el mismo lunes', () => {
  const lunes = '2026-11-16T06:00:00.000Z'
  assert.equal(inicioSemanaCR(new Date('2026-11-23T05:00:00Z')).toISOString(), lunes) // dom 22/11 11:00 p. m. CR
  assert.equal(inicioSemanaCR(new Date('2026-11-16T06:30:00Z')).toISOString(), lunes) // lun 16/11 12:30 a. m. CR
  assert.equal(inicioSemanaCR(new Date('2026-11-16T05:59:00Z')).toISOString(), '2026-11-09T06:00:00.000Z')
})

function armar(sobre: Partial<DepsFoto> = {}) {
  const llamadas: string[] = []
  const deps: DepsFoto = {
    dormida: async () => { llamadas.push('dormida'); return false },
    intentosDesde: async () => { llamadas.push('intentos'); return 0 },
    escenasEnEspera: async () => { llamadas.push('escena'); return [enEspera('f1', '2026-11-18T12:00:00Z')] },
    vencerEscenas: async ids => { llamadas.push(`vencer:${ids.join(',')}`) },
    retratos: async ids => { llamadas.push('retratos'); return Object.fromEntries(ids.map(i => [i, new Uint8Array([1])])) },
    marcarIntento: async () => { llamadas.push('marcar'); return true },
    soltarIntento: async () => { llamadas.push('soltar') },
    generar: async () => { llamadas.push('generar'); return new Uint8Array([9]) },
    guardarFoto: async () => { llamadas.push('guardar') },
    fallar: async (_id, d) => { llamadas.push(`fallar:${d}`) },
    ...sobre,
  }
  return { deps, llamadas }
}

test('con 2 intentos esta semana da tope y no genera', async () => {
  const { deps, llamadas } = armar({ intentosDesde: async () => TOPE_FOTOS_SEMANA })
  assert.equal((await correrFotoGrupo(deps, HORA_BUENA)).resultado, 'tope')
  assert.ok(!llamadas.includes('generar') && !llamadas.includes('marcar'))
})

test('sin retrato: falla con el nombre y nunca genera', async () => {
  const { deps, llamadas } = armar({ retratos: async () => ({ drax: new Uint8Array([1]) }) })
  const r = await correrFotoGrupo(deps, HORA_BUENA)
  assert.equal(r.resultado, 'falla')
  assert.ok(llamadas.includes('fallar:Falta el retrato de Plexi'))
  assert.ok(!llamadas.includes('generar') && !llamadas.includes('marcar'))
})

test('marcarIntento va antes de generar', async () => {
  const { deps, llamadas } = armar()
  assert.equal((await correrFotoGrupo(deps, HORA_BUENA)).resultado, 'hecha')
  assert.ok(llamadas.indexOf('marcar') < llamadas.indexOf('generar'))
  assert.ok(llamadas.indexOf('generar') < llamadas.indexOf('guardar'))
})

test('si generar lanza: fallar y falla, pero el intento ya quedó anotado', async () => {
  const { deps, llamadas } = armar({ generar: async () => { throw new Error('Gemini respondió 500') } })
  const r = await correrFotoGrupo(deps, HORA_BUENA)
  assert.equal(r.resultado, 'falla')
  assert.ok(llamadas.includes('marcar'))
  assert.ok(llamadas.includes('fallar:Gemini respondió 500'))
})

test('si guardar lanza: fallar y falla', async () => {
  const { deps, llamadas } = armar({ guardarFoto: async () => { throw new Error('bucket') } })
  assert.equal((await correrFotoGrupo(deps, HORA_BUENA)).resultado, 'falla')
  assert.ok(llamadas.includes('fallar:bucket'))
})

test('dormida: no consulta nada más', async () => {
  const { deps, llamadas } = armar({ dormida: async () => true })
  assert.equal((await correrFotoGrupo(deps, HORA_BUENA)).resultado, 'dormida')
  assert.deepEqual(llamadas, [])
})

test('se duerme justo antes de pagar: no marca ni genera', async () => {
  let n = 0
  const { deps, llamadas } = armar({ dormida: async () => ++n > 1 })
  assert.equal((await correrFotoGrupo(deps, HORA_BUENA)).resultado, 'dormida')
  assert.ok(!llamadas.includes('generar') && !llamadas.includes('marcar'))
})

test('fuera de hora no hace nada', async () => {
  const { deps, llamadas } = armar()
  assert.equal((await correrFotoGrupo(deps, new Date('2026-11-19T02:00:00Z'))).resultado, 'nada') // 8 p. m. CR
  assert.deepEqual(llamadas, [])
})

test('sin escena pendiente: nada', async () => {
  const { deps, llamadas } = armar({ escenasEnEspera: async () => [] })
  assert.equal((await correrFotoGrupo(deps, HORA_BUENA)).resultado, 'nada')
  assert.ok(!llamadas.some(l => l.startsWith('vencer')))
})

// ---------- qué escena toca: la más nueva, y las demás se quedan viejas ----------

test('escenaPendiente: la más nueva de los últimos 7 días; todas las demás se quedaron viejas', () => {
  const r = escenaPendiente([
    enEspera('vieja', '2026-11-10T12:00:00Z'), // más de 7 días
    enEspera('ayer', '2026-11-17T17:00:00Z'),
    enEspera('hoy', '2026-11-18T15:00:00Z'),
    enEspera('lunes', '2026-11-16T17:00:00Z'),
  ], HORA_BUENA)
  assert.equal(r.escena?.id, 'hoy')
  assert.deepEqual(r.viejas, ['vieja', 'ayer', 'lunes'])
})

test('escenaPendiente: si ninguna es de los últimos 7 días, no toca ninguna y todas se quedaron viejas', () => {
  const r = escenaPendiente([enEspera('a', '2026-11-01T12:00:00Z'), enEspera('b', '2026-11-11T16:59:59.999Z')], HORA_BUENA)
  assert.equal(r.escena, null)
  assert.deepEqual(r.viejas, ['a', 'b'])
  assert.deepEqual(escenaPendiente([], HORA_BUENA), { escena: null, viejas: [] })
})

test('escenaPendiente: la de hace justo 7 días todavía sirve, y una un poco del futuro (el reloj de la base) también', () => {
  assert.equal(escenaPendiente([enEspera('justo', '2026-11-11T17:00:00Z')], HORA_BUENA).escena?.id, 'justo')
  const r = escenaPendiente([enEspera('recien', '2026-11-18T17:00:00Z'), enEspera('futuro', '2026-11-18T17:00:02Z')], HORA_BUENA)
  assert.equal(r.escena?.id, 'futuro')
  assert.deepEqual(r.viejas, ['recien'])
})

test('las escenas viejas pasan a falla sin reservarlas ni pagar, y se hace la más nueva', async () => {
  const { deps, llamadas } = armar({
    escenasEnEspera: async () => [
      enEspera('vieja', '2026-11-02T12:00:00Z', ['drax']),
      enEspera('nueva', '2026-11-18T12:00:00Z'),
      enEspera('ayer', '2026-11-17T12:00:00Z', ['plexi']),
    ],
    marcarIntento: async id => { llamadas.push(`marcar:${id}`); return true },
    generar: async (_p, _r, id) => { llamadas.push(`generar:${id}`); return new Uint8Array([9]) },
  })
  assert.equal((await correrFotoGrupo(deps, HORA_BUENA)).resultado, 'hecha')
  assert.ok(llamadas.includes('vencer:vieja,ayer'))
  assert.deepEqual(llamadas.filter(l => l.startsWith('marcar') || l.startsWith('generar')), ['marcar:nueva', 'generar:nueva'])
  assert.ok(llamadas.indexOf('vencer:vieja,ayer') < llamadas.indexOf('marcar:nueva'))
})

test('si solo hay escenas viejas: las vence y no hay foto', async () => {
  const { deps, llamadas } = armar({ escenasEnEspera: async () => [enEspera('vieja', '2026-11-02T12:00:00Z')] })
  const r = await correrFotoGrupo(deps, HORA_BUENA)
  assert.equal(r.resultado, 'nada')
  assert.ok(llamadas.includes('vencer:vieja'))
  for (const x of ['retratos', 'marcar', 'generar']) assert.ok(!llamadas.includes(x), x)
})

test('simular no vence las escenas viejas', async () => {
  const { deps, llamadas } = armar({ escenasEnEspera: async () => [enEspera('vieja', '2026-11-02T12:00:00Z'), enEspera('f1', '2026-11-18T12:00:00Z')] })
  assert.equal((await correrFotoGrupo(deps, HORA_BUENA, true)).resultado, 'nada')
  assert.ok(!llamadas.some(l => l.startsWith('vencer')))
})

test('si vencer las viejas falla, se avisa y la foto de la nueva igual sale', async t => {
  const avisos = t.mock.method(console, 'error', () => {})
  const { deps } = armar({
    escenasEnEspera: async () => [enEspera('vieja', '2026-11-02T12:00:00Z'), enEspera('f1', '2026-11-18T12:00:00Z')],
    vencerEscenas: async () => { throw new Error('se cayó') },
  })
  assert.equal((await correrFotoGrupo(deps, HORA_BUENA)).resultado, 'hecha')
  assert.equal(avisos.mock.callCount(), 1)
})

test('con el tope lleno no lee ni vence escenas', async () => {
  const { deps, llamadas } = armar({ intentosDesde: async () => TOPE_FOTOS_SEMANA })
  assert.equal((await correrFotoGrupo(deps, HORA_BUENA)).resultado, 'tope')
  assert.ok(!llamadas.includes('escena') && !llamadas.some(l => l.startsWith('vencer')))
})

test('simular no marca ni genera ni guarda', async () => {
  const { deps, llamadas } = armar()
  const r = await correrFotoGrupo(deps, HORA_BUENA, true)
  assert.equal(r.resultado, 'nada')
  for (const x of ['marcar', 'generar', 'guardar']) assert.ok(!llamadas.includes(x))
  assert.ok(!llamadas.some(l => l.startsWith('fallar')))
})

test('simular con el tope lleno también dice tope', async () => {
  const { deps } = armar({ intentosDesde: async () => 2 })
  assert.equal((await correrFotoGrupo(deps, HORA_BUENA, true)).resultado, 'tope')
})

test('promptFotoGrupo nombra a cada uno y trae las reglas', () => {
  const p = promptFotoGrupo({ titulo: 'Cafe', donde: 'la cocina', que: 'brindan' }, ['Drax', 'Plexi'])
  for (const x of ['Drax', 'Plexi', '1.5', 'Never a 3D render', 'No text', 'la cocina', 'brindan']) assert.ok(p.includes(x), x)
})

test('elegirArchivos toma <id>.jpg o la versión más alta', () => {
  assert.deepEqual(
    elegirArchivos(['drax-v1.jpg', 'drax-v2.jpg', 'plexi.jpg', 'plexi-v3.jpg', 'otro.jpg'], ['drax', 'plexi']),
    { drax: 'drax-v2.jpg', plexi: 'plexi.jpg' })
})

test('elegirArchivos ignora lo que no es retrato y los que faltan', () => {
  assert.deepEqual(elegirArchivos(['generar.log', 'hoja.png'], ['drax']), {})
})

test('si otra corrida ya reservó la escena: nada y no genera', async () => {
  const { deps, llamadas } = armar({ marcarIntento: async () => false })
  const r = await correrFotoGrupo(deps, HORA_BUENA)
  assert.equal(r.resultado, 'nada')
  assert.match(r.detalle, /Otra corrida/)
  assert.ok(!llamadas.includes('generar'))
})

test('el recuento tras reservar pasa del tope: suelta la reserva, tope y no genera', async () => {
  let n = 0
  const { deps, llamadas } = armar({ intentosDesde: async () => (n++ === 0 ? 1 : 3) })
  assert.equal((await correrFotoGrupo(deps, HORA_BUENA)).resultado, 'tope')
  assert.ok(llamadas.includes('soltar'))
  assert.ok(!llamadas.includes('generar'))
})

test('con TOPE - 1 intentos todavía genera (y el recuento propio cuenta 2)', async () => {
  let n = 0
  const { deps, llamadas } = armar({ intentosDesde: async () => (n++ === 0 ? TOPE_FOTOS_SEMANA - 1 : TOPE_FOTOS_SEMANA) })
  assert.equal((await correrFotoGrupo(deps, HORA_BUENA)).resultado, 'hecha')
  assert.ok(llamadas.includes('generar') && !llamadas.includes('soltar'))
})
