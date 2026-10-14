import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Archivos del panel (admin.bralto.io) y del login. signature-pad.tsx también lo usa la firma pública (/c/).
const ROOTS = ['app/(internal)', 'app/(auth)', 'components/internal', 'components/users', 'components/contracts', 'components/proposals', 'components/plan-q4']
const EXCLUDE = new Set(['components/contracts/signature-pad.tsx'])
const OLD_STYLE = /5bb6ff|7cc5ff|\bcyan\b|#0c0c0f|#131316|#111111|#060607|91\s*,?\s*182\s*,?\s*255|\b(?:bg|text|border)-(?:blue|sky|indigo|orange)-\d/i
// Colores de estado que usa el panel y viven fuera de sus carpetas
const STATE_FILES = ['types/contracts.ts', 'types/proposals.ts']

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return walk(path)
    return /\.(tsx?|css)$/.test(name) ? [path] : []
  })
}

test('el panel no usa el cian ni las superficies del estilo viejo', () => {
  const offenders = [...ROOTS.flatMap(walk), ...STATE_FILES]
    .filter((file) => !EXCLUDE.has(file))
    .flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, i) => (OLD_STYLE.test(line) ? [`${file}:${i + 1}: ${line.trim().slice(0, 90)}`] : [])),
    )
  assert.deepEqual(offenders, [])
})

// panel.css se carga después de Tailwind: si una pieza fija `position`, le gana a `fixed` / `sticky`
// (el menú, las barras y los modales dejarían de quedarse en su lugar)
test('las piezas del panel no fijan position', () => {
  const css = readFileSync('components/internal/panel.css', 'utf8')
  const offenders = [...css.matchAll(/(\.pn-[a-z-]+)[^{}]*\{([^}]*)\}/g)]
    .filter(([, , body]) => /(^|;|\s)position\s*:/.test(body))
    .map(([, selector]) => selector)
  assert.deepEqual(offenders, [])
})

test('el panel y el login usan los tokens, las fuentes y el fondo del sitio', () => {
  for (const file of ['app/(internal)/layout.tsx', 'app/(auth)/layout.tsx']) {
    const source = readFileSync(file, 'utf8')
    assert.match(source, /className="pn[\s"]/, file)
    assert.match(source, /panelFonts/, file)
    assert.match(source, /tokens\.css/, file)
    assert.match(source, /panel\.css/, file)
  }
})

// Tailwind solo genera las clases que encuentra en los archivos que escanea: los colores de estado
// viven en types/ (sin esto, las etiquetas de estado salen sin color y con el borde blanco por defecto)
test('Tailwind escanea types/, donde viven los colores de estado', () => {
  assert.match(readFileSync('tailwind.config.ts', 'utf8'), /'\.\/types\/\*\*\/\*\.\{[^}]*ts[^}]*\}'/)
})

// Con tema claro y oscuro, el panel no usa blanco fijo: usa fg (blanco en oscuro, casi negro en claro).
// Quedan blancos de verdad la hoja del contrato, su vista previa, el lienzo de la firma y el texto sobre rojo.
const WHITE_UTILITY = /(?<![\w-])(?:[a-z-]+:)*(?:text|bg|border|divide|placeholder|ring|decoration|outline|accent|caret)-white(?![\w-])/
const REAL_WHITE = ['bg-white rounded-2xl shadow-xl p-10', 'bg-white rounded-xl shadow-2xl p-8', 'touch-none bg-white', 'bg-red-500/90 hover:bg-red-500']

test('el panel no usa blanco fijo (sigue el tema claro u oscuro)', () => {
  const offenders = [...ROOTS.flatMap(walk), ...STATE_FILES]
    .filter((file) => !EXCLUDE.has(file) && /\.tsx?$/.test(file))
    .flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, i) =>
          WHITE_UTILITY.test(line) && !REAL_WHITE.some((ok) => line.includes(ok)) ? [`${file}:${i + 1}: ${line.trim().slice(0, 90)}`] : [],
        ),
    )
  assert.deepEqual(offenders, [])
})

