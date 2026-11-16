import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generarImagen, MODELO_FOTO } from './gemini-foto.ts'

const b64 = (n: number) => Buffer.from([n]).toString('base64')

function falso(parts: unknown[], status = 200) {
  const vistas: { url: string, init: RequestInit }[] = []
  const fetchFn = (async (url: string, init: RequestInit) => {
    vistas.push({ url, init })
    return { ok: status === 200, status, json: async () => ({ candidates: [{ content: { parts } }], usageMetadata: { candidatesTokenCount: 1290 } }) }
  }) as unknown as typeof fetch
  return { fetchFn, vistas }
}

test('el cuerpo lleva 1K y una parte inlineData por referencia', async () => {
  const { fetchFn, vistas } = falso([{ inlineData: { mimeType: 'image/png', data: b64(7) } }])
  const r = await generarImagen({ prompt: 'hola', refs: [new Uint8Array([1]), new Uint8Array([2])], apiKey: 'K', fetchFn })
  const cuerpo = JSON.parse(String(vistas[0].init.body))
  assert.ok(vistas[0].url.includes(`models/${MODELO_FOTO}:generateContent`))
  assert.equal((vistas[0].init.headers as Record<string, string>)['x-goog-api-key'], 'K')
  assert.ok(vistas[0].init.signal instanceof AbortSignal)
  assert.equal(cuerpo.generationConfig.imageConfig.imageSize, '1K')
  assert.equal(cuerpo.generationConfig.imageConfig.aspectRatio, '4:3')
  assert.deepEqual(cuerpo.generationConfig.responseModalities, ['TEXT', 'IMAGE'])
  const partes = cuerpo.contents[0].parts
  assert.equal(partes[0].text, 'hola')
  assert.equal(partes.filter((p: { inlineData?: { mimeType: string } }) => p.inlineData?.mimeType === 'image/jpeg').length, 2)
  assert.deepEqual([...r.imagen], [7])
  assert.equal(r.tokens, 1290)
})

test('se queda con la última imagen que no es thought', async () => {
  const { fetchFn } = falso([
    { inlineData: { data: b64(1) } },
    { inlineData: { data: b64(2) } },
    { thought: true, inlineData: { data: b64(3) } },
  ])
  const r = await generarImagen({ prompt: 'p', refs: [], apiKey: 'K', fetchFn })
  assert.deepEqual([...r.imagen], [2])
})

test('sin imagen lanza', async () => {
  const { fetchFn } = falso([{ text: 'no puedo' }])
  await assert.rejects(generarImagen({ prompt: 'p', refs: [], apiKey: 'K', fetchFn }), /Gemini no devolvió imagen/)
})

test('un error HTTP lanza con su código', async () => {
  const { fetchFn } = falso([], 429)
  await assert.rejects(generarImagen({ prompt: 'p', refs: [], apiKey: 'K', fetchFn }), /429/)
})
