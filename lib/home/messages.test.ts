import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

type Json = string | number | boolean | null | Json[] | { [k: string]: Json }

function load(locale: 'es' | 'en'): Record<string, Json> {
  return JSON.parse(readFileSync(new URL(`../../messages/${locale}.json`, import.meta.url), 'utf8'))
}

// Rutas de todas las hojas: "hero.events.0.title", …
function leafPaths(node: Json, prefix = ''): string[] {
  if (node !== null && typeof node === 'object') {
    return Object.entries(node).flatMap(([k, v]) => leafPaths(v, prefix ? `${prefix}.${k}` : k))
  }
  return [prefix]
}

function leafStrings(node: Json): string[] {
  if (typeof node === 'string') return [node]
  if (node !== null && typeof node === 'object') return Object.values(node).flatMap(leafStrings)
  return []
}

const es = load('es')
const en = load('en')

test('Home existe en ambos idiomas con las mismas claves (sin textos faltantes)', () => {
  assert.ok(es.Home, 'falta Home en es.json')
  assert.ok(en.Home, 'falta Home en en.json')
  assert.deepEqual(leafPaths(en.Home).sort(), leafPaths(es.Home).sort())
})

test('ningún texto del sitio menciona la plataforma de terceros por su nombre', () => {
  const offenders = [...leafStrings(es), ...leafStrings(en)].filter((s) => /high\s*level|\bghl\b/i.test(s))
  assert.deepEqual(offenders, [])
})

test('el home en español trata de usted (sin tú ni vos)', () => {
  const informal = /(?<!\p{L})(tú|tu|tus|te|ti|contigo|vos)(?!\p{L})/iu
  const offenders = leafStrings(es.Home ?? {}).filter((s) => informal.test(s))
  assert.deepEqual(offenders, [])
})
