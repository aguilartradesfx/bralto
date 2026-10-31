import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mensajeUsuario, normalizarDecision, sistema, type SalidaKnox } from './reglas.ts'
import type { ContextoKnox } from './tipos.ts'

const FICHA = 'El diagnóstico cuesta $97 USD. Los proyectos empiezan desde $3,500 USD. Se agenda en https://www.bralto.io/es/agendar'

const salida = (extra: Partial<SalidaKnox> = {}): SalidaKnox => ({
  tipo: 'trabajo',
  accion: 'responder',
  respuesta: '¡Hola! Soy Knox, el asistente de Ale 🤖 Ale te escribe pronto.',
  aviso: 'Quiere una web',
  etiquetas: ['lead'],
  datos: { nombre: 'Ana', negocio: null, necesidad: 'una web' },
  motivo: 'Quiere contratar',
  ...extra,
})

test('un mensaje personal o spam nunca se contesta ni se avisa', () => {
  for (const tipo of ['personal', 'spam'] as const) {
    const d = normalizarDecision(salida({ tipo, accion: 'responder', respuesta: 'Jaja sí', aviso: 'algo' }), FICHA)
    assert.equal(d.accion, 'silencio')
    assert.equal(d.respuesta, null)
    assert.equal(d.aviso, null)
  }
})

test('responder sin texto pasa a Ale con un aviso', () => {
  const d = normalizarDecision(salida({ respuesta: '   ', aviso: null }), FICHA)
  assert.equal(d.accion, 'pasar_a_ale')
  assert.equal(d.respuesta, null)
  assert.ok(d.aviso)
})

test('pasar a Ale nunca lleva respuesta y siempre lleva aviso', () => {
  const d = normalizarDecision(salida({ accion: 'pasar_a_ale', respuesta: 'Hola', aviso: null }), FICHA)
  assert.equal(d.respuesta, null)
  assert.ok(d.aviso)
})

test('si la respuesta dice que es Ale, no se manda', () => {
  for (const respuesta of ['Hola, soy Ale, te llamo mañana', 'Te escribe Alejandro 👋']) {
    const d = normalizarDecision(salida({ respuesta }), FICHA)
    assert.equal(d.accion, 'pasar_a_ale', respuesta)
    assert.equal(d.respuesta, null)
  }
})

test('decir que no es Ale sí se puede', () => {
  const d = normalizarDecision(salida({ respuesta: 'Soy Knox, el asistente virtual de Ale 🤖 No soy Ale, pero le aviso para que te escriba.' }), FICHA)
  assert.equal(d.accion, 'responder')
})

test('cuando una regla frena la respuesta, el aviso dice por qué', () => {
  const d = normalizarDecision(salida({ respuesta: 'Agéndalo aquí: https://calendly.com/alguien', aviso: null }), FICHA)
  assert.equal(d.accion, 'pasar_a_ale')
  assert.match(d.aviso ?? '', /enlace que no es de bralto\.io/)
})

test('Knox tutea con «tú», nunca con «vos»', () => {
  assert.match(sistema(FICHA), /«tú»/)
  assert.match(sistema(FICHA), /nunca de «vos»/)
})

test('Knox habla como tico: si le hablan de usted contesta de usted, y no usa frases de bot', () => {
  const s = sistema(FICHA)
  assert.match(s, /de usted, contéstale de usted/)
  assert.match(s, /pura vida/)
  assert.match(s, /«mae» solo si la persona lo usa/i)
  assert.match(s, /Estoy aquí para ayudarte/) // está en la lista de frases prohibidas
})

test('los enlaces solo pueden ser de bralto.io', () => {
  const bien = normalizarDecision(salida({ respuesta: 'Agéndalo aquí: https://www.bralto.io/es/agendar 🙌' }), FICHA)
  assert.equal(bien.accion, 'responder')
  const mal = normalizarDecision(salida({ respuesta: 'Agéndalo aquí: https://calendly.com/alguien' }), FICHA)
  assert.equal(mal.accion, 'pasar_a_ale')
  const disfrazado = normalizarDecision(salida({ respuesta: 'Mira https://bralto.io.estafa.com' }), FICHA)
  assert.equal(disfrazado.accion, 'pasar_a_ale')
})

