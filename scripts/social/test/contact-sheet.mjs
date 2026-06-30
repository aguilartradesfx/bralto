import sharp from 'sharp'
import { readdirSync } from 'node:fs'
const base = 'scripts/social/out'
const dirs = readdirSync(base).filter((d) => /^0[1-5]-/.test(d)).sort()
const cols = 6, tw = 240, th = 320, gap = 16
let i = 0
const composites = []
for (const d of dirs) {
  for (const f of readdirSync(`${base}/${d}`).filter((n) => /^\d\d\.png$/.test(n)).sort()) {
    const col = i % cols, row = Math.floor(i / cols)
    composites.push({ input: await sharp(`${base}/${d}/${f}`).resize(tw, th).png().toBuffer(), left: gap + col * (tw + gap), top: gap + row * (th + gap) })
    i++
  }
}
const rows = Math.ceil(i / cols)
await sharp({ create: { width: gap + cols * (tw + gap), height: gap + rows * (th + gap), channels: 4, background: '#161617' } })
  .composite(composites).png().toFile(`${base}/_week1-contact-sheet.png`)
console.log(`✓ contact sheet: ${i} slides`)
