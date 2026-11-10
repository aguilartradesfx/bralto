import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analizarConGemini, MAX_VIDEO } from './gemini.ts'
import type { ContextoIdea } from './analisis.ts'

const contexto: Omit<ContextoIdea, 'soloImagen'> = {
  red: 'tiktok',
  tipo: 'video',
  texto: 'texto',
  vistas: 1000,
  vecesSuPublico: 2,
  vecesLoNormal: 3,
  compartidos: 4,
  guardados: 5,
}

const respuesta = {
  tema: 'Tema',
  formato: 'a_camara',
  gancho: { texto: 'g', por_que: 'p' },
  partes: ['a'],
  por_que_pego: ['r'],
  por_que_guardan: 'x',
  herramientas: [],
  de_tu_tema: 8,
  tu_version: { titulo: 'T', idea: 'I', ganchos: ['1', '2', '3'], guion: ['a', 'b'], comenta: 'IA' },
}

const gemini = (json: unknown) =>
  Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'pensando', thought: true }, { text: JSON.stringify(json) }] } }] })

type Llamada = { url: string; headers: Headers; body?: string }

test('baja el video de Apify con la clave y se lo manda a Gemini', async () => {
  const llamadas: Llamada[] = []
  const fetchFn = (async (url: string, init?: RequestInit) => {
    llamadas.push({ url, headers: new Headers(init?.headers), body: init?.body ? String(init.body) : undefined })
    if (url.includes('apify.com')) return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'video/mp4' } })
    return gemini(respuesta)
  }) as typeof fetch
  const r = await analizarConGemini(
    { video: 'https://api.apify.com/v2/key-value-stores/a/records/v.mp4', videoConClave: true, imagenes: ['https://portada.jpg'] },
    contexto,
    { apiKey: 'gem', apifyToken: 'apf', fetchFn, sleep: async () => {} },
  )
  assert.equal(llamadas[0].headers.get('authorization'), 'Bearer apf')
  assert.match(llamadas[1].url, /generativelanguage\.googleapis\.com/)
  assert.equal(llamadas[1].headers.get('x-goog-api-key'), 'gem')
  const cuerpo = JSON.parse(llamadas[1].body ?? '{}')
  assert.equal(cuerpo.contents[0].parts[0].inlineData.mimeType, 'video/mp4')
  assert.equal(r.soloImagen, false)
  assert.equal(r.analisis.tu_version.titulo, 'T')
})

test('un video demasiado grande no se manda: Gemini ve la portada y el prompt lo dice', async () => {
  let prompt = ''
  const fetchFn = (async (url: string, init?: RequestInit) => {
    if (url.endsWith('.mp4')) return new Response('x', { headers: { 'content-length': String(MAX_VIDEO + 1) } })
    if (url.endsWith('.jpg')) return new Response(new Uint8Array([9]))
    const cuerpo = JSON.parse(String(init?.body))
    prompt = cuerpo.contents[0].parts.at(-1).text
    assert.equal(cuerpo.contents[0].parts[0].inlineData.mimeType, 'image/jpeg')
    return gemini(respuesta)
  }) as typeof fetch
  const r = await analizarConGemini({ video: 'https://cdn/v.mp4', videoConClave: false, imagenes: ['https://cdn/p.jpg'] }, contexto, {
    apiKey: 'gem',
    apifyToken: 'apf',
    fetchFn,
    sleep: async () => {},
  })
  assert.equal(r.soloImagen, true)
  assert.match(prompt, /solo la portada/i)
})

test('si Gemini está saturado reintenta, y al tercer error se rinde con un mensaje claro', async () => {
  let intentos = 0
  const fetchFn = (async (url: string) => {
    if (url.endsWith('.jpg')) return new Response(new Uint8Array([9]))
    intentos++
    return new Response('{}', { status: 503 })
  }) as unknown as typeof fetch
  await assert.rejects(
    analizarConGemini({ video: null, videoConClave: false, imagenes: ['https://cdn/p.jpg'] }, { ...contexto, tipo: 'fotos' }, { apiKey: 'g', apifyToken: 'a', fetchFn, sleep: async () => {} }),
    /Gemini no respondió/,
  )
  assert.equal(intentos, 3)
})

test('sin ningún medio no le pide nada a Gemini (inventaría el tema)', async () => {
  const fetchFn = (async () => new Response('nada', { status: 404 })) as unknown as typeof fetch
  await assert.rejects(
    analizarConGemini({ video: 'https://cdn/v.mp4', videoConClave: false, imagenes: ['https://cdn/p.jpg'] }, contexto, { apiKey: 'g', apifyToken: 'a', fetchFn, sleep: async () => {} }),
    /No se pudo bajar el video/,
  )
})
