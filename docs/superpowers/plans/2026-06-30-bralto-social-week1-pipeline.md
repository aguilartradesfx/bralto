# Bralto Social — Motor de plantillas + Semana 1 · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir los scripts validados (`gen-base.mjs`, `compose.mjs`) en un motor de plantillas parametrizable para los 4 tipos de slide, y producir la Semana 1 (5 posts) de punta a punta para validar el sistema antes del lote.

**Architecture:** Módulos JS (ESM) sin framework: tokens + helpers SVG compartidos → 4 plantillas (cover, interior, prompt-showcase, closing) que devuelven PNG 1080×1440 vía `sharp` (overlay SVG, sin navegador). Un `render-post.mjs` recorre la "spec" de un post (lista de slides) y produce los PNG numerados, llamando a `gen-base.mjs` (Nano Banana Pro) para las slides que necesitan imagen base IA. El contenido vive como data (un archivo `.mjs` por post).

**Tech Stack:** Node 24 (ESM, `fetch` global, `--env-file`), `sharp` (ya instalado, transitivo de Next.js), librsvg (vía sharp) para texto SVG con Helvetica Neue del sistema, Gemini `gemini-3-pro-image-preview`.

## Global Constraints

- Formato único: **1080×1440 (3:4)**. Toda salida debe medir exactamente eso.
- Acento **ÚNICO**: naranja `#FF6A00`. Prohibido cualquier otro color de acento.
- Negro `#0d0d0d` (slides oscuras) · Crema `#F4F1EA` (slides claras) · Tipografía `Helvetica Neue, Helvetica, Arial, sans-serif` (800 titulares, 500 cuerpo).
- Footer separado del borde inferior (~88px; baseline `y=1352`). No pegar texto a bordes; margen lateral `72px`.
- Motor de imagen: **Gemini-only** (`--provider gemini`). OpenAI queda como flag desactivado (billing).
- Receta de imagen IA: negro + glow **solo naranja** + sujeto en mitad superior + **45% inferior limpio** para texto + **sin texto/letras/logos**.
- Idioma del copy: **español (LatAm)**, tono cercano pero profesional.
- Correr scripts con `node --env-file=.env.local <script>` (las keys viven en `.env.local`).

---

## File Structure

```
scripts/social/
  gen-base.mjs            # (existe) — refactor: exportar genBase(); CLI sigue funcionando
  compose.mjs             # (existe) — queda como referencia/spike; el cover real vive en templates/
  lib/
    tokens.mjs            # tokens de diseño (colores, fuente, dimensiones, márgenes)
    svg.mjs               # helpers SVG: escapeXml, wrapText, pill, footer, counter, lateralBar, svgDoc
    render.mjs            # helpers sharp: blankCanvas(), compositeSvg()
  templates/
    cover.mjs             # portada oscura (base IA + overlay)
    interior.mjs          # interior crema (cards ✅/❌, pasos)
    prompt-showcase.mjs   # grilla 2x2 de imágenes IA + prompt mono (oscura)
    closing.mjs           # cierre/CTA (oscura)
  render-post.mjs         # recorre una post-spec → PNGs numerados en out/<slug>/
  test/
    render-check.mjs      # arnés: renderiza muestras y asegura 1080×1440
  content/week-1/
    01-claude-propuestas.mjs
    02-mito-reemplazo.mjs
    03-framework-que-automatizar.mjs
    04-tip-auditar-copy.mjs
    05-caso-prospeccion-linkedin.mjs
  out/                    # salida PNG (gitignored)
```

Añadir `scripts/social/out/` a `.gitignore`.

---

### Task 1: Tokens + helpers de render sharp

**Files:**
- Create: `scripts/social/lib/tokens.mjs`
- Create: `scripts/social/lib/render.mjs`
- Modify: `.gitignore`
- Test: `scripts/social/test/render-check.mjs`

**Interfaces:**
- Produces: `tokens.mjs` exporta `W=1080, H=1440, MARGIN=72, FOOTER_Y=1352, FONT, COLORS` (objeto con `ink, cream, orange, white, subOnDark, subOnCream, cardCream, cardCreamAlt, borderCream, good, bad`).
- Produces: `render.mjs` exporta `blankCanvas(hex)` → instancia sharp 1080×1440 del color dado; `compositeSvg(baseSharpOrPath, svgString, outPath)` → escribe PNG 1080×1440 y devuelve `{ width, height, outPath }`.

- [ ] **Step 1: Escribir `lib/tokens.mjs`**

```js
export const W = 1080
export const H = 1440
export const MARGIN = 72
export const FOOTER_Y = 1352
export const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif'
export const COLORS = {
  ink: '#0d0d0d',
  cream: '#F4F1EA',
  orange: '#FF6A00',
  white: '#FFFFFF',
  subOnDark: '#C7C7CC',
  subOnCream: '#5B5B53',
  cardCream: '#FFFFFF',
  cardCreamAlt: '#ECE9E0',
  borderCream: '#E7E3D8',
  good: '#15803D',
  bad: '#B91C1C',
}
```

- [ ] **Step 2: Escribir `lib/render.mjs`**

```js
import sharp from 'sharp'
import { W, H } from './tokens.mjs'

export function blankCanvas(hex) {
  return sharp({ create: { width: W, height: H, channels: 4, background: hex } })
}

export async function compositeSvg(baseSharpOrPath, svgString, outPath) {
  const base = typeof baseSharpOrPath === 'string'
    ? sharp(baseSharpOrPath).resize(W, H, { fit: 'cover', position: 'top' })
    : baseSharpOrPath.resize(W, H, { fit: 'cover', position: 'top' })
  await base.composite([{ input: Buffer.from(svgString), top: 0, left: 0 }]).png().toFile(outPath)
  const meta = await sharp(outPath).metadata()
  return { width: meta.width, height: meta.height, outPath }
}
```

