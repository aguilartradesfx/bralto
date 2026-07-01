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

// Le damos la INFORMACIÓN y el estilo de marca; el modelo decide la composición
// (y puede agregar mockups de UI). No le dictamos el orden.
function interiorPrompt(s) {
  const items = s.blocks || (s.cards || []).map((c) => ({ type: 'card', ...c }))
  const info = []
  items.forEach((b) => {
    if (b.type === 'card') {
      const mark = b.kind === 'good' ? '✓ (positivo, palomita verde)' : b.kind === 'bad' ? '✗ (negativo, tache rojo)' : '(neutral)'
      info.push(`${mark} ${b.title}: ${b.body}`)
    } else if (b.type === 'prompt') {
      info.push(`Un PROMPT de ejemplo, mostrado como una cajita oscura tipo terminal con texto monoespaciado pequeño: "${b.text}". Nota chica en naranja: "${b.note || ''}". Los placeholders entre [corchetes] van en naranja.`)
    } else if (b.type === 'metric') {
      info.push(`Un dato/métrica destacado en grande: "${b.value}" — ${b.label}.`)
    } else if (b.type === 'shot') {
      info.push(`Un mockup realista de interfaz (captura simulada) que ilustre: ${b.caption}. Dibuja botones, paneles o ventanas creíbles.`)
    }
  })
  return [
    'Diseña UNA slide de carrusel vertical 3:4 para "Bralto" (marca de IA para agencias). Piensa como diseñador senior: hazla MUY GRÁFICA y visual, no una lista de texto. Tú decides toda la composición.',
    'PALETA ESTRICTA (respétala exacto): fondo crema #F4F1EA, texto casi-negro #0d0d0d, y UN solo color de acento: naranja #FF6A00. Nada de azules, morados u otros colores (verde/rojo permitidos SOLO en una palomita/tache diminutos). Tipografía tipo Helvetica Neue.',
    'SÉ GRÁFICO: usa mockups de UI realistas (paneles de app, botones, campos, burbujas de chat), íconos simples, diagramas o flechas para explicar la idea. Que se ENTIENDA de un vistazo. Texto pequeño pero nítido y muy legible.',
    `TEMA DE LA SLIDE: "${s.heading}". Resalta la palabra clave "${s.accent || ''}" en naranja. Etiqueta pequeña tipo tag: "${s.pill}".`,
    'USA SOLO esta información y este texto en español (LatAm). NO inventes texto, NO uses lorem ipsum, NO agregues frases de relleno. Escribe TODO correctamente, sin errores de ortografía:',
    ...info.map((x) => `- ${x}`),
    'Abajo-izquierda: wordmark pequeño "bralto." (el punto en naranja). Abajo-derecha: "desliza ››" en gris. Sin marca de agua ni firma.',
  ].join('\n')
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
    await genBase({ prompt: interiorPrompt(s), provider, outPath: raw, imageSize: '4K' })
    // Normaliza a 1080x1440 sin recortar (letterbox crema si el ratio difiere, ej. gpt 2:3).
    await sharp(raw).resize(1080, 1440, { fit: 'contain', background: '#F4F1EA' }).png().toFile(out)
    console.log(`  ✓ ${out} (${provider})`)
  }
}
console.log(`✓ ${spec.slug} — interiores por ${provider}`)
