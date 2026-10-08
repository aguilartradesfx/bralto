import assert from 'node:assert/strict'
import test from 'node:test'
import { preferredLocale } from './locale.ts'

test('la elección guardada manda sobre todo lo demás', () => {
  assert.equal(preferredLocale({ cookie: 'en', acceptLanguage: 'es-CR,es;q=0.9', country: 'CR' }), 'en')
  assert.equal(preferredLocale({ cookie: 'es', acceptLanguage: 'en-US,en;q=0.9', country: 'US' }), 'es')
})

test('una cookie con otro valor no cuenta', () => {
  assert.equal(preferredLocale({ cookie: 'fr', acceptLanguage: 'en-US', country: 'CR' }), 'en')
})

test('el idioma del navegador va antes que el país de la IP', () => {
  // Alguien con el navegador en inglés que está en Costa Rica
  assert.equal(preferredLocale({ acceptLanguage: 'en-US,en;q=0.9,es;q=0.8', country: 'CR' }), 'en')
  // Alguien con el navegador en español que está en Estados Unidos
  assert.equal(preferredLocale({ acceptLanguage: 'es-MX,es;q=0.9,en;q=0.5', country: 'US' }), 'es')
})

test('se respeta la prioridad (q) del Accept-Language', () => {
  assert.equal(preferredLocale({ acceptLanguage: 'en;q=0.4,es;q=0.9', country: 'US' }), 'es')
})

test('si el navegador pide otro idioma, se usa el primero que el sitio tenga', () => {
  assert.equal(preferredLocale({ acceptLanguage: 'pt-BR,pt;q=0.9,es;q=0.7,en;q=0.5', country: 'BR' }), 'es')
})

test('sin un idioma del sitio en el navegador, decide el país', () => {
  assert.equal(preferredLocale({ acceptLanguage: 'pt-BR,pt;q=0.9', country: 'AR' }), 'es')
  assert.equal(preferredLocale({ acceptLanguage: 'fr-FR', country: 'FR' }), 'en')
  assert.equal(preferredLocale({ country: 'MX' }), 'es')
  assert.equal(preferredLocale({}), 'en')
})