- [ ] **Step 3: Escribir el arnés `test/render-check.mjs`**

```js
// Render mínimo para verificar dimensiones del pipeline base.
import { blankCanvas, compositeSvg } from '../lib/render.mjs'
import { W, H, COLORS, FONT } from '../lib/tokens.mjs'

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text x="72" y="200" font-family="${FONT}" font-size="64" font-weight="800" fill="${COLORS.orange}">Bralto check</text>
</svg>`

const out = process.argv[2] || 'scripts/social/out/_check.png'
const res = await compositeSvg(blankCanvas(COLORS.ink), svg, out)
if (res.width !== 1080 || res.height !== 1440) {
  console.error(`✗ dimensiones ${res.width}x${res.height}, esperaba 1080x1440`)
  process.exit(1)
}
console.log(`✓ ${out} ${res.width}x${res.height}`)
```

- [ ] **Step 4: Añadir `scripts/social/out/` a `.gitignore`**

Añadir esta línea al final de `.gitignore`:

```
scripts/social/out/
```

- [ ] **Step 5: Correr el check y verificar que pasa**

Run: `node scripts/social/test/render-check.mjs`
Expected: `✓ scripts/social/out/_check.png 1080x1440`

- [ ] **Step 6: Revisar visualmente** — abrir/leer `scripts/social/out/_check.png`: fondo negro, texto naranja "Bralto check" arriba a la izquierda.

- [ ] **Step 7: Commit**

```bash
git add scripts/social/lib/tokens.mjs scripts/social/lib/render.mjs scripts/social/test/render-check.mjs .gitignore
git commit -m "feat(social): tokens + helpers de render sharp"
```

---

### Task 2: Helpers SVG compartidos (wrapText, pill, footer, counter, lateralBar)

**Files:**
- Create: `scripts/social/lib/svg.mjs`
- Test: `scripts/social/test/render-check.mjs` (extender con un caso de helpers)

**Interfaces:**
- Consumes: `tokens.mjs` (`FONT, COLORS, W, H, MARGIN, FOOTER_Y`).
- Produces:
  - `escapeXml(s) -> string`
  - `wrapText(text, { fontSize, maxWidth, charRatio=0.54 }) -> string[]` (heurística: ancho ≈ `len*fontSize*charRatio`).
  - `accentTspans(line, accent, color) -> string` (parte la línea y pinta `accent` en `color`).
  - `pill({ x, y, label, variant }) -> string` (`variant: 'dark'|'cream'`).
  - `footer({ variant }) -> string` (lockup `bralto.` izq + `desliza ››` der, baseline `FOOTER_Y`).
  - `counter({ index, total, variant }) -> string` (arriba-der `i/total`).
  - `lateralBar() -> string` (barra naranja vertical, x=`MARGIN-16`, de y≈300 a y≈520).
  - `svgDoc(inner) -> string` (envuelve en `<svg width=1080 height=1440>`).

- [ ] **Step 1: Escribir `lib/svg.mjs`**

```js
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
  return escapeXml(line).split(escapeXml(accent))
    .map((p) => escapeXml(p === '' ? '' : '')) // placeholder removed below
    .join('') // replaced in Step note
}
```

> Nota de implementación para `accentTspans`: la versión correcta (sin el placeholder de arriba) parte por el acento y reinserta el fragmento coloreado:

```js
export function accentTspans(line, accent, color = COLORS.orange) {
  if (!accent || !line.includes(accent)) return escapeXml(line)
  const parts = line.split(accent)
  return parts.map((p, i) =>
    escapeXml(p) + (i < parts.length - 1 ? `<tspan fill="${color}">${escapeXml(accent)}</tspan>` : '')
  ).join('')
}
```

```js
export function pill({ x = MARGIN, y, label, variant = 'dark' }) {
  const w = 28 + label.length * 11.5 + 22
  const bg = variant === 'cream' ? COLORS.ink : 'rgba(255,255,255,0.10)'
  const stroke = variant === 'cream' ? 'none' : 'rgba(255,255,255,0.18)'
  const fg = variant === 'cream' ? COLORS.white : COLORS.white
  return `
    <rect x="${x}" y="${y}" rx="23" ry="23" width="${w}" height="46" fill="${bg}" stroke="${stroke}"/>
    <circle cx="${x + 31}" cy="${y + 23}" r="5.5" fill="${COLORS.orange}"/>
    <text x="${x + 50}" y="${y + 31}" font-family="${FONT}" font-size="20" font-weight="700" letter-spacing="1.4" fill="${fg}">${escapeXml(label.toUpperCase())}</text>`
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
```

- [ ] **Step 2: Extender `test/render-check.mjs`** para incluir helpers (añadir al final antes del `console.log`):

```js
import { svgDoc, pill, footer, counter, lateralBar, wrapText, accentTspans } from '../lib/svg.mjs'
import { FONT as F2, COLORS as C2, MARGIN as M2 } from '../lib/tokens.mjs'
const lines = wrapText('Los 5 errores de IA que frenan tu agencia', { fontSize: 78, maxWidth: 1080 - M2 * 2 })
const headline = lines.map((l, i) =>
  `<text x="${M2 - 4}" y="${940 + i * 88}" font-family="${F2}" font-size="78" font-weight="800" letter-spacing="-2.4" fill="${C2.white}">${accentTspans(l, 'IA')}</text>`
).join('')
const inner = lateralBar() + pill({ y: 806, label: 'errores · IA' }) + headline + counter({ index: 1, total: 7 }) + footer({})
const out2 = process.argv[3] || 'scripts/social/out/_check-helpers.png'
const r2 = await compositeSvg(blankCanvas(C2.ink), svgDoc(inner), out2)
if (r2.width !== 1080 || r2.height !== 1440) { console.error('✗ helpers dims'); process.exit(1) }
console.log(`✓ ${out2} ${r2.width}x${r2.height}`)
```

- [ ] **Step 3: Correr y verificar dimensiones**

Run: `node scripts/social/test/render-check.mjs`
Expected: dos líneas `✓ ... 1080x1440` (la base y `_check-helpers.png`).

- [ ] **Step 4: Revisar visualmente** `scripts/social/out/_check-helpers.png`: barra naranja lateral, pill "ERRORES · IA", titular con "IA" en naranja envuelto en 2 líneas, contador "1/7" arriba-der, footer `bralto.` + `desliza ››` separado del borde. Sin texto pegado a bordes.

- [ ] **Step 5: Commit**

```bash
git add scripts/social/lib/svg.mjs scripts/social/test/render-check.mjs
git commit -m "feat(social): helpers SVG (wrap, pill, footer, counter, barra)"
```

---

### Task 3: Plantilla Cover (oscura + base IA) + refactor de gen-base

**Files:**
- Create: `scripts/social/templates/cover.mjs`
- Modify: `scripts/social/gen-base.mjs` (exportar `genBase()` sin romper el CLI)

**Interfaces:**
- Consumes: `lib/svg.mjs`, `lib/tokens.mjs`, `lib/render.mjs`.
- Produces: `renderCover({ basePath, outPath, pill: label, headline, accent, subtitle, index, total }) -> Promise<{width,height,outPath}>`.
- Produces (gen-base): `genBase({ prompt, provider='gemini', outPath }) -> Promise<string>` (ruta del PNG base). El bloque CLI existente debe seguir funcionando.

- [ ] **Step 1: Refactor `gen-base.mjs`** — extraer la lógica a `genBase()` exportada y dejar el CLI llamándola. Reemplazar el bloque `// ── run ──` final por:

```js
export async function genBase({ prompt, provider = 'gemini', outPath }) {
  const buf = provider === 'openai' ? await genOpenai(prompt) : await genGemini(prompt)
  const { writeFile } = await import('node:fs/promises')
  await writeFile(outPath, buf)
  return outPath
}

// CLI: solo si se ejecuta directamente
import { fileURLToPath } from 'node:url'
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`→ Generando imagen base con ${provider}…`)
  const path = await genBase({ prompt, provider, outPath: out })
  console.log(`✓ Guardada: ${path}`)
}
```

> Nota: `genGemini`/`genOpenai` deben aceptar el `prompt` como argumento (cambiar sus firmas a `genGemini(prompt)` / `genOpenai(prompt)` y usar ese parámetro en vez de la constante global). El CLI ya calcula `prompt`, `provider`, `out`.

- [ ] **Step 2: Verificar que el CLI sigue vivo** (sin gastar API: provider inválido para forzar salida temprana no sirve; usar un prompt trivial real es costo). En su lugar, verificar import:

Run: `node -e "import('./scripts/social/gen-base.mjs').then(m=>console.log(typeof m.genBase))"`
Expected: `function`

- [ ] **Step 3: Escribir `templates/cover.mjs`**

```js
import { compositeSvg } from '../lib/render.mjs'
import { svgDoc, pill, footer, counter, lateralBar, wrapText, accentTspans } from '../lib/svg.mjs'
import { FONT, COLORS, MARGIN, W } from '../lib/tokens.mjs'

export async function renderCover({ basePath, outPath, pill: pillLabel, headline, accent, subtitle, index, total }) {
  const lines = wrapText(headline, { fontSize: 78, maxWidth: W - MARGIN * 2 })
  const top = 1000 - lines.length * 88   // ancla las líneas hacia la zona limpia inferior
  const headlineSvg = lines.map((l, i) =>
    `<text x="${MARGIN - 4}" y="${top + i * 88}" font-family="${FONT}" font-size="78" font-weight="800" letter-spacing="-2.4" fill="${COLORS.white}">${accentTspans(l, accent)}</text>`
  ).join('')
  const subY = top + (lines.length - 1) * 88 + 58
  const sub = subtitle
    ? `<text x="${MARGIN}" y="${subY}" font-family="${FONT}" font-size="31" font-weight="500" fill="${COLORS.subOnDark}">${subtitle}</text>` : ''
  const scrim = `<defs><linearGradient id="sc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.42" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.62"/></linearGradient></defs>
      <rect x="0" y="0" width="1080" height="1440" fill="url(#sc)"/>`
  const inner = scrim + (index ? counter({ index, total }) : '') +
    pill({ y: top - 150, label: pillLabel }) + headlineSvg + sub + footer({})
  return compositeSvg(basePath, svgDoc(inner), outPath)
}
```

- [ ] **Step 4: Test rápido reusando la base ya validada del spike.** Crear `scripts/social/test/cover-sample.mjs`:

```js
import { renderCover } from '../templates/cover.mjs'
const base = process.argv[2] // ruta a una base IA existente (la del spike)
const r = await renderCover({
  basePath: base, outPath: 'scripts/social/out/_cover.png',
  pill: 'errores · IA', headline: 'Los 5 errores de IA que frenan tu agencia',
  accent: 'IA', subtitle: '(y cómo arreglarlos esta semana)', index: 1, total: 7,
})
console.log(r.width === 1080 && r.height === 1440 ? `✓ ${r.outPath}` : '✗ dims')
```

Run: `node scripts/social/test/cover-sample.mjs <ruta-a-base-gemini-del-spike>.png`
Expected: `✓ scripts/social/out/_cover.png`

- [ ] **Step 5: Revisar visualmente** `_cover.png`: debe verse equivalente al híbrido v2 aprobado (titular en zona limpia, "IA" naranja, contador, footer separado del borde).

- [ ] **Step 6: Commit**

```bash
git add scripts/social/templates/cover.mjs scripts/social/gen-base.mjs scripts/social/test/cover-sample.mjs
git commit -m "feat(social): plantilla cover + genBase() reusable"
```

---

### Task 4: Plantilla Interior (crema, cards ✅/❌, pasos)

**Files:**
- Create: `scripts/social/templates/interior.mjs`
- Test: `scripts/social/test/interior-sample.mjs`

**Interfaces:**
- Consumes: `lib/svg.mjs`, `lib/tokens.mjs`, `lib/render.mjs`.
- Produces: `renderInterior({ outPath, pill: label, heading, headingAccent, cards, index, total }) -> Promise<{...}>` donde `cards` es `Array<{ kind:'good'|'bad'|'plain', title, body }>`.

- [ ] **Step 1: Escribir `templates/interior.mjs`**

```js
import { blankCanvas, compositeSvg } from '../lib/render.mjs'
import { svgDoc, pill, footer, counter, escapeXml, wrapText } from '../lib/svg.mjs'
import { FONT, COLORS, MARGIN, W } from '../lib/tokens.mjs'

const CARD_BG = { good: COLORS.cardCream, bad: COLORS.cardCreamAlt, plain: COLORS.cardCream }
const CARD_TITLE = { good: COLORS.good, bad: COLORS.bad, plain: COLORS.ink }

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
    const mark = c.kind === 'good' ? '✅ ' : c.kind === 'bad' ? '❌ ' : ''
    const block = `
      <rect x="${MARGIN}" y="${y}" rx="16" ry="16" width="${W - MARGIN * 2}" height="${cardH}" fill="${CARD_BG[c.kind]}" stroke="${COLORS.borderCream}"/>
      <text x="${MARGIN + 28}" y="${y + 50}" font-family="${FONT}" font-size="30" font-weight="700" fill="${CARD_TITLE[c.kind]}">${escapeXml(mark + c.title)}</text>
      ${bodyLines.map((l, i) => `<text x="${MARGIN + 28}" y="${y + 92 + i * 38}" font-family="${FONT}" font-size="30" font-weight="500" fill="${COLORS.ink}">${escapeXml(l)}</text>`).join('')}`
    y += cardH + 22
    return block
  }).join('')

  const inner = (index ? counter({ index, total, variant: 'cream' }) : '') +
    pill({ y: 200, label: pillLabel, variant: 'cream' }) + headSvg + cardSvg + footer({ variant: 'cream' })
  return compositeSvg(blankCanvas(COLORS.cream), svgDoc(inner), outPath)
}
```

- [ ] **Step 2: Escribir `test/interior-sample.mjs`**

```js
import { renderInterior } from '../templates/interior.mjs'
const r = await renderInterior({
  outPath: 'scripts/social/out/_interior.png', pill: 'error 01',
  heading: 'Automatizar sin proceso', headingAccent: 'sin proceso',
  cards: [
    { kind: 'good', title: 'Haz esto', body: 'Mapea el flujo a mano una semana. Automatiza solo lo que ya funciona.' },
    { kind: 'bad', title: 'No esto', body: 'Conectar 5 herramientas y rezar. Automatizas el caos, no el orden.' },
  ], index: 2, total: 7,
})
console.log(r.width === 1080 && r.height === 1440 ? `✓ ${r.outPath}` : '✗ dims')
```

- [ ] **Step 3: Correr y verificar**

Run: `node scripts/social/test/interior-sample.mjs`
Expected: `✓ scripts/social/out/_interior.png`

- [ ] **Step 4: Revisar visualmente** `_interior.png`: fondo crema, pill negra, heading con "sin proceso" naranja, card blanca ✅ + card gris ❌, ambas legibles, footer crema. Ajustar `charRatio`/posiciones si el texto desborda una card.

- [ ] **Step 5: Commit**

```bash
git add scripts/social/templates/interior.mjs scripts/social/test/interior-sample.mjs
git commit -m "feat(social): plantilla interior crema (cards ✅/❌)"
```

---

### Task 5: Plantillas Prompt-showcase y Closing

**Files:**
- Create: `scripts/social/templates/prompt-showcase.mjs`
- Create: `scripts/social/templates/closing.mjs`
- Test: `scripts/social/test/extras-sample.mjs`

**Interfaces:**
- Consumes: `lib/*`.
- Produces: `renderPromptShowcase({ outPath, gridImagePaths, promptText, pill, index, total })` (`gridImagePaths`: 1–4 rutas; se acomodan en grilla 2×2 sobre fondo negro).
- Produces: `renderClosing({ basePath, outPath, headline, ctaLines, handle, index, total })` (`basePath` opcional; si falta, fondo negro liso con glow naranja sutil).

- [ ] **Step 1: Escribir `templates/prompt-showcase.mjs`**

```js
import sharp from 'sharp'
import { compositeSvg, blankCanvas } from '../lib/render.mjs'
import { svgDoc, pill, footer, counter, escapeXml, wrapText } from '../lib/svg.mjs'
import { FONT, COLORS, MARGIN, W } from '../lib/tokens.mjs'

export async function renderPromptShowcase({ outPath, gridImagePaths = [], promptText, pill: pillLabel, index, total }) {
  // grilla 2x2 en la mitad superior (y 150..760), cada celda 468x300 con gap
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
  const promptLines = wrapText(promptText, { fontSize: 26, maxWidth: W - MARGIN * 2 - 48, charRatio: 0.5 })
  const promptBoxH = 56 + promptLines.length * 34 + 20
  const promptY = 800
  const inner = (index ? counter({ index, total }) : '') + pill({ y: promptY - 64, label: pillLabel }) +
    `<rect x="${MARGIN}" y="${promptY}" width="${W - MARGIN * 2}" height="${promptBoxH}" rx="14" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)"/>
     <text x="${MARGIN + 24}" y="${promptY + 44}" font-family="ui-monospace, Menlo, monospace" font-size="18" font-weight="700" letter-spacing="1" fill="${COLORS.orange}">PROMPT</text>
     ${promptLines.map((l, i) => `<text x="${MARGIN + 24}" y="${promptY + 80 + i * 34}" font-family="ui-monospace, Menlo, monospace" font-size="26" fill="#e4e4e7">${escapeXml(l)}</text>`).join('')}` +
    footer({})
  const baseImg = blankCanvas(COLORS.ink)
  if (tiles.length) baseImg.composite(tiles)
  return compositeSvg(baseImg, svgDoc(inner), outPath)
}
```

