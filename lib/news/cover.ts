import { readFile } from 'node:fs/promises'
import path from 'node:path'
import satori from 'satori'
import sharp from 'sharp'

// Portada de cada nota: la imagen de Nano Banana recortada a 1600×900, con la firma
// dibujada por código (nunca por el modelo) en Sora, la fuente del sitio.
export const COVER = { width: 1600, height: 900 }
export const SIGNATURE = 'Alejandro Aguilar · CEO Bralto'

// La fuente viaja con la función de Vercel (outputFileTracingIncludes en next.config.ts)
let font: Promise<Buffer> | undefined
const loadFont = () => (font ??= readFile(path.join(process.cwd(), 'lib/news/fonts/sora-500.woff')))

// satori devuelve un SVG con el texto ya convertido en trazos: no depende de las fuentes del servidor
async function signatureSvg(): Promise<string> {
  const { width, height } = COVER
  const element = {
    type: 'div',
    key: null,
    props: {
      style: {
        width,
        height,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        padding: '0 48px 40px 0',
        // Un velo oscuro solo en la esquina, para que la firma se lea sobre cualquier imagen
        backgroundImage: 'radial-gradient(ellipse 620px 260px at 100% 100%, rgba(0,0,0,0.55), rgba(0,0,0,0))',
      },
      children: {
        type: 'div',
        key: null,
        props: {
          style: { fontFamily: 'Sora', fontSize: 24, letterSpacing: 0.2, color: 'rgba(255,255,255,0.92)' },
          children: SIGNATURE,
        },
      },
    },
  }
  return satori(element as Parameters<typeof satori>[0], {
    width,
    height,
    fonts: [{ name: 'Sora', data: await loadFont(), weight: 500, style: 'normal' }],
  })
}

export async function composeCover(input: Buffer): Promise<Buffer> {
  const { width, height } = COVER
  const overlay = Buffer.from(await signatureSvg())
  return sharp(input)
    .resize(width, height, { fit: 'cover', position: 'attention' })
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer()
}
