import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import {
  CODIGO,
  esAvisoDeMeta,
  generarCodigo,
  leerCodigo,
  leerSignedRequest,
  respuestaMeta,
  textoAviso,
  validarSolicitud,
} from './solicitud.ts'

const SECRETO = 'secreto-de-prueba'
const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url')
function firmar(payload: object, secreto = SECRETO): string {
  const cuerpo = b64url(JSON.stringify(payload))
  const firma = b64url(createHmac('sha256', secreto).update(cuerpo).digest())
  return `${firma}.${cuerpo}`
}
const valido = { algorithm: 'HMAC-SHA256', issued_at: 1762300000, user_id: '1234567890' }

test('el código tiene el formato BR- y 8 letras o números fáciles de leer, y no se repite', () => {
  const vistos = new Set<string>()
  for (let i = 0; i < 500; i++) {
    const c = generarCodigo()
    assert.match(c, CODIGO)
    assert.doesNotMatch(c.slice(3), /[01IO]/)
    vistos.add(c)
  }
  assert.equal(vistos.size, 500)
})

test('el código que escribe la persona se acepta en minúsculas o con espacios, y uno inventado no', () => {
  assert.equal(leerCodigo(' br-abcd2345 '), 'BR-ABCD2345')
  for (const malo of ['', 'BR-123', 'XX-ABCD2345', 'BR-ABCD23451', 'BR-ABCD 2345', null, undefined]) {
    assert.equal(leerCodigo(malo), null, String(malo))
  }
})

test('la solicitud firmada por Meta con la clave de la app da el id de la persona', () => {
  assert.deepEqual(leerSignedRequest(firmar(valido), SECRETO), { userId: '1234567890' })
})

test('una solicitud con otra clave, alterada o mal armada no se acepta', () => {
  assert.equal(leerSignedRequest(firmar(valido, 'otra-clave'), SECRETO), null)
  const [firma] = firmar(valido).split('.')
  assert.equal(leerSignedRequest(`${firma}.${b64url(JSON.stringify({ ...valido, user_id: '999' }))}`, SECRETO), null)
  assert.equal(leerSignedRequest(firmar({ ...valido, algorithm: 'HMAC-SHA1' }), SECRETO), null)
  assert.equal(leerSignedRequest(firmar({ algorithm: 'HMAC-SHA256' }), SECRETO), null)
  for (const malo of ['', 'sin-punto', '.', 'abc.def', 'a.b.c']) assert.equal(leerSignedRequest(malo, SECRETO), null, malo)
  assert.equal(leerSignedRequest(firmar(valido), ''), null)
})

test('la respuesta a Meta trae la página para ver el estado y el mismo código', () => {
  assert.deepEqual(respuestaMeta('BR-ABCD2345', 'https://www.bralto.io'), {
    url: 'https://www.bralto.io/es/eliminar-datos?codigo=BR-ABCD2345',
    confirmation_code: 'BR-ABCD2345',
  })
})

test('Meta puede avisar por POST a la página, con o sin idioma; lo demás sigue igual', () => {
  for (const p of ['/eliminar-datos', '/eliminar-datos/', '/es/eliminar-datos', '/en/eliminar-datos']) {
    assert.equal(esAvisoDeMeta('POST', p, null), true, p)
  }
  assert.equal(esAvisoDeMeta('GET', '/eliminar-datos', null), false)
  assert.equal(esAvisoDeMeta('POST', '/es/eliminar-datos/otra', null), false)
  assert.equal(esAvisoDeMeta('POST', '/fr/eliminar-datos', null), false)
  assert.equal(esAvisoDeMeta('POST', '/es/privacidad', null), false)
})

test('el envío del formulario de la página (server action, con Next-Action) no se confunde con Meta', () => {
  assert.equal(esAvisoDeMeta('POST', '/es/eliminar-datos', '7f3a9c'), false)
  assert.equal(esAvisoDeMeta('POST', '/eliminar-datos', '7f3a9c'), false)
})

const base = { nombre: 'Ana Pérez', contacto: 'Ana@Correo.com', cuenta: '@ana.perez', detalle: 'Me escribieron por Instagram.' }

test('el formulario acepta un correo o un WhatsApp con código de país, y los deja limpios', () => {
  const r1 = validarSolicitud(base)
  assert.equal(r1.ok && r1.datos.contacto, 'ana@correo.com')
  const r2 = validarSolicitud({ ...base, contacto: '+506 8888-8888' })
  assert.equal(r2.ok && r2.datos.contacto, '+50688888888')
  assert.equal(r1.ok && r1.datos.cuenta, '@ana.perez')
})

test('sin nombre o sin un contacto que sirva, pide corregirlo', () => {
  const r = validarSolicitud({ ...base, nombre: ' ', contacto: '8888 8888' })
  assert.equal(r.ok, false)
  assert.ok(!r.ok && r.errores.nombre)
  assert.ok(!r.ok && r.errores.contacto)
})

test('la cuenta y el detalle son opcionales, y un detalle muy largo pide acortarlo', () => {
  const r = validarSolicitud({ nombre: 'Ana', contacto: 'ana@correo.com' })
  assert.equal(r.ok && r.datos.cuenta, null)
  assert.equal(r.ok && r.datos.detalle, null)
  const largo = validarSolicitud({ ...base, detalle: 'a'.repeat(1001) })
  assert.ok(!largo.ok && largo.errores.detalle)
})

test('el campo escondido lleno marca la solicitud como de un bot', () => {
  const r = validarSolicitud({ ...base, sitio: 'https://spam.example' })
  assert.equal(r.ok && r.bot, true)
  assert.equal(validarSolicitud(base).ok && validarSolicitud(base).bot, false)
})

test('el aviso de Telegram dice el código, de dónde vino y no deja colar renglones', () => {
  const r = validarSolicitud({ ...base, nombre: 'Ana\nPérez', cuenta: '@ana\n🔓 falso' })
  assert.ok(r.ok)
  const aviso = textoAviso({ codigo: 'BR-ABCD2345', origen: 'formulario', ...(r.ok ? r.datos : base) })
  assert.match(aviso, /BR-ABCD2345/)
  assert.match(aviso, /formulario/)
  assert.match(aviso, /Nombre: Ana Pérez/)
  assert.doesNotMatch(aviso, /\n🔓 falso/)
  const meta = textoAviso({ codigo: 'BR-ABCD2345', origen: 'meta', metaUsuario: '1234567890' })
  assert.match(meta, /Meta/)
  assert.match(meta, /1234567890/)
})