- [ ] **Step 2: Escribir `templates/closing.mjs`**

```js
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
```

- [ ] **Step 3: Escribir `test/extras-sample.mjs`** (usa el `_interior.png` y `_cover.png` ya generados como "imágenes" de relleno para la grilla):

```js
import { renderPromptShowcase } from '../templates/prompt-showcase.mjs'
import { renderClosing } from '../templates/closing.mjs'
const fillers = ['scripts/social/out/_cover.png', 'scripts/social/out/_interior.png', 'scripts/social/out/_cover.png', 'scripts/social/out/_interior.png']
const a = await renderPromptShowcase({ outPath: 'scripts/social/out/_prompt.png', gridImagePaths: fillers, promptText: 'Cinematic 3:4 dark hero, glowing orange asterisk, lower 45% empty for text, no text', pill: 'prompt', index: 5, total: 7 })
const b = await renderClosing({ outPath: 'scripts/social/out/_closing.png', headline: '¿Te sirvió esto?', ctaLines: ['Guárdalo para tu próxima automatización', 'Coméntame "IA" y te paso el detalle'], handle: '@bralto', index: 7, total: 7 })
console.log([a, b].every(r => r.width === 1080 && r.height === 1440) ? '✓ extras ok' : '✗ dims')
```

- [ ] **Step 4: Correr y verificar**

