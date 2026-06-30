// Render mínimo para verificar dimensiones del pipeline base + helpers.
import { blankCanvas, compositeSvg } from '../lib/render.mjs'
import { W, H, COLORS, FONT } from '../lib/tokens.mjs'

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text x="72" y="200" font-family="${FONT}" font-size="64" font-weight="800" fill="${COLORS.orange}">Bralto check</text>
</svg>`

const out = process.argv[2] || 'scripts/social/out/_check.png'
const res = await compositeSvg(blankCanvas(COLORS.ink), svg, out)
if (res.width !== 1080 || res.height !== 1440) {
  console.error(`✗ dimensiones ${res.width}x${res.height}, esperaba 1080x1440`)
  process.exit(1)
}
console.log(`✓ ${out} ${res.width}x${res.height}`)

// ── helpers (Task 2) ──────────────────────────────────────────────────────────
import { svgDoc, pill, footer, counter, lateralBar, wrapText, accentTspans } from '../lib/svg.mjs'
import { FONT as F2, COLORS as C2, MARGIN as M2 } from '../lib/tokens.mjs'
const lines = wrapText('Los 5 errores de IA que frenan tu agencia', { fontSize: 78, maxWidth: 1080 - M2 * 2 })
const headline = lines.map((l, i) =>
  `<text x="${M2 - 4}" y="${940 + i * 88}" font-family="${F2}" font-size="78" font-weight="800" letter-spacing="-2.4" fill="${C2.white}">${accentTspans(l, 'IA')}</text>`
).join('')
const inner = lateralBar() + pill({ y: 806, label: 'errores · IA' }) + headline + counter({ index: 1, total: 7 }) + footer({})
const out2 = process.argv[3] || 'scripts/social/out/_check-helpers.png'
const r2 = await compositeSvg(blankCanvas(C2.ink), svgDoc(inner), out2)
if (r2.width !== 1080 || r2.height !== 1440) { console.error('✗ helpers dims'); process.exit(1) }
console.log(`✓ ${out2} ${r2.width}x${r2.height}`)
