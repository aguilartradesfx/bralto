import { test } from 'node:test'
import assert from 'node:assert/strict'
import { agrupar, bloquesVisibles, filaAGuia, idSeccion, secciones, trozos, type Guia, type Visible } from './contenido.ts'

const IMG = 'https://pjwmfllnyauobityaile.supabase.co/storage/v1/object/public/social-images/guias/jarvis/paso-1.webp'

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

test('una imagen se acepta solo desde la carpeta de guías de Supabase y con su tamaño', () => {
  const fila = { slug: 'x', palabra: 'X', titulo: 'T', resumen: 'R', etiqueta: 'E', incluye: [], abierto: [] }
  const imagen = { tipo: 'imagen', src: IMG, alt: 'El paso 1', ancho: 1080, alto: 1350 }
  assert.ok(filaAGuia({ ...fila, bloqueado: [imagen] }))
  assert.equal(filaAGuia({ ...fila, bloqueado: [{ ...imagen, src: 'https://otro-sitio.com/a.webp' }] }), null)
  assert.equal(filaAGuia({ ...fila, bloqueado: [{ ...imagen, alt: '' }] }), null)
  assert.equal(filaAGuia({ ...fila, bloqueado: [{ ...imagen, ancho: undefined }] }), null)
})

test('secciones salen de los subtítulos, con un id estable para «Ir directo a»', () => {
  const g: Guia = {
    ...guia,
    abierto: [{ tipo: 'parrafo', texto: 'Intro' }],
    bloqueado: [
      { tipo: 'subtitulo', texto: 'Lo que necesita' },
      { tipo: 'parrafo', texto: 'x' },
      { tipo: 'subtitulo', texto: '¿Cuánto cuesta?' },
    ],
  }
  assert.deepEqual(secciones(g), [
    { id: 'lo-que-necesita', texto: 'Lo que necesita' },
    { id: 'cuanto-cuesta', texto: '¿Cuánto cuesta?' },
  ])
  assert.equal(idSeccion('01 · El diseñador ($3,000): frontend-design'), '01-el-disenador-3000-frontend-design')
})

test('agrupar junta cada paso con lo que sigue hasta el próximo paso o subtítulo', () => {
  const bloques: Visible[] = [
    { tipo: 'subtitulo', texto: 'Instálelo' },
    { tipo: 'paso', titulo: 'Uno', numero: 1 },
    { tipo: 'codigo', codigo: 'git clone' },
    { tipo: 'imagen', src: IMG, alt: 'a', ancho: 1080, alto: 1350 },
    { tipo: 'paso', titulo: 'Dos', numero: 2 },
    { tipo: 'subtitulo', texto: 'Después' },
    { tipo: 'parrafo', texto: 'suelto' },
  ]
  const g = agrupar(bloques)
  assert.deepEqual(g.map((x) => x.tipo), ['bloque', 'paso', 'paso', 'bloque', 'bloque'])
  const uno = g[1]
  assert.ok(uno.tipo === 'paso' && uno.cuerpo.length === 1 && uno.imagenes.length === 1)
  const dos = g[2]
  assert.ok(dos.tipo === 'paso' && dos.cuerpo.length === 0 && dos.imagenes.length === 0)
})

test('filaAGuia rechaza un slug que no sea minúsculas, números y guiones', () => {
  const fila = { palabra: 'X', titulo: 'T', resumen: 'R', etiqueta: 'E', incluye: [], abierto: [], bloqueado: [] }
  assert.equal(filaAGuia({ ...fila, slug: 'Claude_Code' }), null)
  assert.equal(filaAGuia({ ...fila, slug: '../evil' }), null)
  assert.ok(filaAGuia({ ...fila, slug: 'herramientas-que-valen' }))
})

test('filaAGuia rechaza un bloque desconocido o un enlace que no es https', () => {
  const base = { slug: 'x', palabra: 'X', titulo: 'T', resumen: 'R', etiqueta: 'E', incluye: [], abierto: [] }
  assert.equal(filaAGuia({ ...base, bloqueado: [{ tipo: 'html', texto: '<b>' }] }), null)
  assert.equal(filaAGuia({ ...base, bloqueado: [{ tipo: 'enlace', texto: 'Ir', url: 'javascript:alert(1)' }] }), null)
})
