import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { blankCanvas } from '../lib/render.mjs'
import { svgDoc, pill, footer, counter, escapeXml, wrapText } from '../lib/svg.mjs'
import { FONT, COLORS, MARGIN, W } from '../lib/tokens.mjs'

const CONTENT_W = W - MARGIN * 2
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

const wrapBody = (text, fs, pad, cr) => wrapText(text, { fontSize: fs, maxWidth: CONTENT_W - pad, charRatio: cr })

// Mide la altura de cada bloque (algunos requieren leer metadata de imagen → async).
async function measure(b) {
  if (b.type === 'prompt') {
    const lines = wrapBody(b.text, 25, 48, 0.62)
    return { ...b, lines, h: 60 + lines.length * 34 + 24 + (b.note ? 40 : 0) }
  }
  if (b.type === 'metric') return { ...b, h: 132 }
  if (b.type === 'shot') {
    const meta = await sharp(b.src).metadata()
    const dispH = Math.round(CONTENT_W * (meta.height / meta.width))
    return { ...b, dispH, h: dispH + (b.caption ? 46 : 0) }
  }
  const bodyLines = wrapBody(b.body, 30, 56, 0.5)
  return { ...b, type: 'card', bodyLines, h: 66 + bodyLines.length * 38 + 16 }
}

export async function renderInterior({ outPath, pill: pillLabel, heading, headingAccent, blocks, cards, index, total }) {
  const items = blocks || (cards || []).map((c) => ({ type: 'card', ...c }))
  const headLines = wrapText(heading, { fontSize: 58, maxWidth: CONTENT_W })
  const measured = await Promise.all(items.map(measure))
  const GAP = 20
  const sumStack = (arr) => arr.reduce((s, m) => s + m.h + GAP, 0) - GAP

  // Pill (eyebrow) fija arriba; título + stack de bloques centrados en el cuerpo.
  const PILL_Y = 176
  const BODY_TOP = 348, BODY_BOTTOM = 1262
  const titleH = headLines.length * 68
  const availStack = (BODY_BOTTOM - BODY_TOP) - titleH - 44
  let stackH = sumStack(measured)
  // Si el stack no cabe, achica las capturas (shots) proporcionalmente para no chocar el footer.
  if (stackH > availStack) {
    const shots = measured.filter((m) => m.type === 'shot')
    const shotsImgH = shots.reduce((s, m) => s + m.dispH, 0)
    const over = stackH - availStack
    if (shots.length && shotsImgH - over > 160) {
      const scale = (shotsImgH - over) / shotsImgH
      for (const m of shots) { m.dispH = Math.round(m.dispH * scale); m.h = m.dispH + (m.caption ? 46 : 0) }
      stackH = sumStack(measured)
    }
  }
  const visualBlockH = 46 + titleH + 44 + stackH
  const visualTop = Math.max(BODY_TOP, Math.round((BODY_TOP + BODY_BOTTOM) / 2 - visualBlockH / 2))
  const headY0 = visualTop + 46

  const headSvg = headLines.map((l, i) => {
    const colored = headingAccent && l.includes(headingAccent)
      ? l.split(headingAccent).map((p, j, a) => escapeXml(p) + (j < a.length - 1 ? `<tspan fill="${COLORS.orange}">${escapeXml(headingAccent)}</tspan>` : '')).join('')
      : escapeXml(l)
    return `<text x="${MARGIN}" y="${headY0 + i * 68}" font-family="${FONT}" font-size="58" font-weight="800" letter-spacing="-1.6" fill="${COLORS.ink}">${colored}</text>`
  }).join('')

  const rasters = []
  let svg = ''
  let y = headY0 + (headLines.length - 1) * 68 + 56 // top del primer bloque

  for (const m of measured) {
    if (m.type === 'card') {
      const hasBadge = m.kind === 'good' || m.kind === 'bad'
      const titleX = hasBadge ? MARGIN + 72 : MARGIN + 28
      svg += `
        <rect x="${MARGIN}" y="${y}" rx="16" ry="16" width="${CONTENT_W}" height="${m.h}" fill="${CARD_BG[m.kind]}" stroke="${COLORS.borderCream}"/>
        ${badge(m.kind, MARGIN + 28, y + 22)}
        <text x="${titleX}" y="${y + 48}" font-family="${FONT}" font-size="30" font-weight="700" fill="${CARD_TITLE[m.kind]}">${escapeXml(m.title)}</text>
        ${m.bodyLines.map((l, i) => `<text x="${MARGIN + 28}" y="${y + 90 + i * 38}" font-family="${FONT}" font-size="30" font-weight="500" fill="${COLORS.ink}">${escapeXml(l)}</text>`).join('')}`
    } else if (m.type === 'prompt') {
      svg += `
        <rect x="${MARGIN}" y="${y}" rx="16" ry="16" width="${CONTENT_W}" height="${m.h}" fill="#141414"/>
        <text x="${MARGIN + 28}" y="${y + 42}" font-family="ui-monospace, Menlo, monospace" font-size="17" font-weight="700" letter-spacing="1.5" fill="${COLORS.orange}">PROMPT</text>
        ${m.lines.map((l, i) => `<text x="${MARGIN + 28}" y="${y + 80 + i * 34}" font-family="ui-monospace, Menlo, monospace" font-size="25" fill="#e4e4e7">${escapeXml(l)}</text>`).join('')}
        ${m.note ? `<text x="${MARGIN + 28}" y="${y + m.h - 22}" font-family="${FONT}" font-size="24" font-weight="600" fill="${COLORS.orange}">${escapeXml(m.note)}</text>` : ''}`
    } else if (m.type === 'metric') {
      svg += `
        <text x="${MARGIN}" y="${y + 82}" font-family="${FONT}" font-size="88" font-weight="800" letter-spacing="-3" fill="${COLORS.orange}">${escapeXml(m.value)}</text>
        <text x="${MARGIN}" y="${y + 122}" font-family="${FONT}" font-size="28" font-weight="600" fill="${COLORS.subOnCream}">${escapeXml(m.label)}</text>`
    } else if (m.type === 'shot') {
      const mask = Buffer.from(`<svg width="${CONTENT_W}" height="${m.dispH}"><rect width="${CONTENT_W}" height="${m.dispH}" rx="16" ry="16" fill="#fff"/></svg>`)
      const imgBuf = await sharp(m.src).resize(CONTENT_W, m.dispH, { fit: 'cover' }).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
      rasters.push({ input: imgBuf, left: MARGIN, top: Math.round(y) })
      svg += `<rect x="${MARGIN}" y="${y}" width="${CONTENT_W}" height="${m.dispH}" rx="16" ry="16" fill="none" stroke="${COLORS.borderCream}"/>`
      if (m.caption) svg += `<text x="${MARGIN + 4}" y="${y + m.dispH + 34}" font-family="${FONT}" font-size="24" font-weight="600" fill="${COLORS.subOnCream}">${escapeXml(m.caption)}</text>`
    }
    y += m.h + GAP
  }

  const inner = (index ? counter({ index, total, variant: 'cream' }) : '') +
    pill({ y: PILL_Y, label: pillLabel, variant: 'cream' }) + headSvg + svg + footer({ variant: 'cream' })

  await mkdir(dirname(outPath), { recursive: true })
  await blankCanvas(COLORS.cream)
    .composite([...rasters, { input: Buffer.from(svgDoc(inner)), top: 0, left: 0 }])
    .png().toFile(outPath)
  const meta = await sharp(outPath).metadata()
  return { width: meta.width, height: meta.height, outPath }
}
