import { test } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { composeCover } from './cover.ts'

const gray = (width: number, height: number, format: 'png' | 'jpeg') =>
  sharp({ create: { width, height, channels: 3, background: { r: 60, g: 60, b: 60 } } })[format]().toBuffer()

const brightest = async (img: Buffer, left: number, top: number, width: number, height: number) => {
  // stats() mide la imagen de entrada: el recorte va a un buffer aparte
  const region = await sharp(img).extract({ left, top, width, height }).toBuffer()
  const { channels } = await sharp(region).stats()
  return Math.max(...channels.map((c) => c.max))
}

test('la portada sale en JPEG de 1600×900, también desde un PNG de 1376×768', async () => {
  for (const input of [await gray(2752, 1536, 'jpeg'), await gray(1376, 768, 'png')]) {
    const out = await composeCover(input)
    const meta = await sharp(out).metadata()
    assert.equal(meta.format, 'jpeg')
    assert.equal(meta.width, 1600)
    assert.equal(meta.height, 900)
  }
})

test('la firma va abajo a la derecha y no toca el resto', async () => {
  const out = await composeCover(await gray(1600, 900, 'jpeg'))
  assert.ok((await brightest(out, 1000, 800, 600, 100)) > 180, 'hay texto claro abajo a la derecha')
  assert.ok((await brightest(out, 0, 0, 600, 300)) < 90, 'arriba a la izquierda sigue gris')
})
