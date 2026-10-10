import { test } from 'node:test'
import assert from 'node:assert/strict'
import { slugify, uniqueSlug } from './slug.ts'

test('slugify: sin acentos, ñ → n, solo letras, números y guiones', () => {
  assert.equal(slugify('¿Qué cambia con GPT-6 para las pymes? Año 2026'), 'que-cambia-con-gpt-6-para-las-pymes-ano-2026')
})

test('slugify corta en un guion, sin pasarse del máximo', () => {
  const s = slugify('palabra '.repeat(30), 40)
  assert.ok(s.length <= 40)
  assert.ok(!s.endsWith('-'))
})

test('slugify nunca devuelve vacío', () => {
  assert.equal(slugify('¿¡!?'), 'nota')
})

test('uniqueSlug agrega -2, -3… si ya existe', () => {
  assert.equal(uniqueSlug('ia', []), 'ia')
  assert.equal(uniqueSlug('ia', ['ia']), 'ia-2')
  assert.equal(uniqueSlug('ia', ['ia', 'ia-2', 'ia-3']), 'ia-4')
})
