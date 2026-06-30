import { blankCanvas, compositeSvg } from '../lib/render.mjs'
import { svgDoc, pill, footer, counter, escapeXml, wrapText } from '../lib/svg.mjs'
import { FONT, COLORS, MARGIN, W } from '../lib/tokens.mjs'

const CARD_BG = { good: COLORS.cardCream, bad: COLORS.cardCreamAlt, plain: COLORS.cardCream }
const CARD_TITLE = { good: COLORS.good, bad: COLORS.bad, plain: COLORS.ink }

// Badge dibujado (check/equis) — librsvg no renderiza emoji a color de forma fiable.
function badge(kind, x, y) {
  if (kind !== 'good' && kind !== 'bad') return ''
  const bs = 30
  const color = kind === 'good' ? COLORS.good : COLORS.bad
  const glyph = kind === 'good'
    ? `<path d="M ${x + 7} ${y + 16} L ${x + 13} ${y + 22} L ${x + 23} ${y + 9}" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<path d="M ${x + 9} ${y + 9} L ${x + 21} ${y + 21} M ${x + 21} ${y + 9} L ${x + 9} ${y + 21}" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"/>`
  return `<rect x="${x}" y="${y}" width="${bs}" height="${bs}" rx="8" fill="${color}"/>${glyph}`
}

export async function renderInterior({ outPath, pill: pillLabel, heading, headingAccent, cards, index, total }) {
  const headLines = wrapText(heading, { fontSize: 60, maxWidth: W - MARGIN * 2 })
  const headSvg = headLines.map((l, i) => {
    const colored = headingAccent && l.includes(headingAccent)
      ? l.split(headingAccent).map((p, j, a) => escapeXml(p) + (j < a.length - 1 ? `<tspan fill="${COLORS.orange}">${escapeXml(headingAccent)}</tspan>` : '')).join('')
      : escapeXml(l)
    return `<text x="${MARGIN}" y="${300 + i * 70}" font-family="${FONT}" font-size="60" font-weight="800" letter-spacing="-1.6" fill="${COLORS.ink}">${colored}</text>`
  }).join('')

  let y = 300 + headLines.length * 70 + 40
  const cardSvg = cards.map((c) => {
    const bodyLines = wrapText(c.body, { fontSize: 30, maxWidth: W - MARGIN * 2 - 56, charRatio: 0.5 })
    const cardH = 70 + bodyLines.length * 38 + 18
    const hasBadge = c.kind === 'good' || c.kind === 'bad'
    const titleX = hasBadge ? MARGIN + 72 : MARGIN + 28
    const block = `
      <rect x="${MARGIN}" y="${y}" rx="16" ry="16" width="${W - MARGIN * 2}" height="${cardH}" fill="${CARD_BG[c.kind]}" stroke="${COLORS.borderCream}"/>
      ${badge(c.kind, MARGIN + 28, y + 24)}
      <text x="${titleX}" y="${y + 50}" font-family="${FONT}" font-size="30" font-weight="700" fill="${CARD_TITLE[c.kind]}">${escapeXml(c.title)}</text>
      ${bodyLines.map((l, i) => `<text x="${MARGIN + 28}" y="${y + 92 + i * 38}" font-family="${FONT}" font-size="30" font-weight="500" fill="${COLORS.ink}">${escapeXml(l)}</text>`).join('')}`
    y += cardH + 22
    return block
  }).join('')

  const inner = (index ? counter({ index, total, variant: 'cream' }) : '') +
    pill({ y: 200, label: pillLabel, variant: 'cream' }) + headSvg + cardSvg + footer({ variant: 'cream' })
  return compositeSvg(blankCanvas(COLORS.cream), svgDoc(inner), outPath)
}
