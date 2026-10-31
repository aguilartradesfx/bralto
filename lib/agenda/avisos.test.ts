import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cuandoCorto, respuestas, textoCitaNueva, textoFallaGoogle, textoSinCita } from './avisos.ts'

// Datos inventados
const reserva = {
  slot: '2026-11-06-9am',
  firstName: 'Ana',
  lastName: 'Rojas',
  phone: '+50688881234',
  email: 'ana@empresa-ejemplo.com',
  locale: 'es' as const,
  answers: { size: '2 a 5 personas', revenue: '$15,001 – $30,000 USD', challenge: 'Responder clientes a tiempo', industry: 'Educación', timeline: 'En el próximo mes' },
}
const ref = 'BRD-261106-K7F3Q9XZ'
const plano = (s: string) => s.replace(/\s/g, ' ')

test('el día y la hora, cortos y en hora de Costa Rica', () => {
  assert.equal(plano(cuandoCorto('2026-11-06-9am')), 'viernes 6 de noviembre, 9:00 a. m.')
})

test('las respuestas van una por línea, con su pregunta', () => {
  assert.equal(
    respuestas(reserva),
    'Personas: 2 a 5 personas\nIngreso mensual: $15,001 – $30,000 USD\nDesafío: Responder clientes a tiempo\nIndustria: Educación\nPlazo: En el próximo mes',
  )
  assert.equal(respuestas({ answers: {} as typeof reserva.answers }), '')
})

test('una cita nueva: quién, cuándo, cómo contactarle, el enlace y sus respuestas', () => {
  const t = textoCitaNueva(reserva, ref, 'https://meet.google.com/abc-defg-hij')
  for (const parte of ['Ana Rojas', 'ana@empresa-ejemplo.com', '+506 8888 1234', ref, 'https://meet.google.com/abc-defg-hij', 'Plazo: En el próximo mes']) {
    assert.ok(t.includes(parte), parte)
  }
  assert.match(textoCitaNueva(reserva, ref, 'x', { recuperada: true }), /^✅/)
})

test('sin cita: el aviso dice qué pasó, los datos para escribirle y el error', () => {
  const calendario = textoSinCita('calendario', reserva, ref, 'Google no dio acceso: invalid_grant')
  assert.match(calendario, /NO se pudo crear la cita/)
  assert.ok(calendario.includes('invalid_grant'))
  assert.ok(calendario.includes('ana@empresa-ejemplo.com'))
  const conflicto = textoSinCita('conflicto', reserva, ref)
  assert.match(conflicto, /ya estaba ocupado/)
  assert.ok(conflicto.includes('+506 8888 1234'))
})

test('si Google falla al dar horarios, el aviso dice qué ofrece mientras tanto', () => {
  assert.match(textoFallaGoogle('invalid_grant'), /horarios fijos/)
  assert.match(textoFallaGoogle('invalid_grant', { parcial: true }), /los calendarios que sí respondieron/)
})
