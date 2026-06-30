import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { W, H } from './tokens.mjs'

export function blankCanvas(hex) {
  return sharp({ create: { width: W, height: H, channels: 4, background: hex } })
}

export async function compositeSvg(baseSharpOrPath, svgString, outPath) {
  await mkdir(dirname(outPath), { recursive: true })
  const base = typeof baseSharpOrPath === 'string'
    ? sharp(baseSharpOrPath).resize(W, H, { fit: 'cover', position: 'top' })
    : baseSharpOrPath.resize(W, H, { fit: 'cover', position: 'top' })
  await base.composite([{ input: Buffer.from(svgString), top: 0, left: 0 }]).png().toFile(outPath)
  const meta = await sharp(outPath).metadata()
  return { width: meta.width, height: meta.height, outPath }
}
