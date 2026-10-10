import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toJsonLd } from './json-ld.ts'

test('toJsonLd no deja cerrar la etiqueta script y conserva los datos', () => {
  const data = { headline: 'Hola </script><script>alert(1)</script>', url: 'https://x.com/?a=<b>' }
  const out = toJsonLd(data)
  assert.doesNotMatch(out, /<\/script/i)
  assert.doesNotMatch(out, /</)
  assert.deepEqual(JSON.parse(out), data)
})
