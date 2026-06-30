import sharp from 'sharp'
import { compositeSvg, blankCanvas } from '../lib/render.mjs'
import { svgDoc, pill, footer, counter, escapeXml, wrapText } from '../lib/svg.mjs'
import { COLORS, MARGIN, W } from '../lib/tokens.mjs'

export async function renderPromptShowcase({ outPath, gridImagePaths = [], promptText, pill: pillLabel, index, total }) {
  // grilla 2x2 en la mitad superior, cada celda 468x300 con gap, esquinas redondeadas
  const cell = { w: 468, h: 300, gap: 12, x0: MARGIN, y0: 150 }
  const tiles = []
  for (let i = 0; i < Math.min(4, gridImagePaths.length); i++) {
    const col = i % 2, row = Math.floor(i / 2)
    const x = cell.x0 + col * (cell.w + cell.gap)
    const y = cell.y0 + row * (cell.h + cell.gap)
    const buf = await sharp(gridImagePaths[i]).resize(cell.w, cell.h, { fit: 'cover' })
      .composite([{ input: Buffer.from(`<svg width="${cell.w}" height="${cell.h}"><rect width="${cell.w}" height="${cell.h}" rx="14" ry="14" fill="#fff"/></svg>`), blend: 'dest-in' }]).png().toBuffer()
    tiles.push({ input: buf, top: y, left: x })
  }
  const promptLines = wrapText(promptText, { fontSize: 26, maxWidth: W - MARGIN * 2 - 48, charRatio: 0.62 })
  const promptBoxH = 56 + promptLines.length * 34 + 20
  const promptY = 800
  const inner = (index ? counter({ index, total }) : '') + pill({ y: promptY - 64, label: pillLabel }) +
    `<rect x="${MARGIN}" y="${promptY}" width="${W - MARGIN * 2}" height="${promptBoxH}" rx="14" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)"/>
     <text x="${MARGIN + 24}" y="${promptY + 44}" font-family="ui-monospace, Menlo, monospace" font-size="18" font-weight="700" letter-spacing="1" fill="${COLORS.orange}">PROMPT</text>
     ${promptLines.map((l, i) => `<text x="${MARGIN + 24}" y="${promptY + 80 + i * 34}" font-family="ui-monospace, Menlo, monospace" font-size="26" fill="#e4e4e7">${escapeXml(l)}</text>`).join('')}` +
    footer({})
  // Componer la grilla a un buffer PRIMERO (sharp.composite no se puede llamar 2x
  // sobre el mismo pipeline: la segunda llamada sobreescribe la primera).
  const baseBuf = await blankCanvas(COLORS.ink)
    .composite(tiles.length ? tiles : [])
    .png().toBuffer()
  return compositeSvg(baseBuf, svgDoc(inner), outPath)
}
