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

// Un navegador sin :has() descarta la regla entera si :has() va en la misma lista que .hm:
// el sitio se quedaría sin tokens. :has() solo dentro de :where() (lista tolerante) o en su propia regla.
test('tokens.css no pone :has() suelto en la misma lista de selectores que .hm', () => {
  const css = readFileSync('components/home/tokens.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const offenders = [...css.matchAll(/([^{}]+)\{/g)]
    .map((m) => m[1].trim())
    .filter((selector) => /\.hm\b/.test(selector) && /:has\(/.test(selector.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '')))
  assert.deepEqual(offenders, [])
})
