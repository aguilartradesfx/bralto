import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FRASES_SUENO } from './frases-sueno.ts'

test('hay al menos 20 frases cortas', () => {
  assert.ok(FRASES_SUENO.length >= 20)
  for (const f of FRASES_SUENO) assert.ok(f.length > 0 && f.length <= 60, f)
})

test('ninguna habla de trabajo ni usa modismos de afuera', () => {
  for (const f of FRASES_SUENO)
    for (const mala of ['pana', 'tarea', 'post', 'reel', 'cliente', 'publicar', 'tantito', 'chévere'])
      assert.ok(!f.toLowerCase().includes(mala), `«${f}» contiene «${mala}»`)
})
