import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Archivos del panel (admin.bralto.io) y del login. signature-pad.tsx también lo usa la firma pública (/c/).
const ROOTS = ['app/(internal)', 'app/(auth)', 'components/internal', 'components/users', 'components/contracts', 'components/proposals', 'components/plan-q4']
const EXCLUDE = new Set(['components/contracts/signature-pad.tsx'])
const OLD_STYLE = /5bb6ff|7cc5ff|\bcyan\b|#0c0c0f|#131316|#111111|#060607|91\s*,?\s*182\s*,?\s*255/i

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return walk(path)
    return /\.(tsx?|css)$/.test(name) ? [path] : []
  })
}

test('el panel no usa el cian ni las superficies del estilo viejo', () => {
  const offenders = ROOTS.flatMap(walk)
    .filter((file) => !EXCLUDE.has(file))
    .flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, i) => (OLD_STYLE.test(line) ? [`${file}:${i + 1}: ${line.trim().slice(0, 90)}`] : [])),
    )
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
