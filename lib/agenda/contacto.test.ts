import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  actividadDeLaCita,
  citaDelCrm,
  completarContacto,
  condicionesDeBusqueda,
  contactoDelDiagnostico,
  contactoNuevo,
  elegirContacto,
  ETIQUETA,
  identidadesDe,
} from './contacto.ts'

// Datos inventados
const reserva = {
  slot: '2026-11-06-9am',
  firstName: ' Ana ',
  lastName: 'Rojas',
  phone: '+50688881234',
  email: 'Ana@Empresa-Ejemplo.com',
  locale: 'es' as const,
  answers: { size: '2 a 5 personas', revenue: '$15,001 – $30,000 USD', challenge: 'Responder clientes a tiempo', industry: 'Educación', timeline: 'En el próximo mes' },
}
const ref = 'BRD-261106-K7F3Q9XZ'
const datos = contactoDelDiagnostico(reserva)

test('los datos del contacto: limpios, con el teléfono en E.164 y el correo en minúsculas', () => {
  assert.equal(datos.nombre, 'Ana')
  assert.equal(datos.telefono, '+50688881234')
  assert.equal(datos.correo, 'ana@empresa-ejemplo.com')
})

test('las respuestas van a los campos que llenaba GoHighLevel', () => {
  assert.deepEqual(datos.campos, {
    facturacin_mensual__20: { etiqueta: 'Facturación mensual - 2.0', valor: '$15,001 – $30,000 USD' },
    objetivo: { etiqueta: 'Objetivo', valor: 'Responder clientes a tiempo' },
    deadline: { etiqueta: 'Deadline', valor: 'En el próximo mes' },
    company_size: { etiqueta: 'Company Size', valor: '2 a 5 personas' },
    industria: { etiqueta: 'Industria', valor: 'Educación' },
  })
})

test('se busca por correo y por teléfono (también el de WhatsApp)', () => {
  assert.deepEqual(condicionesDeBusqueda(datos), [
    'and(canal.eq.correo,valor.eq."ana@empresa-ejemplo.com")',
    'and(canal.in.(telefono,whatsapp),valor.eq."+50688881234")',
  ])
  assert.equal(condicionesDeBusqueda({ ...datos, telefono: null }).length, 1)
})

test('si el correo y el teléfono son de contactos distintos, gana el del correo', () => {
  assert.equal(
    elegirContacto([
      { canal: 'telefono', contacto_id: 'del-telefono' },
      { canal: 'correo', contacto_id: 'del-correo' },
    ]),
    'del-correo',
  )
  assert.equal(elegirContacto([{ canal: 'whatsapp', contacto_id: 'del-whatsapp' }]), 'del-whatsapp')
  assert.equal(elegirContacto([]), null)
})

test('a un contacto que ya existía solo se le completa lo que falta', () => {
  const cambio = completarContacto(
    { nombre: 'Ana María', apellido: '', telefono: '+50677776666', correo: null, etiquetas: ['bralto'], campos: { objetivo: { etiqueta: 'Objetivo', valor: 'viejo' } } },
    datos,
  )
  assert.deepEqual(cambio, {
    apellido: 'Rojas',
    correo: 'ana@empresa-ejemplo.com',
    etiquetas: ['bralto', ETIQUETA],
    campos: datos.campos,
  })
})

test('si ya tiene todo, no se cambia nada', () => {
  const actual = { nombre: 'Ana', apellido: 'Rojas', telefono: '+50688881234', correo: 'ana@empresa-ejemplo.com', etiquetas: [ETIQUETA], campos: datos.campos }
  assert.equal(completarContacto(actual, datos), null)
})

test('un contacto nuevo entra con origen web, la etiqueta y de dónde vino', () => {
  assert.deepEqual(contactoNuevo(datos), {
    nombre: 'Ana',
    apellido: 'Rojas',
    telefono: '+50688881234',
    correo: 'ana@empresa-ejemplo.com',
    etiquetas: [ETIQUETA],
    campos: datos.campos,
    fuente: 'Agenda del sitio',
    origen: 'web',
  })
  assert.deepEqual(identidadesDe('c1', datos), [
    { contacto_id: 'c1', canal: 'correo', valor: 'ana@empresa-ejemplo.com' },
    { contacto_id: 'c1', canal: 'telefono', valor: '+50688881234' },
  ])
})

test('la cita del CRM lleva el enlace de Meet, el id de Google y las respuestas en las notas', () => {
  const inicio = Date.parse('2026-11-06T09:00:00-06:00')
  const fila = citaDelCrm('c1', reserva, { eventoId: 'brd42', meet: 'https://meet.google.com/abc-defg-hij', inicio, fin: inicio + 30 * 60_000 })
  assert.equal(fila.enlace, 'https://meet.google.com/abc-defg-hij')
  assert.equal(fila.google_id, 'brd42')
  assert.equal(fila.inicio, '2026-11-06T15:00:00.000Z')
  assert.equal(fila.fin, '2026-11-06T15:30:00.000Z')
  assert.equal(fila.estado, 'confirmada')
  assert.equal(fila.origen, 'web')
  assert.match(fila.notas ?? '', /Industria: Educación/)
})

test('el historial anota la cita una sola vez por pago', () => {
  const a = actividadDeLaCita('c1', reserva, ref, '2026-11-02T15:00:00.000Z')
  assert.equal(a.externo_id, `diagnostico:${ref}`)
  assert.equal(a.tipo, 'actividad')
  assert.match(a.texto.replace(/\s/g, ' '), /viernes 6 de noviembre, 9:00 a\. m\./)
})
