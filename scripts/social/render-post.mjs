import { mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { genBase } from './gen-base.mjs'
import { renderCover } from './templates/cover.mjs'
import { renderInterior } from './templates/interior.mjs'
import { renderPromptShowcase } from './templates/prompt-showcase.mjs'
import { renderClosing } from './templates/closing.mjs'

const specPath = process.argv[2]
if (!specPath) { console.error('uso: render-post.mjs <post-spec.mjs>'); process.exit(1) }
const spec = (await import(pathToFileURL(specPath).href)).default
const dir = `scripts/social/out/${spec.slug}`
await mkdir(dir, { recursive: true })

const total = spec.slides.length
const pad = (n) => String(n).padStart(2, '0')
const results = []

for (let i = 0; i < spec.slides.length; i++) {
  const s = spec.slides[i]
  const index = i + 1
  const out = `${dir}/${pad(index)}.png`
  if (s.type === 'cover') {
    const basePath = `${dir}/base-${pad(index)}.png`
    await genBase({ prompt: s.aiPrompt, provider: 'gemini', outPath: basePath })
    await renderCover({ basePath, outPath: out, pill: s.pill, headline: s.headline, accent: s.accent, subtitle: s.subtitle, index, total })
  } else if (s.type === 'interior') {
    await renderInterior({ outPath: out, pill: s.pill, heading: s.heading, headingAccent: s.headingAccent, cards: s.cards, index, total })
  } else if (s.type === 'prompt-showcase') {
    const grid = []
    for (let g = 0; g < (s.aiPromptForGrid || []).length; g++) {
      const gp = `${dir}/grid-${pad(index)}-${g}.png`
      await genBase({ prompt: s.aiPromptForGrid[g], provider: 'gemini', outPath: gp })
      grid.push(gp)
    }
    await renderPromptShowcase({ outPath: out, gridImagePaths: grid, promptText: s.promptText, pill: s.pill, index, total })
  } else if (s.type === 'closing') {
    let basePath
    if (s.aiPrompt) { basePath = `${dir}/base-${pad(index)}.png`; await genBase({ prompt: s.aiPrompt, provider: 'gemini', outPath: basePath }) }
    await renderClosing({ basePath, outPath: out, headline: s.headline, ctaLines: s.ctaLines, handle: s.handle, index, total })
  } else { throw new Error(`tipo de slide desconocido: ${s.type}`) }
  results.push(out)
  console.log(`  ✓ ${out}`)
}
console.log(`✓ ${spec.slug}: ${results.length} slides`)
