import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ApifyRespuestaError, formatoNumero, formatoVeces, leerInstagram, leerTiktok, mediana } from './metricas.ts'

// Lo que devuelve apify/instagram-scraper (resultsType posts) para un reel, recortado
const reelIg = {
  inputUrl: 'https://www.instagram.com/p/AAA111/',
  type: 'Video',
  shortCode: 'AAA111',
  caption: 'Texto del reel #ia',
  url: 'https://www.instagram.com/p/AAA111/',
  commentsCount: 8181,
  displayUrl: 'https://scontent.cdninstagram.com/portada.jpg',
  images: [],
  videoUrl: 'https://scontent.cdninstagram.com/video.mp4',
  likesCount: 6835,
  videoViewCount: null,
  videoPlayCount: 392649,
  timestamp: '2026-11-06T00:21:49.000Z',
  ownerUsername: 'una.cuenta',
  videoDuration: 42.880001,
}

// resultsType details del perfil: seguidores y los últimos posts (sin vistas, solo me gusta)
const perfilIg = {
  username: 'una.cuenta',
  followersCount: 15067,
  latestPosts: [
    { shortCode: 'X1', likesCount: 100, isPinned: false },
    { shortCode: 'X2', likesCount: 300, isPinned: false },
    { shortCode: 'X3', likesCount: 200, isPinned: false },
    { shortCode: 'FIJO', likesCount: 90000, isPinned: true },
    { shortCode: 'AAA111', likesCount: 6835, isPinned: false },
  ],
}

test('un reel de Instagram: vistas de reproducciones, sin compartidos ni guardados (Instagram no los muestra)', () => {
  const { metricas, medios } = leerInstagram([reelIg], [perfilIg])
  assert.equal(metricas.cuenta, 'una.cuenta')
  assert.equal(metricas.tipo, 'video')
  assert.equal(metricas.vistas, 392649)
  assert.equal(metricas.me_gusta, 6835)
  assert.equal(metricas.comentarios, 8181)
  assert.equal(metricas.compartidos, null)
  assert.equal(metricas.guardados, null)
  assert.equal(metricas.seguidores, 15067)
  assert.equal(metricas.publicado_en, '2026-11-06T00:21:49.000Z')
  assert.equal(metricas.duracion_s, 43)
  assert.equal(metricas.texto, 'Texto del reel #ia')
  assert.deepEqual(medios, { video: 'https://scontent.cdninstagram.com/video.mp4', videoConClave: false, imagenes: ['https://scontent.cdninstagram.com/portada.jpg'] })
})

test('lo normal de la cuenta es la mediana de me gusta de sus últimos posts, sin los fijados ni este mismo', () => {
  const { metricas } = leerInstagram([reelIg], [perfilIg])
  assert.equal(metricas.normal_me_gusta, 200)
  assert.equal(metricas.veces_lo_normal, 34.2)
  assert.equal(metricas.veces_su_publico, 26.1)
})

test('sin perfil (o con menos de 3 posts) no inventa lo normal ni los seguidores', () => {
  const sinPerfil = leerInstagram([reelIg], []).metricas
  assert.equal(sinPerfil.seguidores, null)
  assert.equal(sinPerfil.normal_me_gusta, null)
  assert.equal(sinPerfil.veces_lo_normal, null)
  assert.equal(sinPerfil.veces_su_publico, null)
  const pocos = leerInstagram([reelIg], [{ ...perfilIg, latestPosts: perfilIg.latestPosts.slice(0, 2) }]).metricas
  assert.equal(pocos.normal_me_gusta, null)
  assert.equal(pocos.seguidores, 15067)
})

test('un carrusel de Instagram usa sus láminas y no tiene vistas', () => {
  const carrusel = { ...reelIg, type: 'Sidecar', videoUrl: undefined, videoPlayCount: undefined, videoDuration: undefined, images: ['https://a/1.jpg', 'https://a/2.jpg'] }
  const { metricas, medios } = leerInstagram([carrusel], [perfilIg])
  assert.equal(metricas.tipo, 'fotos')
  assert.equal(metricas.vistas, null)
  assert.equal(metricas.veces_su_publico, null)
  assert.equal(metricas.duracion_s, null)
  assert.deepEqual(medios, { video: null, videoConClave: false, imagenes: ['https://a/1.jpg', 'https://a/2.jpg'] })
})

test('me gusta ocultos quedan sin número, no en cero', () => {
  const { metricas } = leerInstagram([{ ...reelIg, likesCount: -1 }], [perfilIg])
  assert.equal(metricas.me_gusta, null)
  assert.equal(metricas.veces_lo_normal, null)
})