// Los textos de estado (rojo, verde, ámbar) son tonos claros pensados para el fondo oscuro: en el tema claro
// panel.css los cambia por uno oscuro. Cada clase que use el panel necesita su regla.
test('los textos de color del panel tienen su tono para el tema claro', () => {
  const used = new Set(
    [...ROOTS.flatMap(walk), ...STATE_FILES]
      .filter((file) => !EXCLUDE.has(file) && /\.tsx?$/.test(file))
      .flatMap((file) => [...readFileSync(file, 'utf8').matchAll(/(?<![\w-])((?:hover:)?text-(?:red|green|emerald|amber|yellow|orange|lime|rose)-\d+(?:\/\d+)?)(?![\w-])/g)])
      .map((m) => m[1]),
  )
  const css = readFileSync('components/internal/panel.css', 'utf8')
  const light = [...css.matchAll(/([^{}]+)\{[^}]*\}/g)].map((m) => m[1]).filter((selector) => selector.includes("data-theme='light'"))
  const escaped = (cls: string) => '.' + cls.replace(/[:/]/g, (c) => `\\${c}`)
  const missing = [...used].filter((cls) => !light.some((selector) => selector.includes(escaped(cls))))
  assert.ok(used.size > 0)
  assert.deepEqual(missing, [])
})

test('el panel y el login arrancan con el tema guardado y tienen el fondo del sitio', () => {
  for (const file of ['app/(internal)/layout.tsx', 'app/(auth)/layout.tsx']) {
    const source = readFileSync(file, 'utf8')
    assert.match(source, /themeBootScript/, file)
    assert.match(source, /PanelAmbient/, file)
  }
})

function panelFiles(): string[] {
  return ROOTS.flatMap(walk).filter((file) => !EXCLUDE.has(file) && file.endsWith('.tsx'))
}

// pn-btn-solid pinta el blanco como background-image: disabled:bg-* no lo tapa y disabled:text-* deja el texto ilegible
test('los botones principales deshabilitados se atenúan con opacidad', () => {
  const offenders = panelFiles().flatMap((file) =>
    readFileSync(file, 'utf8')
      .split('\n')
      .flatMap((line, i) => (/pn-btn-solid[^"'`]*disabled:(?:bg|text)-/.test(line) ? [`${file}:${i + 1}`] : [])),
  )
  assert.deepEqual(offenders, [])
})

// Los campos marcan el foco con el borde (sin outline): tiene que verse (al menos 50 % de fg)
test('el borde de foco de los campos se ve', () => {
  const offenders = panelFiles().flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/focus:border-(?:white|fg)\/(\d+)/g)]
      .filter((m) => Number(m[1]) < 50)
      .map((m) => `${file}: ${m[0]}`),
  )
  assert.deepEqual(offenders, [])
})

// Los checkbox y radio no tienen borde de foco propio: no se les quita el outline
test('los checkbox y radio conservan el foco de teclado', () => {
  const css = readFileSync('components/internal/panel.css', 'utf8')
  const selectors = [...css.matchAll(/([^{}]+)\{\s*outline:\s*none;?\s*\}/g)].map((m) => m[1])
  assert.ok(selectors.length > 0)
  for (const selector of selectors) {
    assert.match(selector, /:not\(\[type=['"]?checkbox['"]?\]\)/, selector)
    assert.match(selector, /:not\(\[type=['"]?radio['"]?\]\)/, selector)
  }
})

// Las barras y paneles que flotan sobre contenido (incluida la hoja blanca del contrato) usan el vidrio denso
test('las barras sobre contenido usan el vidrio denso', () => {
  const bars: [string, RegExp][] = [
    ['app/(internal)/contratos/[id]/page.tsx', /sticky[^"]*pn-glass/],
    ['components/contracts/contract-form.tsx', /fixed bottom-0[^"]*pn-glass/],
    ['components/internal/internal-nav.tsx', /md:hidden fixed top-0[^"]*pn-glass/],
    ['components/proposals/solicitudes-dashboard.tsx', /max-w-\[520px\][^"]*pn-glass/],
  ]
  for (const [file, pattern] of bars) {
    const line = readFileSync(file, 'utf8').split('\n').find((l) => pattern.test(l))
    assert.ok(line, `${file}: no encontré la barra`)
    assert.match(line, /pn-glass--dense/, file)
  }
})
