import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  avanceLegible,
  errorDeSubida,
  esRutaDe,
  leerPedidoSubida,
  MAX_BYTES,
  nombreDeRuta,
  nombreLimpio,
  revisarArchivo,
  rutaSubida,
  SE_CORTO,
  tipoDeVideo,
} from './subida.ts'

const ID = '3f1c2a7e-1111-4a1a-9a9a-000000000001'
const OTRO = '3f1c2a7e-1111-4a1a-9a9a-000000000002'

test('nombreLimpio: minúsculas, sin tildes ni espacios, con su extensión', () => {
  assert.equal(nombreLimpio('IMG_1234.MOV'), 'img-1234.mov')
  assert.equal(nombreLimpio('Gancho «mito» ñandú.mp4'), 'gancho-mito-nandu.mp4')
  assert.equal(nombreLimpio('toma.final.v2.mov'), 'toma-final-v2.mov')
  assert.equal(nombreLimpio('  Toma   2 (bien) .m4v '), 'toma-2-bien.m4v')
})

test('nombreLimpio: nunca deja rutas ni nombres vacíos', () => {
  assert.equal(nombreLimpio('../../etc/passwd', 'video/mp4'), 'passwd.mp4')
  assert.equal(nombreLimpio('C:\\Videos\\clip.webm'), 'clip.webm')
  assert.equal(nombreLimpio('.mov'), 'video.mov')
  assert.equal(nombreLimpio('🎬🎬.mp4'), 'video.mp4')
  assert.equal(nombreLimpio(''), 'video.mov')
})

test('nombreLimpio: la extensión es la del video; si no hay, sale del tipo', () => {
  assert.equal(nombreLimpio('grabacion', 'video/quicktime'), 'grabacion.mov')
  assert.equal(nombreLimpio('grabacion', 'video/x-m4v'), 'grabacion.m4v')
  assert.equal(nombreLimpio('clip.exe', 'video/mp4'), 'clip-exe.mp4')
  const largo = nombreLimpio(`${'palabra-'.repeat(20)}.mov`)
  assert.ok(largo.length <= 64, largo)
  assert.match(largo, /^[a-z0-9-]+[a-z0-9]\.mov$/)
})

test('tipoDeVideo: el del navegador si sirve; si no dice nada, por la extensión', () => {
  assert.equal(tipoDeVideo('video/quicktime', 'a.mov'), 'video/quicktime')
  assert.equal(tipoDeVideo('VIDEO/MP4', 'a.mp4'), 'video/mp4')
  assert.equal(tipoDeVideo('', 'IMG_1.MOV'), 'video/quicktime')
  assert.equal(tipoDeVideo('application/octet-stream', 'clip.m4v'), 'video/x-m4v')
  assert.equal(tipoDeVideo('', 'clip.webm'), 'video/webm')
  assert.equal(tipoDeVideo('video/x-msvideo', 'clip.avi'), null)
  assert.equal(tipoDeVideo('image/jpeg', 'foto.mov'), null)
  assert.equal(tipoDeVideo('', 'notas.txt'), null)
})

test('rutaSubida: <id>/<único>-<nombre limpio>, y solo esa forma se acepta de vuelta', () => {
  const ruta = rutaSubida(ID, 'Toma 1.MOV', 'video/quicktime', 'mi2k3x9fa1b2c3')
  assert.equal(ruta, `${ID}/mi2k3x9fa1b2c3-toma-1.mov`)
  assert.equal(esRutaDe(ID, ruta), true)
  assert.equal(nombreDeRuta(ruta), 'toma-1.mov')
  for (const mala of [
    `${OTRO}/mi2k3x9fa1b2c3-toma-1.mov`,
    `${ID}/../${OTRO}/mi2k3x9fa1b2c3-toma-1.mov`,
    `${ID}/mi2k3x9fa1b2c3-toma 1.mov`,
    `${ID}/mi2k3x9fa1b2c3-toma-1.exe`,
    `${ID}/toma-1.mov`,
    `crudos/${ID}/mi2k3x9fa1b2c3-toma-1.mov`,
    `${ID}/sub/mi2k3x9fa1b2c3-toma-1.mov`,
    '',
  ]) {
    assert.equal(esRutaDe(ID, mala), false, mala)
  }
})