Run: `node scripts/social/test/extras-sample.mjs`
Expected: `✓ extras ok`

- [ ] **Step 5: Revisar visualmente** `_prompt.png` (grilla 2×2 con esquinas redondeadas + caja de prompt mono naranja/gris) y `_closing.png` (glow naranja, handle, headline, CTAs con flechas, footer).

- [ ] **Step 6: Commit**

```bash
git add scripts/social/templates/prompt-showcase.mjs scripts/social/templates/closing.mjs scripts/social/test/extras-sample.mjs
git commit -m "feat(social): plantillas prompt-showcase y closing"
```

---

### Task 6: Renderizador de posts (`render-post.mjs`)

**Files:**
- Create: `scripts/social/render-post.mjs`
- Create: `scripts/social/content/_schema.md` (documenta el formato de post-spec)

**Interfaces:**
- Consumes: `genBase` (gen-base), `renderCover`, `renderInterior`, `renderPromptShowcase`, `renderClosing`.
- Produces: CLI `node --env-file=.env.local scripts/social/render-post.mjs scripts/social/content/week-1/01-...mjs`. Lee `export default { slug, pillar, slides[] }`; cada slide: `{ type:'cover'|'interior'|'prompt-showcase'|'closing', ... }`. Para `cover`/`closing` con `aiPrompt`, genera la base IA primero en `out/<slug>/base-NN.png`. Escribe `out/<slug>/NN.png` (01-indexado). Imprime el conteo y la lista de rutas.

