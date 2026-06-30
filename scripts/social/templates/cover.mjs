import { compositeSvg } from '../lib/render.mjs'
import { svgDoc, pill, footer, counter, wrapText, accentTspans } from '../lib/svg.mjs'
import { FONT, COLORS, MARGIN, W } from '../lib/tokens.mjs'

export async function renderCover({ basePath, outPath, pill: pillLabel, headline, accent, subtitle, index, total }) {
  const lines = wrapText(headline, { fontSize: 78, maxWidth: W - MARGIN * 2 })
  const top = 1000 - lines.length * 88   // ancla las líneas hacia la zona limpia inferior
  const headlineSvg = lines.map((l, i) =>
    `<text x="${MARGIN - 4}" y="${top + i * 88}" font-family="${FONT}" font-size="78" font-weight="800" letter-spacing="-2.4" fill="${COLORS.white}">${accentTspans(l, accent)}</text>`
  ).join('')
  const subY = top + (lines.length - 1) * 88 + 58
  const sub = subtitle
    ? `<text x="${MARGIN}" y="${subY}" font-family="${FONT}" font-size="31" font-weight="500" fill="${COLORS.subOnDark}">${subtitle}</text>` : ''
  const scrim = `<defs><linearGradient id="sc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.42" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.62"/></linearGradient></defs>
      <rect x="0" y="0" width="1080" height="1440" fill="url(#sc)"/>`
  const inner = scrim + (index ? counter({ index, total }) : '') +
    pill({ y: top - 150, label: pillLabel }) + headlineSvg + sub + footer({})
  return compositeSvg(basePath, svgDoc(inner), outPath)
}
