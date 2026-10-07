import { test } from 'node:test'
import assert from 'node:assert/strict'
import { showPending } from './pending.ts'

// Los bloques con datos pendientes ([Dato real], [Testimonio real]…) se revisan en
// desarrollo y en previews de Vercel; en producción nunca deben verse.
const cases: Array<[string, Record<string, string | undefined>, boolean]> = [
  ['Vercel producción', { VERCEL_ENV: 'production', NODE_ENV: 'production' }, false],
  ['Vercel preview (NODE_ENV es production igual)', { VERCEL_ENV: 'preview', NODE_ENV: 'production' }, true],
  ['vercel dev', { VERCEL_ENV: 'development', NODE_ENV: 'development' }, true],
  ['next dev local', { NODE_ENV: 'development' }, true],
  ['next build + start local', { NODE_ENV: 'production' }, false],
  ['tests', { NODE_ENV: 'test' }, false],
  ['entorno vacío: falla cerrado', {}, false],
  ['VERCEL_ENV desconocido: falla cerrado', { VERCEL_ENV: 'staging', NODE_ENV: 'development' }, false],
]

for (const [name, env, want] of cases) {
  test(`showPending: ${name}`, () => {
    assert.equal(showPending(env), want)
  })
}
