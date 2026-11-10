import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buscarNumeros } from './apify.ts'

type Pedido = { url: string; body: Record<string, unknown>; auth: string | null }

function falso(respuestas: unknown[]) {
  const pedidos: Pedido[] = []
  const fetchFn = (async (url: string, init?: RequestInit) => {
    pedidos.push({ url, body: JSON.parse(String(init?.body)), auth: new Headers(init?.headers).get('authorization') })
    return Response.json(respuestas.shift())
  }) as typeof fetch
  return { pedidos, fetchFn }
}

test('Instagram: primero el post y después el perfil de su cuenta (seguidores y lo normal)', async () => {
  const { pedidos, fetchFn } = falso([
    [{ type: 'Video', shortCode: 'AAA111', ownerUsername: 'una.cuenta', videoPlayCount: 1000, likesCount: 50, commentsCount: 3, videoUrl: 'https://v.mp4' }],
    [{ username: 'una.cuenta', followersCount: 100, latestPosts: [] }],
  ])
  const r = await buscarNumeros({ url: 'https://www.instagram.com/p/AAA111/', red: 'instagram' }, { token: 'clave', fetchFn })
  assert.equal(pedidos.length, 2)
  assert.match(pedidos[0].url, /apify~instagram-scraper\/run-sync-get-dataset-items/)
  assert.deepEqual(pedidos[0].body, { directUrls: ['https://www.instagram.com/p/AAA111/'], resultsType: 'posts', resultsLimit: 1 })
  assert.deepEqual(pedidos[1].body, { directUrls: ['https://www.instagram.com/una.cuenta/'], resultsType: 'details', resultsLimit: 1 })
  assert.equal(pedidos[0].auth, 'Bearer clave')
  assert.equal(r.metricas.vistas, 1000)
  assert.equal(r.metricas.seguidores, 100)
})

test('Instagram: si el perfil falla, igual quedan los números del post', async () => {
  const pedidos: string[] = []
  const fetchFn = (async (url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body))
    pedidos.push(body.resultsType)
    if (body.resultsType === 'details') return new Response('{"error":{"message":"x"}}', { status: 500 })
    return Response.json([{ type: 'Video', shortCode: 'AAA111', ownerUsername: 'una.cuenta', videoPlayCount: 1000, likesCount: 50 }])
  }) as typeof fetch
  const r = await buscarNumeros({ url: 'https://www.instagram.com/p/AAA111/', red: 'instagram' }, { token: 'clave', fetchFn })
  assert.deepEqual(pedidos, ['posts', 'details'])
  assert.equal(r.metricas.vistas, 1000)
  assert.equal(r.metricas.seguidores, null)
})

test('TikTok: una sola corrida con el video bajado', async () => {
  const { pedidos, fetchFn } = falso([[{ playCount: 10, diggCount: 2, authorMeta: { name: 'x', fans: 5 }, mediaUrls: ['https://api.apify.com/v.mp4'] }]])
  const r = await buscarNumeros({ url: 'https://www.tiktok.com/@x/video/123', red: 'tiktok' }, { token: 'clave', fetchFn })
  assert.equal(pedidos.length, 1)
  assert.match(pedidos[0].url, /clockworks~tiktok-scraper\/run-sync-get-dataset-items/)
  assert.deepEqual(pedidos[0].body, {
    postURLs: ['https://www.tiktok.com/@x/video/123'],
    shouldDownloadVideos: true,
    shouldDownloadCovers: false,
    shouldDownloadSubtitles: false,
  })
  assert.equal(r.medios.video, 'https://api.apify.com/v.mp4')
})

test('si Apify contesta con error, el mensaje lo dice', async () => {
  const fetchFn = (async () => new Response('{"error":{"type":"not-enough-usage","message":"Sin saldo"}}', { status: 402 })) as unknown as typeof fetch
  await assert.rejects(buscarNumeros({ url: 'https://www.tiktok.com/@x/video/123', red: 'tiktok' }, { token: 'clave', fetchFn }), /Apify.*Sin saldo/)
})
