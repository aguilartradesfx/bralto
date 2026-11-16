// Gemini genera la foto de grupo a partir de los retratos. Cuesta plata: solo lo llama fotos-servidor.ts después del tope.
export const MODELO_FOTO = 'gemini-nano-banana-2.1'

type Parte = { text?: string, thought?: boolean, inlineData?: { mimeType?: string, data?: string } }

export async function generarImagen(o: {
  prompt: string, refs: Uint8Array[], apiKey: string, aspecto?: string, fetchFn?: typeof fetch,
}): Promise<{ imagen: Uint8Array, tokens: number | null }> {
  const f = o.fetchFn ?? fetch
  const partes = [
    { text: o.prompt },
    ...o.refs.map(r => ({ inlineData: { mimeType: 'image/jpeg', data: Buffer.from(r).toString('base64') } })),
  ]
  const res = await f(`https://generativelanguage.googleapis.com/v1beta/models/${MODELO_FOTO}:generateContent`, {
    method: 'POST',
    signal: AbortSignal.timeout(3 * 60_000),
    headers: { 'content-type': 'application/json', 'x-goog-api-key': o.apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: partes }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: o.aspecto ?? '4:3', imageSize: '1K' },
      },
    }),
  })
  if (!res.ok) throw new Error(`Gemini respondió ${res.status}`)
  const json = await res.json() as { candidates?: { content?: { parts?: Parte[] } }[], usageMetadata?: { candidatesTokenCount?: number } }
  const imagenes = (json.candidates?.[0]?.content?.parts ?? []).filter(p => p.inlineData?.data && !p.thought)
  const ultima = imagenes[imagenes.length - 1]
  if (!ultima?.inlineData?.data) throw new Error('Gemini no devolvió imagen')
  return { imagen: new Uint8Array(Buffer.from(ultima.inlineData.data, 'base64')), tokens: json.usageMetadata?.candidatesTokenCount ?? null }
}
