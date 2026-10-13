import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// tokens.css lo comparten el sitio y el panel, y en producción se carga después de home.css:
// un token redefinido sobre .hm en home.css (por ejemplo en una media query) pierde y no se aplica.
test('home.css no redefine los tokens compartidos de tokens.css', () => {
  const declared = (css: string) => [...css.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((m) => m[1])
  const shared = new Set(declared(readFileSync('components/home/tokens.css', 'utf8')))
  const offenders = readFileSync('components/home/home.css', 'utf8')
    .split('\n')
    .flatMap((line, i) => declared(line).filter((name) => shared.has(name)).map((name) => `home.css:${i + 1}: ${name}`))
  assert.deepEqual(offenders, [])
})