test('leerPedidoSubida: nombre, tamaño y tipo de un video de hasta 2 GB', () => {
  assert.deepEqual(leerPedidoSubida({ nombre: 'IMG_1.MOV', bytes: 1000, tipo: 'video/quicktime' }), {
    ok: true,
    pedido: { nombre: 'IMG_1.MOV', bytes: 1000, tipo: 'video/quicktime' },
  })
  assert.deepEqual(leerPedidoSubida({ nombre: 'IMG_1.MOV', bytes: MAX_BYTES, tipo: '' }), {
    ok: true,
    pedido: { nombre: 'IMG_1.MOV', bytes: MAX_BYTES, tipo: 'video/quicktime' },
  })
})

test('leerPedidoSubida: lo que no sirve se explica', () => {
  const error = (body: unknown) => {
    const r = leerPedidoSubida(body)
    assert.equal(r.ok, false)
    return r.ok ? '' : r.error
  }
  assert.equal(error(null), 'Falta el nombre del archivo')
  assert.equal(error({ nombre: '  ', bytes: 10, tipo: 'video/mp4' }), 'Falta el nombre del archivo')
  assert.equal(error({ nombre: 'a.mp4', tipo: 'video/mp4' }), 'Falta el tamaño del archivo')
  assert.equal(error({ nombre: 'a.mp4', bytes: 0, tipo: 'video/mp4' }), 'Ese archivo está vacío')
  assert.equal(error({ nombre: 'a.mp4', bytes: 1.5, tipo: 'video/mp4' }), 'Falta el tamaño del archivo')
  assert.equal(error({ nombre: 'a.mp4', bytes: MAX_BYTES + 1, tipo: 'video/mp4' }), 'Ese video pesa más de 2 GB y no cabe. Grábalo en 1080p o córtalo en partes.')
  assert.equal(error({ nombre: 'a.avi', bytes: 10, tipo: 'video/x-msvideo' }), 'Ese archivo no es un video que se pueda subir. Sirven los .mov, .mp4, .m4v y .webm.')
})

test('revisarArchivo: lo mismo, con el archivo que escogió en el teléfono', () => {
  assert.deepEqual(revisarArchivo({ name: 'IMG_9.MOV', size: 5000, type: '' }), { ok: true, tipo: 'video/quicktime' })
  assert.deepEqual(revisarArchivo({ name: 'foto.jpg', size: 5000, type: 'image/jpeg' }), {
    ok: false,
    error: 'Ese archivo no es un video que se pueda subir. Sirven los .mov, .mp4, .m4v y .webm.',
  })
  assert.equal(revisarArchivo({ name: 'IMG_9.MOV', size: 0, type: 'video/quicktime' }).ok, false)
})

test('errorDeSubida: lo que contesta Storage, dicho en simple', () => {
  assert.equal(errorDeSubida(0, ''), SE_CORTO)
  assert.equal(
    errorDeSubida(413, '{"statusCode":"413","error":"Payload too large","message":"The object exceeded the maximum allowed size"}'),
    'El servidor no aceptó el video: pesa más de lo que deja ahora.',
  )
  assert.equal(errorDeSubida(400, '{"statusCode":"415","error":"invalid_mime_type","message":"mime type video/x-msvideo is not supported"}'), 'El servidor no aceptó ese tipo de video.')
  assert.equal(errorDeSubida(400, '{"statusCode":"400","error":"InvalidJWT","message":"\\"exp\\" claim timestamp check failed"}'), 'Se venció el permiso para subir. Toca «Reintentar».')
  assert.equal(errorDeSubida(500, '<html>Bad gateway</html>'), 'No se pudo subir (error 500). Toca «Reintentar».')
})

test('avanceLegible: cómo va cada video', () => {
  assert.equal(avanceLegible('esperando', 0), 'En fila')
  assert.equal(avanceLegible('preparando', 0), 'Preparando…')
  assert.equal(avanceLegible('subiendo', 0.456), '45 %')
  assert.equal(avanceLegible('subiendo', 1), 'Terminando…')
  assert.equal(avanceLegible('revisando', 1), 'Revisando…')
  assert.equal(avanceLegible('lista', 1), 'Subido')
  assert.equal(avanceLegible('error', 0.3), 'No subió')
})