- [ ] **Step 1: Escribir `content/_schema.md`** (referencia para escribir posts):

```markdown
# Post spec
export default {
  slug: '01-claude-propuestas',
  pillar: 'herramientas',
  slides: [
    { type:'cover', aiPrompt:'<receta IA con {sujeto}>', pill:'herramientas · IA',
      headline:'...', accent:'10 min', subtitle:'...' },
    { type:'interior', pill:'paso 1', heading:'...', headingAccent:'...', cards:[{kind:'good',title,body},{kind:'bad',title,body}] },
    { type:'prompt-showcase', pill:'prompt', aiPromptForGrid:['<p1>','<p2>','<p3>','<p4>'], promptText:'...' },
    { type:'closing', headline:'...', ctaLines:['...'], handle:'@bralto' },
  ],
}
```
La numeración de slide (1/N) la calcula el renderizador.
```

- [ ] **Step 2: Escribir `render-post.mjs`**

```js
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
```

- [ ] **Step 3: Smoke test sin IA** — crear un spec temporal de solo `interior`+`closing` (sin `aiPrompt`) para no gastar API: `scripts/social/content/_smoke.mjs`:

```js
export default { slug: '_smoke', pillar: 'test', slides: [
  { type: 'interior', pill: 'paso 1', heading: 'Prueba de humo', headingAccent: 'humo', cards: [{ kind: 'good', title: 'Funciona', body: 'El renderizador recorre slides y numera.' }] },
  { type: 'closing', headline: 'Fin del smoke', ctaLines: ['Sigue a Bralto'], handle: '@bralto' },
] }
```

Run: `node scripts/social/render-post.mjs scripts/social/content/_smoke.mjs`
Expected: `✓ _smoke: 2 slides` y `out/_smoke/01.png`, `02.png` a 1080×1440.

- [ ] **Step 4: Revisar visualmente** `out/_smoke/01.png` y `02.png` (numeración 1/2, 2/2 correcta).

- [ ] **Step 5: Commit**

```bash
git add scripts/social/render-post.mjs scripts/social/content/_schema.md
git commit -m "feat(social): renderizador de posts (spec → slides numerados)"
```

---

### Task 7: Copy de la Semana 1 (5 post-specs)

**Files:**
- Create: `scripts/social/content/week-1/01-claude-propuestas.mjs`
- Create: `scripts/social/content/week-1/02-mito-reemplazo.mjs`
- Create: `scripts/social/content/week-1/03-framework-que-automatizar.mjs`
- Create: `scripts/social/content/week-1/04-tip-auditar-copy.mjs`
- Create: `scripts/social/content/week-1/05-caso-prospeccion-linkedin.mjs`

**Interfaces:**
- Consumes: el formato de `content/_schema.md`. No genera nada todavía (solo data).

- [ ] **Step 1: Escribir `01-claude-propuestas.mjs`** (carrusel, Herramientas, ~6 slides)

```js
const AI = (sujeto) => `Cinematic 3:4 vertical hero, near-black studio (#0d0d0d), volumetric haze. ONLY accent color warm orange #FF6A00. ${sujeto} in the UPPER HALF with soft orange rim light. Keep the ENTIRE LOWER 45% clean empty dark negative space for text. NO text, letters, numbers, logos or watermarks. Photorealistic, 35mm, shallow depth of field.`
export default {
  slug: '01-claude-propuestas', pillar: 'herramientas',
  slides: [
    { type: 'cover', aiPrompt: AI('a glowing molten-orange document/paper sheet folding into an abstract spark'),
      pill: 'herramientas · IA', headline: 'Escribe propuestas de agencia con Claude en 10 min', accent: '10 min', subtitle: 'El proceso que uso, paso a paso' },
    { type: 'interior', pill: 'paso 1', heading: 'Dale tu contexto, no una orden', headingAccent: 'contexto',
      cards: [{ kind: 'good', title: 'Haz esto', body: 'Pega tu oferta, precios y 2 propuestas ganadas. Claude aprende tu voz.' }, { kind: 'bad', title: 'No esto', body: '"Hazme una propuesta para un cliente" sin contexto = texto genérico.' }] },
    { type: 'interior', pill: 'paso 2', heading: 'Pide estructura, luego relleno', headingAccent: 'estructura',
      cards: [{ kind: 'good', title: 'Haz esto', body: 'Primero el esqueleto (problema, solución, alcance, precio). Apruebas, y recién ahí redacta.' }, { kind: 'plain', title: 'Por qué', body: 'Corriges el rumbo barato, antes de gastar tokens en prosa.' }] },
    { type: 'interior', pill: 'paso 3', heading: 'Convierte en plantilla reutilizable', headingAccent: 'plantilla',
      cards: [{ kind: 'good', title: 'Haz esto', body: 'Guarda el prompt como Skill/snippet. La próxima propuesta sale en 2 min.' }] },
    { type: 'closing', headline: '¿Lo vas a probar?', ctaLines: ['Guárdalo para tu próxima propuesta', 'Coméntame "PROPUESTA" y te paso mi prompt'], handle: '@bralto' },
  ],
}
```

- [ ] **Step 2: Escribir `02-mito-reemplazo.mjs`** (single, Mito, 1 slide cover)

```js
const AI = (sujeto) => `Cinematic 3:4 vertical hero, near-black studio (#0d0d0d), volumetric haze. ONLY accent color warm orange #FF6A00. ${sujeto} in the UPPER HALF with soft orange rim light. Keep the ENTIRE LOWER 45% clean empty dark negative space for text. NO text, letters, numbers, logos or watermarks. Photorealistic, 35mm, shallow depth of field.`
export default {
  slug: '02-mito-reemplazo', pillar: 'mito',
  slides: [
    { type: 'cover', aiPrompt: AI('a cracked obsidian shield with molten-orange light glowing through the cracks'),
      pill: 'mito · IA', headline: 'La IA no reemplaza a tu agencia', accent: 'no', subtitle: 'Reemplaza a las que no la usan. Tú decides de qué lado estás.' },
  ],
}
```

- [ ] **Step 3: Escribir `03-framework-que-automatizar.mjs`** (carrusel, Framework, ~5 slides)

```js
const AI = (sujeto) => `Cinematic 3:4 vertical hero, near-black studio (#0d0d0d), volumetric haze. ONLY accent color warm orange #FF6A00. ${sujeto} in the UPPER HALF with soft orange rim light. Keep the ENTIRE LOWER 45% clean empty dark negative space for text. NO text, letters, numbers, logos or watermarks. Photorealistic, 35mm, shallow depth of field.`
export default {
  slug: '03-framework-que-automatizar', pillar: 'framework',
  slides: [
    { type: 'cover', aiPrompt: AI('three glowing orange concentric rings / a radar sweep made of light'),
      pill: 'framework', headline: 'Qué automatizar primero en tu agencia', accent: 'primero', subtitle: 'El filtro de 3 preguntas que uso' },
    { type: 'interior', pill: 'pregunta 1', heading: '¿Es repetitivo y con reglas claras?', headingAccent: 'repetitivo',
      cards: [{ kind: 'good', title: 'Sí → candidato', body: 'Onboarding, reportes, respuestas a leads, facturación.' }, { kind: 'bad', title: 'No → espera', body: 'Estrategia creativa, relación con el cliente: ahí la IA asiste, no automatiza.' }] },
    { type: 'interior', pill: 'pregunta 2', heading: '¿Te quita horas cada semana?', headingAccent: 'horas',
      cards: [{ kind: 'plain', title: 'Mide antes', body: 'Si no sabes cuántas horas cuesta, no sabrás si la automatización valió. Cronométralo 1 semana.' }] },
    { type: 'interior', pill: 'pregunta 3', heading: '¿El error sale caro?', headingAccent: 'caro',
      cards: [{ kind: 'good', title: 'Empieza por lo barato-de-equivocarse', body: 'Borradores y clasificación primero. Cobros y contratos, con humano en el loop.' }] },
    { type: 'closing', headline: 'Automatiza lo aburrido, no lo importante', ctaLines: ['Guárdalo antes de tu próxima automatización', 'Coméntame "FILTRO"'], handle: '@bralto' },
  ],
}
```

- [ ] **Step 4: Escribir `04-tip-auditar-copy.mjs`** (single, Tip, 1 cover)

```js
const AI = (sujeto) => `Cinematic 3:4 vertical hero, near-black studio (#0d0d0d), volumetric haze. ONLY accent color warm orange #FF6A00. ${sujeto} in the UPPER HALF with soft orange rim light. Keep the ENTIRE LOWER 45% clean empty dark negative space for text. NO text, letters, numbers, logos or watermarks. Photorealistic, 35mm, shallow depth of field.`
export default {
  slug: '04-tip-auditar-copy', pillar: 'tip',
  slides: [
    { type: 'cover', aiPrompt: AI('a glowing orange magnifying lens hovering over an abstract dark grid'),
      pill: 'tip · prompt', headline: '1 prompt para auditar el copy de cualquier landing', accent: '1 prompt',
      subtitle: 'Pégalo, cambia la URL, y tienes 5 mejoras en 30 segundos' },
  ],
}
```

- [ ] **Step 5: Escribir `05-caso-prospeccion-linkedin.mjs`** (carrusel, Caso, ~5 slides)

```js
const AI = (sujeto) => `Cinematic 3:4 vertical hero, near-black studio (#0d0d0d), volumetric haze. ONLY accent color warm orange #FF6A00. ${sujeto} in the UPPER HALF with soft orange rim light. Keep the ENTIRE LOWER 45% clean empty dark negative space for text. NO text, letters, numbers, logos or watermarks. Photorealistic, 35mm, shallow depth of field.`
export default {
  slug: '05-caso-prospeccion-linkedin', pillar: 'caso',
  slides: [
    { type: 'cover', aiPrompt: AI('a glowing orange network of connected nodes forming a funnel shape'),
      pill: 'caso · resultado', headline: 'Un agente que agenda reuniones en LinkedIn solo', accent: 'solo', subtitle: 'Lo que montamos y qué logró' },
    { type: 'interior', pill: 'el problema', heading: 'Prospectar a mano no escala', headingAccent: 'no escala',
      cards: [{ kind: 'plain', title: 'Antes', body: 'Horas buscando perfiles, escribiendo DMs uno por uno, sin seguimiento.' }] },
    { type: 'interior', pill: 'la solución', heading: 'Pipeline IA de 3 pasos', headingAccent: '3 pasos',
      cards: [{ kind: 'good', title: 'Qué hace', body: 'Filtra perfiles del nicho, redacta mensajes personalizados y agenda en el calendario.' }, { kind: 'plain', title: 'Con control', body: 'Tú apruebas el mensaje base; el agente ejecuta y hace el seguimiento.' }] },
    { type: 'interior', pill: 'resultado', heading: 'Reuniones en automático', headingAccent: 'automático',
      cards: [{ kind: 'good', title: 'El cambio', body: 'De prospección manual a un flujo que corre solo y deja al equipo cerrar, no buscar.' }] },
    { type: 'closing', headline: '¿Quieres algo así en tu agencia?', ctaLines: ['Coméntame "AGENTE" y te cuento cómo', 'Sigue a Bralto para más casos'], handle: '@bralto' },
  ],
}
```

- [ ] **Step 6: Validar que los specs cargan** (sin renderizar/gastar API):

Run: `for f in scripts/social/content/week-1/*.mjs; do node -e "import('./$f').then(m=>console.log('✓', m.default.slug, m.default.slides.length+' slides'))"; done`
Expected: 5 líneas `✓ <slug> N slides`.

- [ ] **Step 7: Commit**

```bash
git add scripts/social/content/week-1/
git commit -m "content(social): copy de la Semana 1 (5 posts)"
```

---

### Task 8: Producir y revisar Post 1 (carrusel) — establece el patrón

**Files:**
- Genera: `scripts/social/out/01-claude-propuestas/*.png` (gitignored)

**Interfaces:**
- Consumes: `render-post.mjs`, `content/week-1/01-claude-propuestas.mjs`.

- [ ] **Step 1: Renderizar el post completo** (esto SÍ llama a Nano Banana Pro para la portada)

Run: `node --env-file=.env.local scripts/social/render-post.mjs scripts/social/content/week-1/01-claude-propuestas.mjs`
Expected: `✓ 01-claude-propuestas: 5 slides` y 5 PNGs en `out/01-claude-propuestas/`.

- [ ] **Step 2: Verificar dimensiones de todas las slides**

Run: `node -e "const s=require('sharp');const fs=require('fs');const d='scripts/social/out/01-claude-propuestas';for(const f of fs.readdirSync(d).filter(x=>/^\d\d\.png$/.test(x))){s(d+'/'+f).metadata().then(m=>console.log(f,m.width+'x'+m.height))}"`
Expected: cada `NN.png` = `1080x1440`.

- [ ] **Step 3: Revisar visualmente el carrusel completo** — leer las 5 PNG en orden. Checklist:
  - Portada: titular legible en zona limpia, "10 min" en naranja, base IA con espacio negativo correcto.
  - Interiores: cards no desbordadas, ✅/❌ correctos, contador `2/5`…`4/5`.
  - Cierre: CTA claro, handle, footer separado del borde.
  - Coherencia: acento SOLO naranja en todas; tipografía consistente.

- [ ] **Step 4: Ajustar si hace falta** — si una card desborda o el titular queda apretado, ajustar el copy del spec o los `charRatio`/posiciones en la plantilla afectada, y re-renderizar solo lo necesario. Repetir Step 3 hasta que quede fino.

- [ ] **Step 5: Commit** (de ajustes de plantilla/copy, si los hubo)

```bash
git add scripts/social/templates scripts/social/lib scripts/social/content/week-1/01-claude-propuestas.mjs
git commit -m "fix(social): ajustes de plantilla tras revisar Post 1"
```

---

### Task 9: Producir y revisar Posts 2–5 de la Semana 1

**Files:**
- Genera: `scripts/social/out/0{2..5}-*/*.png` (gitignored)

**Interfaces:**
- Consumes: `render-post.mjs` + los 4 specs restantes.

- [ ] **Step 1: Renderizar los 4 posts restantes**

Run:
```bash
for f in 02-mito-reemplazo 03-framework-que-automatizar 04-tip-auditar-copy 05-caso-prospeccion-linkedin; do
  node --env-file=.env.local scripts/social/render-post.mjs scripts/social/content/week-1/$f.mjs
