import { compositeSvg, blankCanvas } from '../lib/render.mjs'
import { svgDoc, footer, counter, escapeXml, wrapText } from '../lib/svg.mjs'
import { FONT, COLORS, MARGIN, W } from '../lib/tokens.mjs'

export async function renderClosing({ basePath, outPath, headline, ctaLines = [], handle = '@bralto', index, total }) {
  const hLines = wrapText(headline, { fontSize: 72, maxWidth: W - MARGIN * 2 })
  const top = 620
  const hSvg = hLines.map((l, i) => `<text x="${MARGIN}" y="${top + i * 82}" font-family="${FONT}" font-size="72" font-weight="800" letter-spacing="-2" fill="${COLORS.white}">${escapeXml(l)}</text>`).join('')
  let cy = top + hLines.length * 82 + 30
  const ctaSvg = ctaLines.map((c) => { const t = `<text x="${MARGIN}" y="${cy}" font-family="${FONT}" font-size="34" font-weight="600" fill="${COLORS.subOnDark}">→ ${escapeXml(c)}</text>`; cy += 50; return t }).join('')
  const glow = `<defs><radialGradient id="g" cx="50%" cy="28%" r="45%"><stop offset="0%" stop-color="${COLORS.orange}" stop-opacity="0.28"/><stop offset="100%" stop-color="${COLORS.orange}" stop-opacity="0"/></radialGradient></defs><rect width="1080" height="1440" fill="url(#g)"/>`
  const handleSvg = `<text x="${MARGIN}" y="${top - 60}" font-family="${FONT}" font-size="30" font-weight="700" fill="${COLORS.orange}">${escapeXml(handle)}</text>`
  const inner = (basePath ? '' : glow) + (index ? counter({ index, total }) : '') + handleSvg + hSvg + ctaSvg + footer({})
  const base = basePath || blankCanvas(COLORS.ink)
  return compositeSvg(base, svgDoc(inner), outPath)
}
