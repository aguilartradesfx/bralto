// Genera una imagen base para la línea gráfica de social (dirección C · Híbrido).
// La idea: la IA produce la escena oscura/cinematográfica CON espacio negativo
// limpio reservado para texto; el texto se compone después con sharp.
//
// Uso:
//   node --env-file=.env.local scripts/social/gen-base.mjs --provider gemini --out out.png
//   node --env-file=.env.local scripts/social/gen-base.mjs --provider openai --out out.png
//   ...--prompt "tu prompt"   (opcional, sobreescribe el default)
//
// Requiere: GEMINI_API_KEY y/o OPENAI_API_KEY en el entorno.

import { writeFile } from 'node:fs/promises'

// ── args ─────────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]?.startsWith('--') ? true : arr[i + 1]])
    return acc
  }, []),
)
const provider = args.provider || 'gemini'
const out = args.out || `base-${provider}.png`

// ── prompt por defecto (portada oscura, espacio negativo abajo para texto) ────
const DEFAULT_PROMPT = `Cinematic 3:4 vertical hero image for a premium tech brand. \
Near-black studio background (#0d0d0d), deep shadows, subtle volumetric haze. \
The ONLY accent color is warm vivid orange (#FF6A00): a single glowing, molten-orange \
abstract asterisk/spark sculpture floating in the UPPER HALF of the frame, with soft \
orange rim light and a faint reflection below. Editorial, minimal, high-end product-render look. \
CRITICAL COMPOSITION: keep the ENTIRE LOWER 45% of the image as clean, smooth, empty \
dark negative space (gradient fading to pure near-black) reserved for text — no objects, \
no detail, no glow there. \
ABSOLUTELY NO text, letters, words, numbers, logos, watermarks or UI anywhere in the image. \
No other colors than orange and dark neutrals. Photorealistic, 35mm, shallow depth of field.`

const prompt = args.prompt && args.prompt !== true ? args.prompt : DEFAULT_PROMPT

// ── Gemini (Nano Banana Pro = gemini-3-pro-image) ─────────────────────────────
async function genGemini() {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('Falta GEMINI_API_KEY en el entorno')
  const models = ['gemini-3-pro-image-preview', 'gemini-3-pro-image']
  let lastErr
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: '3:4', imageSize: '2K' },
      },
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      lastErr = `[${model}] ${res.status}: ${JSON.stringify(json).slice(0, 600)}`
      console.error('  ⚠', lastErr)
      continue
    }
    const parts = json?.candidates?.[0]?.content?.parts || []
    const img = parts.find((p) => p.inlineData?.data)
    if (!img) {
      lastErr = `[${model}] respuesta sin imagen: ${JSON.stringify(json).slice(0, 600)}`
      console.error('  ⚠', lastErr)
      continue
    }
    return Buffer.from(img.inlineData.data, 'base64')
  }
  throw new Error('Gemini falló en todos los model ids.\n' + lastErr)
}

// ── OpenAI (gpt-image-1) ──────────────────────────────────────────────────────
async function genOpenai() {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('Falta OPENAI_API_KEY en el entorno')
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    // 1024x1536 (2:3) es el retrato nativo; luego recortamos a 3:4 al componer.
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1536', n: 1 }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${JSON.stringify(json).slice(0, 600)}`)
  const b64 = json?.data?.[0]?.b64_json
  if (!b64) throw new Error(`OpenAI respuesta sin imagen: ${JSON.stringify(json).slice(0, 600)}`)
  return Buffer.from(b64, 'base64')
}

// ── run ───────────────────────────────────────────────────────────────────────
console.log(`→ Generando imagen base con ${provider}…`)
const buf = provider === 'openai' ? await genOpenai() : await genGemini()
await writeFile(out, buf)
console.log(`✓ Guardada: ${out} (${(buf.length / 1024).toFixed(0)} KB)`)