done
```
Expected: 4 líneas `✓ <slug>: N slides`.

- [ ] **Step 2: Verificar dimensiones de todo** (singles y carruseles)

Run: `node -e "const s=require('sharp');const fs=require('fs');const base='scripts/social/out';for(const d of fs.readdirSync(base).filter(x=>/^0[2-5]-/.test(x))){for(const f of fs.readdirSync(base+'/'+d).filter(x=>/^\d\d\.png$/.test(x))){s(base+'/'+d+'/'+f).metadata().then(m=>{if(m.width!==1080||m.height!==1440)console.error('✗',d,f,m.width+'x'+m.height)})}}console.log('check lanzado')"`
Expected: ningún `✗`.

- [ ] **Step 3: Revisar visualmente cada post** (2 singles + 2 carruseles) con el mismo checklist del Task 8. Ajustar copy/plantilla y re-renderizar lo necesario.

- [ ] **Step 4: Generar contact-sheet de la Semana 1** para revisión global — crear `scripts/social/test/contact-sheet.mjs`:

```js
import sharp from 'sharp'
import { readdirSync } from 'node:fs'
const base = 'scripts/social/out'
const dirs = readdirSync(base).filter((d) => /^0[1-5]-/.test(d)).sort()
const thumbs = []
let x = 0, y = 0, rowH = 0, maxW = 0
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
```

Run: `node scripts/social/test/contact-sheet.mjs`
Expected: `✓ contact sheet: N slides` y `out/_week1-contact-sheet.png`.

- [ ] **Step 5: Revisar el contact-sheet** — leer `_week1-contact-sheet.png`: ¿se ve como un feed coherente? ¿el ritmo dark→crema funciona? ¿algún post desentona? Anotar ajustes finales.

- [ ] **Step 6: Presentar la Semana 1 a Ale** para aprobación antes del lote de Semanas 2–4. (Checkpoint humano: NO seguir al lote sin OK.)

- [ ] **Step 7: Commit** (ajustes finales + el script de contact-sheet)

```bash
git add scripts/social/test/contact-sheet.mjs scripts/social/templates scripts/social/content/week-1
git commit -m "content(social): Semana 1 producida + contact sheet"
```

---

## Self-Review

**1. Spec coverage:**
- Tokens/línea gráfica §3.1 → Task 1. ✓
- Taxonomía de slides §3.2 (cover/interior/prompt-showcase/closing) → Tasks 3,4,5. ✓
- Elementos de marca §3.3 (barra lateral, contador, lockup, swipe, pill) → Task 2. ✓
- Refinamientos §3.4 (footer separado, contador, barra) → Tasks 2,3. ✓
- Pipeline §4 (gen-base Gemini-only + compose) → Tasks 3,6. ✓
- Plan de contenido §5 / Semana 1 → Tasks 7,8,9. ✓
- Enfoque ejecución §6 (validar S1 → checkpoint antes del lote) → Task 9 Step 6. ✓
- Distribución §4.4 → **fuera de alcance** (sub-proyecto aparte, explícito). ✓
- Componentes §7 → cubiertos salvo `lib/ghl/social.ts` (futuro). ✓

**2. Placeholder scan:** Sin "TBD/TODO". El `accentTspans` tiene una primera versión con placeholder a propósito INMEDIATAMENTE corregida por la versión buena en la nota siguiente; el ejecutor debe usar la segunda. (Aclarado en el step.) Resto: código completo.

**3. Type consistency:** `genBase({prompt,provider,outPath})` usado igual en Tasks 3 y 6. `renderCover/Interior/PromptShowcase/Closing` firmas idénticas entre su definición (3,4,5) y su uso en `render-post.mjs` (6). `compositeSvg(base, svg, out)` y `blankCanvas(hex)` consistentes. `wrapText({fontSize,maxWidth,charRatio})` consistente. ✓

**Corrección aplicada:** en Task 2 dejar explícito que la versión válida de `accentTspans` es la segunda (la de la nota), y borrar la primera al implementar.

---

## Notas de costo (Nano Banana Pro)

Semana 1 genera imágenes IA solo para: portadas (5) + grids de prompt-showcase (0 en S1, ningún post de S1 usa ese tipo) = **~5 llamadas IA**. El resto son crema/closing por código. Barato de validar.
