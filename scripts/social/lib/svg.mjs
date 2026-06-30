import { FONT, COLORS, W, H, MARGIN, FOOTER_Y } from './tokens.mjs'

export const escapeXml = (s) => String(s)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&apos;')

export function wrapText(text, { fontSize, maxWidth, charRatio = 0.54 }) {
  const maxChars = Math.max(6, Math.floor(maxWidth / (fontSize * charRatio)))
  const words = text.split(/\s+/)
  const lines = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (next.length > maxChars && line) { lines.push(line); line = w } else line = next
  }
  if (line) lines.push(line)
  return lines
}

export function accentTspans(line, accent, color = COLORS.orange) {
  if (!accent || !line.includes(accent)) return escapeXml(line)
  const parts = line.split(accent)
  return parts.map((p, i) =>
    escapeXml(p) + (i < parts.length - 1 ? `<tspan fill="${color}">${escapeXml(accent)}</tspan>` : '')
  ).join('')
}

export function pill({ x = MARGIN, y, label, variant = 'dark' }) {
  const text = label.toUpperCase()
  const w = 46 + text.length * 13.4 + 22   // 13.4px/char aprox para 20px bold + tracking
  const bg = variant === 'cream' ? COLORS.ink : 'rgba(255,255,255,0.10)'
  const stroke = variant === 'cream' ? 'none' : 'rgba(255,255,255,0.18)'
  return `
    <rect x="${x}" y="${y}" rx="23" ry="23" width="${w.toFixed(0)}" height="46" fill="${bg}" stroke="${stroke}"/>
    <circle cx="${x + 26}" cy="${y + 23}" r="5.5" fill="${COLORS.orange}"/>
    <text x="${x + 44}" y="${y + 31}" font-family="${FONT}" font-size="20" font-weight="700" letter-spacing="1.4" fill="${COLORS.white}">${escapeXml(text)}</text>`
}

export function footer({ variant = 'dark' }) {
  const fg = variant === 'cream' ? COLORS.ink : COLORS.white
  const swipe = variant === 'cream' ? COLORS.subOnCream : COLORS.orange
  return `
    <text x="${MARGIN}" y="${FOOTER_Y}" font-family="${FONT}" font-size="32" font-weight="800" letter-spacing="-0.5" fill="${fg}">bralto<tspan fill="${COLORS.orange}">.</tspan></text>
    <text x="${W - MARGIN}" y="${FOOTER_Y}" text-anchor="end" font-family="${FONT}" font-size="27" font-weight="700" fill="${swipe}">desliza ››</text>`
}

export function counter({ index, total, variant = 'dark' }) {
  const fg = variant === 'cream' ? COLORS.subOnCream : 'rgba(255,255,255,0.55)'
  return `<text x="${W - MARGIN}" y="${MARGIN + 22}" text-anchor="end" font-family="${FONT}" font-size="22" font-weight="700" fill="${fg}">${index}/${total}</text>`
}

export function lateralBar() {
  return `<rect x="${MARGIN - 16}" y="300" width="5" height="220" rx="2.5" fill="${COLORS.orange}"/>`
}

export const svgDoc = (inner) =>
  `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`
