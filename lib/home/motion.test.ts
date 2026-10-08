import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { MOTION_STORAGE_KEY, motionBootScript } from './motion.ts'

// Ejecuta el script inline del <head> con lo que haya guardado el botón del pie
function runBoot(stored: string | null | 'sin-localStorage') {
  const dataset: Record<string, string> = {}
  const sandbox: Record<string, unknown> = { document: { documentElement: { dataset } } }
  if (stored !== 'sin-localStorage') {
    sandbox.localStorage = { getItem: (key: string) => (key === MOTION_STORAGE_KEY ? stored : null) }
  }
  vm.runInNewContext(motionBootScript, sandbox)
  return dataset
}

test('si la persona pausó las animaciones, quedan pausadas desde el primer pintado', () => {
  assert.equal(runBoot('paused').motion, 'paused')
})

test('sin elección guardada, o si las reanudó, se mueven', () => {
  assert.equal(runBoot(null).motion, undefined)
  assert.equal(runBoot('running').motion, undefined)
})

test('sin localStorage (navegación privada estricta): no falla', () => {
  assert.doesNotThrow(() => runBoot('sin-localStorage'))
})