test('si Apify no encontró el post, el error dice por qué', () => {
  assert.throws(() => leerInstagram([{ url: 'https://www.instagram.com/p/NADA/', error: 'not_found', errorDescription: 'Post does not exist' }], []), (e: unknown) => {
    assert.ok(e instanceof ApifyRespuestaError)
    assert.match(e.message, /no encontró/)
    return true
  })
  assert.throws(() => leerInstagram([], []), ApifyRespuestaError)
  assert.throws(() => leerInstagram(null, []), ApifyRespuestaError)
})

// Lo que devuelve clockworks/tiktok-scraper (postURLs, con el video bajado), recortado
const videoTt = {
  id: '7704834703446117662',
  text: 'Texto del video',
  createTimeISO: '2026-11-05T23:33:49.000Z',
  authorMeta: { name: 'una.cuenta', fans: 1000, heart: 50000, video: 100 },
  webVideoUrl: 'https://www.tiktok.com/@una.cuenta/video/7704834703446117662',
  videoMeta: { duration: 66, coverUrl: 'https://p16.tiktokcdn.com/portada.jpg' },
  diggCount: 7885,
  shareCount: 980,
  playCount: 573800,
  collectCount: 1002,
  commentCount: 2897,
  isSlideshow: false,
  mediaUrls: ['https://api.apify.com/v2/key-value-stores/abc/records/video.mp4'],
}

test('un video de TikTok trae compartidos y guardados; lo normal es su promedio de me gusta por video', () => {
  const { metricas, medios } = leerTiktok([videoTt])
  assert.equal(metricas.cuenta, 'una.cuenta')
  assert.equal(metricas.vistas, 573800)
  assert.equal(metricas.me_gusta, 7885)
  assert.equal(metricas.comentarios, 2897)
  assert.equal(metricas.compartidos, 980)
  assert.equal(metricas.guardados, 1002)
  assert.equal(metricas.seguidores, 1000)
  assert.equal(metricas.normal_me_gusta, 500)
  assert.equal(metricas.veces_lo_normal, 15.8)
  assert.equal(metricas.veces_su_publico, 573.8)
  assert.equal(metricas.duracion_s, 66)
  assert.deepEqual(medios, { video: 'https://api.apify.com/v2/key-value-stores/abc/records/video.mp4', videoConClave: true, imagenes: ['https://p16.tiktokcdn.com/portada.jpg'] })
})

test('TikTok a veces manda los números como texto', () => {
  const { metricas } = leerTiktok([{ ...videoTt, collectCount: '1002', shareCount: '980' }])
  assert.equal(metricas.guardados, 1002)
  assert.equal(metricas.compartidos, 980)
})

test('en una cuenta enorme las veces quedan con 2 decimales, no en cero', () => {
  const { metricas } = leerTiktok([{ ...videoTt, authorMeta: { name: 'x', fans: 96_700_000, heart: 467_700_000, video: 1515 } }])
  assert.equal(metricas.veces_su_publico, 0.01)
  assert.equal(metricas.veces_lo_normal, 0.03)
})

test('una cuenta de TikTok sin videos contados no tiene «lo normal»', () => {
  const { metricas } = leerTiktok([{ ...videoTt, authorMeta: { name: 'x', fans: 0, heart: 0, video: 0 } }])
  assert.equal(metricas.normal_me_gusta, null)
  assert.equal(metricas.veces_lo_normal, null)
  assert.equal(metricas.veces_su_publico, null)
})

test('si TikTok no devolvió el video, el error lo dice', () => {
  assert.throws(() => leerTiktok([{ error: 'Post not found', url: 'x' }]), ApifyRespuestaError)
  assert.throws(() => leerTiktok([{ text: 'sin números' }]), ApifyRespuestaError)
})

test('mediana', () => {
  assert.equal(mediana([3, 1, 2]), 2)
  assert.equal(mediana([4, 1, 3, 2]), 2.5)
  assert.equal(mediana([]), null)
})

test('los números se leen como se dicen: mil y millones', () => {
  assert.equal(formatoNumero(950), '950')
  assert.equal(formatoNumero(6835), '6,8 mil')
  assert.equal(formatoNumero(392649), '393 mil')
  assert.equal(formatoNumero(1234567), '1,2 M')
  assert.equal(formatoNumero(null), '—')
})

test('las veces llevan un decimal solo si son pocas', () => {
  assert.equal(formatoVeces(26.1), '26×')
  assert.equal(formatoVeces(2.46), '2,5×')
  assert.equal(formatoVeces(null), '—')
})
