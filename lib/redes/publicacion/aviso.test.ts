import { test } from 'node:test'
import assert from 'node:assert/strict'
import { avisoCortada, avisoError, avisoListo } from './aviso.ts'

const pub = { titulo: 'Jarvis', colaborador: 'bralto.io', facebook: true, comenta: { palabras: ['jarvis'] }, historias: ['a', 'b', 'c'] }

test('el aviso de listo dice dónde salió y qué quedó funcionando', () => {
  const t = avisoListo(pub, {
    instagram: { id: '1', permalink: 'https://www.instagram.com/p/X/', en: '2026-10-30T16:00:20.000Z' },
    comentaIg: { id: 'z1' },
    facebook: { postId: 'f1', url: 'https://facebook.com/f1', automatizacion: 'z2' },
    collab: 'aceptada',
    historias: ['h1', 'h2', 'h3'],
  })
  assert.equal(
    t,
    [
      '✅ Ya salió Jarvis (10:00 a. m.)',
      'Instagram: https://www.instagram.com/p/X/',
      'Mensajes de «Comenta JARVIS»: activos',
      'Facebook: https://facebook.com/f1 · mensajes activos',
      'Collab con @bralto.io: aceptada',
      'Historias: 3 de 3',
    ].join('\n'),
  )
})

test('lo que falló después de publicar sale en el aviso, sin esconderlo', () => {
  const t = avisoListo(pub, {
    instagram: { id: '1', permalink: null, en: '2026-10-30T16:00:20.000Z' },
    comentaIg: { error: 'Zernio 500' },
    facebook: { postId: null, url: null, error: 'HTTP 502' },
    collab: 'pendiente: Meta no respondió',
    historias: ['h1', 'error: se cayó', 'h3'],
  })
  assert.match(t, /^Instagram: 1$/m)
  assert.match(t, /«Comenta JARVIS»: FALLARON \(Zernio 500\)/)
  assert.match(t, /^Facebook: no salió \(HTTP 502\)$/m)
  assert.match(t, /^Collab con @bralto\.io: pendiente: Meta no respondió$/m)
  assert.match(t, /^Historias: 2 de 3$/m)
})

test('Facebook sin el «Comenta» lo dice', () => {
  const t = avisoListo(pub, {
    instagram: { id: '1', permalink: 'p', en: '2026-10-30T16:00:20.000Z' },
    facebook: { postId: 'f1', url: 'u', errorComenta: 'Zernio 400' },
  })
  assert.match(t, /^Facebook: u · SIN mensajes \(Zernio 400\)$/m)
})

test('sin collab, sin Facebook, sin «Comenta» y sin historias, esas líneas no aparecen', () => {
  const t = avisoListo({ titulo: 'Reel', colaborador: null, facebook: false, comenta: null, historias: [] }, {
    instagram: { id: '1', permalink: 'p', en: '2026-10-30T19:00:00.000Z' },
  })
  assert.equal(t, '✅ Ya salió Reel (1:00 p. m.)\nInstagram: p')
})

test('Facebook que Zernio todavía está publicando no se da por publicado', () => {
  const t = avisoListo(pub, {
    instagram: { id: '1', permalink: 'p', en: '2026-10-30T16:00:20.000Z' },
    facebook: { postId: null, url: null, estado: 'processing' },
  })
  assert.match(t, /^Facebook: en proceso en Zernio \(processing\) · SIN mensajes$/m)
})

test('un «Comenta» sin palabras no tumba el aviso', () => {
  const t = avisoListo({ ...pub, comenta: { palabras: [] } }, { instagram: { id: '1', permalink: 'p', en: '2026-10-30T16:00:20.000Z' } })
  assert.match(t, /^Mensajes del «Comenta»: FALLARON \(sin crear\)$/m)
})

test('si se cortó con Instagram ya publicado, el aviso no dice que no salió', () => {
  const t = avisoCortada('Jarvis', 3, { instagram: { id: '1', permalink: 'https://www.instagram.com/p/X/', en: '2026-10-30T16:00:20.000Z' } })
  assert.equal(t, '⚠️ Jarvis salió en Instagram (https://www.instagram.com/p/X/), pero la publicación se cortó a la mitad. Revisa Facebook, la collab y las historias.')
  assert.match(avisoCortada('Jarvis', 3, {}), /^❌ Jarvis no salió \(intento 3 de 3\): se cortó a la mitad/)
})

test('el aviso de error dice qué no salió y por qué', () => {
  assert.equal(
    avisoError('Jarvis', 3, 'Instagram: el contenedor quedó en ERROR'),
    '❌ Jarvis no salió (intento 3 de 3): Instagram: el contenedor quedó en ERROR',
  )
})
