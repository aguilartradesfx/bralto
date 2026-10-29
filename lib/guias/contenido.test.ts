import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bloquesVisibles, filaAGuia, trozos, type Guia } from './contenido.ts'

const guia: Guia = {
  slug: 'prueba',
  palabra: 'PRUEBA',
  titulo: 'Una guía',
  resumen: 'Para probar',
  etiqueta: 'Guía · Claude Code',
  incluye: ['Todo'],
  fuenteNombre: null,
  fuenteUrl: null,
  imagenUrl: null,
  abierto: [
    { tipo: 'parrafo', texto: 'Intro' },
    { tipo: 'paso', titulo: 'Clónelo' },
  ],
  bloqueado: [
    { tipo: 'paso', titulo: 'Escriba /jarvis-start' },
    { tipo: 'codigo', codigo: 'FRASE-BLOQUEADA' },
    { tipo: 'paso', titulo: 'Apruebe el diseño' },
  ],
}

test('sin acceso no sale ningún bloque bloqueado', () => {
  const v = bloquesVisibles(guia, false)
  assert.deepEqual(v.bloqueado, [])
  assert.equal(JSON.stringify(v).includes('FRASE-BLOQUEADA'), false)
})

test('los pasos se numeran seguidos entre lo abierto y lo bloqueado', () => {
  const v = bloquesVisibles(guia, true)
  const numeros = [...v.abierto, ...v.bloqueado].filter((b) => b.tipo === 'paso').map((b) => b.numero)
  assert.deepEqual(numeros, [1, 2, 3])
})

test('trozos reconoce negrita, código y enlace en orden', () => {
  assert.deepEqual(trozos('Use **Claude** con `git` en [GitHub](https://github.com).'), [
    { t: 'texto', v: 'Use ' },
    { t: 'negrita', v: 'Claude' },
    { t: 'texto', v: ' con ' },
    { t: 'codigo', v: 'git' },
    { t: 'texto', v: ' en ' },
    { t: 'enlace', v: 'GitHub', url: 'https://github.com' },
    { t: 'texto', v: '.' },
  ])
})

test('un enlace que no es https queda como texto', () => {
  assert.deepEqual(trozos('[clic](javascript:alert(1))'), [{ t: 'texto', v: '[clic](javascript:alert(1))' }])
  assert.deepEqual(trozos('[viejo](http://x.com)'), [{ t: 'texto', v: '[viejo](http://x.com)' }])
})

test('filaAGuia arma la guía desde la fila de Supabase', () => {
  const g = filaAGuia({
    slug: 'jarvis', palabra: 'JARVIS', titulo: 'T', resumen: 'R', etiqueta: 'E', incluye: ['a'],
    fuente_nombre: 'GitHub', fuente_url: 'https://github.com/x', imagen_url: null,
    abierto: [{ tipo: 'parrafo', texto: 'hola' }], bloqueado: [{ tipo: 'enlace', texto: 'Ir', url: 'https://x.com' }],
  })
  assert.equal(g?.fuenteNombre, 'GitHub')
  assert.equal(g?.bloqueado.length, 1)
})

test('filaAGuia rechaza un bloque desconocido o un enlace que no es https', () => {
  const base = { slug: 'x', palabra: 'X', titulo: 'T', resumen: 'R', etiqueta: 'E', incluye: [], abierto: [] }
  assert.equal(filaAGuia({ ...base, bloqueado: [{ tipo: 'html', texto: '<b>' }] }), null)
  assert.equal(filaAGuia({ ...base, bloqueado: [{ tipo: 'enlace', texto: 'Ir', url: 'javascript:alert(1)' }] }), null)
})