test('los precios solo pueden ser los de la ficha', () => {
  assert.equal(normalizarDecision(salida({ respuesta: 'El diagnóstico cuesta $97 🙌' }), FICHA).accion, 'responder')
  assert.equal(normalizarDecision(salida({ respuesta: 'Los proyectos arrancan desde $3500.' }), FICHA).accion, 'responder')
  assert.equal(normalizarDecision(salida({ respuesta: 'Una web te sale en $1,200.' }), FICHA).accion, 'pasar_a_ale')
  assert.equal(normalizarDecision(salida({ respuesta: 'Te cobra 150 dólares.' }), FICHA).accion, 'pasar_a_ale')
})

test('una respuesta demasiado larga pasa a Ale', () => {
  const d = normalizarDecision(salida({ respuesta: 'Hola. '.repeat(150) }), FICHA)
  assert.equal(d.accion, 'pasar_a_ale')
})

test('las etiquetas quedan limpias, sin repetir y máximo 5', () => {
  const d = normalizarDecision(salida({ etiquetas: [' Lead', 'lead', 'Pidio llamada', 'a', 'b', 'c', 'd'] }), FICHA)
  assert.deepEqual(d.etiquetas, ['lead', 'pidio-llamada', 'a', 'b', 'c'])
})

test('los datos vacíos quedan en null', () => {
  const d = normalizarDecision(salida({ datos: { nombre: '  ', negocio: 'Panadería', necesidad: null } }), FICHA)
  assert.deepEqual(d.datos, { nombre: null, negocio: 'Panadería', necesidad: null })
})

const CTX: ContextoKnox = {
  canal: 'instagram',
  nombre: 'Ana Prueba',
  usuario: 'ana.prueba',
  contacto: null,
  mensajes: [
    { autor: 'persona', texto: '¿Cuánto cuesta una web?', en: '2026-10-30T02:58:00Z' },
    { autor: 'knox', texto: '¡Hola, Ana! Soy Knox, el asistente de Ale 🤖', en: '2026-10-30T02:59:00Z' },
    { autor: 'persona', texto: '', adjunto: 'foto', en: '2026-10-30T03:05:00Z' },
  ],
}
const AHORA = new Date('2026-10-30T03:06:00Z') // jueves 29, 9:06 p. m. en Costa Rica

test('el contexto dice el canal, quién escribe y la conversación en orden con autores y hora de Costa Rica', () => {
  const t = mensajeUsuario(CTX, AHORA)
  assert.match(t, /Instagram/)
  assert.match(t, /Ana Prueba \(@ana\.prueba\)/)
  assert.match(t, /No está en el CRM/)
  const persona = t.indexOf('Persona: ¿Cuánto cuesta una web?')
  const knox = t.indexOf('Knox: ¡Hola, Ana!')
  assert.ok(persona > 0 && knox > persona)
  assert.match(t, /8:58 p\. ?m\./)
})

test('un adjunto sin texto se describe y el contacto del CRM se resume', () => {
  const t = mensajeUsuario({ ...CTX, contacto: { etiquetas: ['lead'], notas: ['Quiere una web para su panadería'], oportunidadesAbiertas: 1 } }, AHORA)
  assert.match(t, /Persona: \(mandó una foto\)/)
  assert.match(t, /etiquetas: lead/)
  assert.match(t, /1 oportunidad abierta/)
  assert.match(t, /Quiere una web para su panadería/)
})

test('la ficha va dentro de las instrucciones, y sin ficha Knox no afirma nada', () => {
  assert.match(sistema(FICHA), /<ficha>[\s\S]*\$97 USD[\s\S]*<\/ficha>/)
  assert.match(sistema('   '), /La ficha está vacía/)
})
