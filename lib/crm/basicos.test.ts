import { test } from 'node:test'
import assert from 'node:assert/strict'
import { idDe, uuidV5 } from './ids.ts'
import { enlaceWhatsApp, normalizarTelefono, telefonoLegible } from './telefono.ts'
import { pareceHtml, textoPlano } from './texto.ts'
import { canalConocido, iniciales, nombreVisible, tamanoLegible, tipoArchivo } from './tipos.ts'

test('tipoArchivo y tamanoLegible', () => {
  assert.equal(tipoArchivo('image/jpeg'), 'Foto')
  assert.equal(tipoArchivo('video/mp4'), 'Video')
  assert.equal(tipoArchivo('audio/ogg'), 'Audio')
  assert.equal(tipoArchivo('application/pdf'), 'PDF')
  assert.equal(tipoArchivo(null), 'Archivo')
  assert.equal(tamanoLegible(500), '1 KB')
  assert.equal(tamanoLegible(350 * 1024), '350 KB')
  assert.equal(tamanoLegible(2.44 * 1024 * 1024), '2.4 MB')
  assert.equal(tamanoLegible(null), '')
})

test('normalizarTelefono: a E.164, con Costa Rica y EE. UU. por defecto', () => {
  assert.equal(normalizarTelefono('7000 0001'), '+50670000001')
  assert.equal(normalizarTelefono('7000-0001'), '+50670000001')
  assert.equal(normalizarTelefono('+506 7000-0001'), '+50670000001')
  assert.equal(normalizarTelefono('(305) 555-0100'), '+13055550100')
  assert.equal(normalizarTelefono('1 305 555 0100'), '+13055550100')
  assert.equal(normalizarTelefono('0052 55 1234 5678'), '+525512345678')
  assert.equal(normalizarTelefono('+52 55 1234 5678'), '+525512345678')
  for (const malo of ['', '   ', '123', '7000 000', 'llamar mañana', '+1234567890123456', null, 42]) {
    assert.equal(normalizarTelefono(malo), null, String(malo))
  }
})

test('telefonoLegible y el enlace de WhatsApp', () => {
  assert.equal(telefonoLegible('+50670000001'), '+506 7000 0001')
  assert.equal(telefonoLegible('+13055550100'), '+1 305 555 0100')
  assert.equal(telefonoLegible('+525512345678'), '+52 551 234 5678')
  assert.equal(telefonoLegible('+447700900123'), '+447700900123')
  assert.equal(enlaceWhatsApp('+50670000001'), 'https://wa.me/50670000001')
})

test('textoPlano: sin etiquetas ni scripts, con sus saltos de línea y entidades', () => {
  assert.equal(textoPlano('<div>Hola<br>mundo</div><div>Chao</div>'), 'Hola\nmundo\nChao')
  assert.equal(textoPlano('<style>p{color:red}</style><p>Texto</p><script>alert(1)</script>'), 'Texto')
  assert.equal(textoPlano('<ul><li>Uno</li><li>Dos</li></ul>'), '• Uno\n• Dos')
  assert.equal(textoPlano('<p>&iquest;Qu&eacute; tal?&#33; &#x1F600;</p>'), '¿Qué tal?! 😀')
  // Una sola pasada: lo que era texto escapado queda como texto
  assert.equal(textoPlano('<p>&amp;lt;b&amp;gt;</p>'), '&lt;b&gt;')
  // Un mensaje que no es HTML no se toca
  assert.equal(textoPlano('te quiero <3 y a > b'), 'te quiero <3 y a > b')
  assert.equal(textoPlano('uno\r\n\r\n\r\n\r\ndos   \n'), 'uno\n\ndos')
  assert.equal(textoPlano(null), '')
  assert.equal(pareceHtml('<p>hola</p>'), true)
  assert.equal(pareceHtml('a<b y c>d'), false)
})

test('uuidV5 e idDe: fijos, con forma de UUID v5 y distintos por tipo', () => {
  assert.equal(uuidV5('www.example.com', '6ba7b810-9dad-11d1-80b4-00c04fd430c8'), '2ed6657d-e927-568b-95e1-2665a8aea6a2')
  const a = idDe('contacto', 'abc')
  assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  assert.equal(idDe('contacto', 'abc'), a)
  assert.notEqual(idDe('nota', 'abc'), a)
})

test('nombreVisible, iniciales y canalConocido', () => {
  assert.equal(nombreVisible({ nombre: 'Ana', apellido: 'Prueba' }), 'Ana Prueba')
  assert.equal(nombreVisible({ nombre: '', apellido: '', correo: 'ana@ejemplo.test' }), 'ana@ejemplo.test')
  assert.equal(nombreVisible({ nombre: '', apellido: '', telefono: '+50670000001' }), '+506 7000 0001')
  assert.equal(nombreVisible({ nombre: ' ', apellido: '' }), 'Sin nombre')
  assert.equal(iniciales('Ana María Prueba'), 'AP')
  assert.equal(iniciales('Óscar'), 'Ó')
  assert.equal(iniciales('+506 7000 0001'), '#')
  assert.equal(iniciales('lucia.prueba@ejemplo.test'), 'L')
  assert.equal(iniciales('—'), '·')
  assert.equal(canalConocido('whatsapp'), 'whatsapp')
  assert.equal(canalConocido('tiktok'), 'otro')
  assert.equal(canalConocido(null), 'otro')
})
