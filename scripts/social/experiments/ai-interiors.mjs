// EXPERIMENTO: generar los INTERIORES como imágenes completas de IA (texto incluido
// por el modelo), reusando portada y cierre ya renderizados por código.
//
// Uso: node --env-file=.env.local scripts/social/experiments/ai-interiors.mjs <spec> <gemini|openai>

import { mkdir, copyFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { genBase } from '../gen-base.mjs'

const specPath = process.argv[2]
const provider = process.argv[3] || 'gemini'
if (!specPath) { console.error('uso: ai-interiors.mjs <spec> <gemini|openai>'); process.exit(1) }
const spec = (await import(pathToFileURL(specPath).href)).default
const srcDir = `scripts/social/out/${spec.slug}`
const outDir = `scripts/social/out/${spec.slug}__ai-${provider}`
await mkdir(outDir, { recursive: true })

// Describe el interior al modelo con el estilo de marca + el contenido exacto.
function interiorPrompt(s) {
  const p = []
  p.push('Design ONE premium social-media carousel slide, vertical 3:4 aspect ratio.')
  p.push('Background: warm off-white cream (#F4F1EA). Minimalist, editorial, high-end, generous clean spacing.')
  p.push('Typography: bold heavy grotesque sans-serif like Helvetica Neue, near-black (#0d0d0d). The ONLY accent color is vivid orange (#FF6A00) — no blues, greens or other accents except the badges noted below.')
  p.push(`TOP-LEFT: a small black rounded-pill tag, white UPPERCASE text "${s.pill}", with a tiny orange dot to the left of the text.`)
  p.push(`HEADLINE below, large and bold near-black, with the word "${s.accent || ''}" colored orange: "${s.heading}".`)
  const items = s.blocks || (s.cards || []).map((c) => ({ type: 'card', ...c }))
  items.forEach((b) => {
    if (b.type === 'card') {
      const badge = b.kind === 'good' ? 'a small green rounded-square badge with a white checkmark' : b.kind === 'bad' ? 'a small red rounded-square badge with a white X' : 'no badge'
      const bg = b.kind === 'bad' ? 'light warm-gray' : 'white'
      p.push(`A ${bg} rounded card containing ${badge}, a bold title "${b.title}", and body text "${b.body}".`)
    } else if (b.type === 'prompt') {
      p.push(`A dark near-black rounded box like a code terminal, with a small orange monospace label "PROMPT" and light-gray monospace text: "${b.text}". Any bracketed placeholder like [TU AGENCIA] must be colored orange.`)
    } else if (b.type === 'metric') {
      p.push(`A very large bold ORANGE number "${b.value}" with a small gray caption under it: "${b.label}".`)
    } else if (b.type === 'shot') {
      p.push(`A rounded light-gray framed area (placeholder for a screenshot) with a small caption "${b.caption || ''}".`)
    }
  })
  p.push('BOTTOM-LEFT: small bold "bralto." wordmark, the period in orange. BOTTOM-RIGHT: "desliza ››" in gray.')
  p.push('ALL text spelled correctly in Spanish (LatAm), crisp and perfectly legible, no gibberish. No watermark, no signature.')
  return p.join(' ')
}

const pad = (n) => String(n).padStart(2, '0')
for (let i = 0; i < spec.slides.length; i++) {
  const s = spec.slides[i]
  const n = pad(i + 1)
  const out = `${outDir}/${n}.png`
  if (s.type === 'cover' || s.type === 'closing') {
    await copyFile(`${srcDir}/${n}.png`, out) // portada/cierre: tal como están
    console.log(`  = ${out} (existente)`)
  } else {
    const raw = `${outDir}/raw-${n}.png`
    await genBase({ prompt: interiorPrompt(s), provider, outPath: raw })
    // Normaliza a 1080x1440 sin recortar (letterbox crema si el ratio difiere, ej. gpt 2:3).
    await sharp(raw).resize(1080, 1440, { fit: 'contain', background: '#F4F1EA' }).png().toFile(out)
    console.log(`  ✓ ${out} (${provider})`)
  }
}
console.log(`✓ ${spec.slug} — interiores por ${provider}`)
