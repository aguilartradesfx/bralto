// Compone el texto de marca (titular, pill, logo, swipe) sobre una imagen base
// generada por IA, usando sharp + un overlay SVG. Sin navegador.
// Spike: copy fijo (post "5 errores de IA"). Salida 1080x1440 (3:4).
//
// Uso: node scripts/social/compose.mjs --base base.png --out final.png

import sharp from 'sharp'

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]])
    return acc
  }, []),
)
const base = args.base
const out = args.out || 'final.png'
const W = 1080
const H = 1440
const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif'

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.42" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.62"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#scrim)"/>

  <!-- pill -->
  <rect x="72" y="806" rx="23" ry="23" width="250" height="46" fill="#FFFFFF" fill-opacity="0.10" stroke="#FFFFFF" stroke-opacity="0.18"/>
  <circle cx="103" cy="829" r="5.5" fill="#FF6A00"/>
  <text x="122" y="837" font-family="${FONT}" font-size="20" font-weight="700" letter-spacing="1.6" fill="#FFFFFF">ERRORES · IA</text>

  <!-- headline -->
  <text x="68" y="952" font-family="${FONT}" font-size="78" font-weight="800" letter-spacing="-2.4" fill="#FFFFFF">Los 5 errores de <tspan fill="#FF6A00">IA</tspan></text>
  <text x="68" y="1040" font-family="${FONT}" font-size="78" font-weight="800" letter-spacing="-2.4" fill="#FFFFFF">que frenan tu agencia</text>

  <!-- subtitle -->
  <text x="72" y="1100" font-family="${FONT}" font-size="31" font-weight="500" fill="#C7C7CC">(y cómo arreglarlos esta semana)</text>

  <!-- footer (separado del borde inferior: ~88px de margen) -->
  <text x="72" y="1352" font-family="${FONT}" font-size="32" font-weight="800" letter-spacing="-0.5" fill="#FFFFFF">bralto<tspan fill="#FF6A00">.</tspan></text>
  <text x="1008" y="1352" text-anchor="end" font-family="${FONT}" font-size="27" font-weight="700" fill="#FF6A00">desliza ››</text>
</svg>`

const meta = await sharp(base).metadata()
console.log(`base: ${meta.width}x${meta.height}`)

await sharp(base)
  .resize(W, H, { fit: 'cover', position: 'top' })
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .png()
  .toFile(out)

console.log(`✓ Final: ${out}`)
