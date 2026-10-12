import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SERVICE_PATHS } from '../../components/home/services.ts'
import { VIDEO_BASE, serviceVideo } from './service-videos.ts'

test('cada página de servicio tiene su video, en versión de escritorio, de teléfono y portada', () => {
  for (const key of Object.keys(SERVICE_PATHS)) {
    const v = serviceVideo(key)
    assert.ok(v, key)
    for (const url of [v.src, v.srcMobile, v.poster]) assert.ok(url.startsWith(VIDEO_BASE + '/'), url)
    assert.match(v.src, /\.mp4$/)
    assert.match(v.srcMobile, /-movil\.mp4$/)
    assert.match(v.poster, /\.webp$/)
  }
})

test('los archivos llevan versión, para poder cachearlos un año y cambiarlos sin esperar', () => {
  assert.match(serviceVideo('sitiosWeb')!.src, /sitios-web-v\d+\.mp4$/)
})

test('un servicio sin video (FunnelLab, externo) no tiene', () => {
  assert.equal(serviceVideo('funnelLab'), null)
})

test('la portada es un cuadro con contenido del video (-p2), no el arranque oscuro', () => {
  assert.match(serviceVideo('campanas')!.poster, /campanas-v1-p2\.webp$/)
})

test('cada video trae su duración en m:ss, para mostrarla sin esperar a que cargue', () => {
  for (const key of Object.keys(SERVICE_PATHS)) assert.match(serviceVideo(key)!.duration, /^\d+:\d{2}$/, key)
  assert.equal(serviceVideo('campanas')!.duration, '0:56')
  assert.equal(serviceVideo('agentesIa')!.duration, '0:51')
})
