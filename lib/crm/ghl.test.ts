import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canalDe, camposDe, estadoCita, iso, nombreAdjunto, textoActividad, transformar, type CopiaGhl } from './ghl.ts'
import { idDe } from './ids.ts'

// Una copia chiquita e inventada, con la forma de la de GoHighLevel
function copia(): CopiaGhl {
  return {
    campos: [
      { id: 'cf1', name: 'Presupuesto mensual', fieldKey: 'contact.presupuesto_mensual' },
      { id: 'cf2', name: 'Rubro', fieldKey: 'contact.rubro' },
    ],
    contactos: [
      {
        id: 'c1',
        firstName: 'Lucía',
        lastName: 'Prueba',
        phone: '+50670000001',
        email: 'Lucia@Ejemplo.TEST',
        companyName: 'Panadería Inventada',
        tags: ['Cliente', 'cliente', ' lead caliente '],
        customFields: [
          { id: 'cf1', value: '500' },
          { id: 'cf2', value: '' },
          { id: 'cfX', value: 7 },
        ],
        source: 'Formulario de prueba',
        dateAdded: '2026-01-10T15:00:00.000Z',
        dateUpdated: '2026-02-01T15:00:00.000Z',
        lastActivity: '2026-02-01T15:00:00.000Z',
        notas: [{ id: 'n1', body: 'Llamar el lunes', dateAdded: '2026-03-05T12:00:00.000Z', pinned: true }],
        tareas: [{ id: 't1', title: 'Mandar propuesta', dueDate: '2026-03-06T15:00:00.000Z', completed: false }],
      },
      {
        id: 'c2',
        firstName: null,
        lastName: null,
        contactName: '+1 305 555 0100',
        phone: '+13055550100',
        email: null,
        tags: [],
        dateAdded: '2026-01-11T15:00:00.000Z',
      },
      // Comparte el WhatsApp con c1: la identidad queda con el de actividad más reciente
      { id: 'c3', firstName: 'Mario', lastName: 'Ejemplo', phone: '+50670000003', dateAdded: '2025-12-01T15:00:00.000Z' },
    ],
    pipelines: [
      {
        id: 'p1',
        name: 'Ventas de prueba',
        stages: [
          { id: 'e2', name: 'Segunda etapa', position: 1 },
          { id: 'e1', name: 'Primera etapa', position: 0 },
        ],
      },
    ],
    oportunidades: [
      { id: 'o1', name: 'Lucía - web', monetaryValue: 1200.5, pipelineId: 'p1', pipelineStageId: 'e2', status: 'won', contactId: 'c1', createdAt: '2026-01-12T15:00:00.000Z', lastStageChangeAt: '2026-01-20T15:00:00.000Z' },
      { id: 'o2', name: 'Sin contacto', pipelineId: 'p1', pipelineStageId: 'e1', status: 'open', contactId: 'nadie', createdAt: '2026-01-12T15:00:00.000Z' },
      { id: 'o3', name: 'Etapa ajena', pipelineId: 'p1', pipelineStageId: 'otra', status: 'open', contactId: 'c2', createdAt: '2026-01-12T15:00:00.000Z' },
    ],
    conversaciones: [
      {
        id: 'v1',
        contactId: 'c1',
        unreadCount: 2,
        dateAdded: Date.parse('2026-01-10T15:00:00.000Z'),
        mensajes: [
          { id: 'm1', messageType: 'TYPE_WHATSAPP', direction: 'inbound', status: 'read', body: 'Hola, ¿precio?', contentType: 'text/plain', from: '+50670000001', to: '+1 555-000-0000', dateAdded: '2026-03-01T15:00:00.000Z' },
          { id: 'm2', messageType: 'TYPE_WHATSAPP', direction: 'outbound', status: 'failed', error: 'Número no válido', body: 'Te paso la info', from: '+1 555-000-0000', to: '+506 7000-0009', dateAdded: '2026-03-01T15:05:00.000Z', attachments: ['https://archivos.test/x/abc123.pdf'] },
          { id: 'm3', messageType: 'TYPE_EMAIL', body: '<p>Hola <b>Lucía</b>&nbsp;&amp; equipo</p><p>Saludos</p>', contentType: 'text/html', status: 'sent', meta: { email: { subject: 'Tu propuesta', direction: 'outbound' } }, dateAdded: '2026-03-02T15:00:00.000Z' },
          { id: 'm4', messageType: 'TYPE_CALL', direction: 'outbound', status: 'completed', meta: { call: { duration: 95, status: 'completed' } }, dateAdded: '2026-03-03T15:00:00.000Z' },
          { id: 'm5', messageType: 'TYPE_ACTIVITY_OPPORTUNITY', body: 'Opportunity updated', activity: { type: 'opportunity_stage_updated', title: 'Opportunity updated', data: { stage: { newStageName: 'Segunda etapa', oldStageName: 'Primera etapa' } } }, dateAdded: '2026-03-04T15:00:00.000Z' },
          { id: 'm6', messageType: 'TYPE_CUSTOM_SMS', direction: 'inbound', status: 'delivered', body: 'Te mando foto', attachments: ['https://archivos.test/y/foto.jpg'], dateAdded: '2026-02-28T15:00:00.000Z' },
        ],
      },
      {
        id: 'v3',
        contactId: 'c3',
        mensajes: [{ id: 'm7', messageType: 'TYPE_WHATSAPP', direction: 'inbound', body: 'Hola', from: '+506 7000-0009', dateAdded: '2026-01-02T15:00:00.000Z' }],
      },
      { id: 'v9', contactId: 'nadie', mensajes: [] },
    ],
    citas: [
      { id: 'a1', contactId: 'c1', title: 'Sesión de prueba', startTime: '2026-03-10T10:00:00-06:00', endTime: '2026-03-10T10:30:00-06:00', appointmentStatus: 'noshow', address: 'https://videollamada.test/abc', dateAdded: '2026-03-01T10:00:00.000Z' },
      { id: 'a2', contactId: 'c2', title: '', startTime: '2026-03-11T10:00:00-06:00', appointmentStatus: 'confirmed', address: 'Oficina' },
      { id: 'a3', contactId: 'c2', startTime: '2026-03-12T10:00:00-06:00', deleted: true },
    ],
    adjuntos: { mapa: { 'https://archivos.test/y/foto.jpg': 'adjuntos/v1/m6-0.jpg' }, fallas: [{ url: 'https://archivos.test/x/abc123.pdf', error: 'HTTP 404' }] },
  }
}

test('contactos: nombre, teléfono, correo en minúsculas, etiquetas sin repetir y campos con su etiqueta', () => {
  const r = transformar(copia())
  assert.equal(r.contactos.length, 3)
  const lucia = r.contactos.find((c) => c.ghl_id === 'c1')!
  assert.equal(lucia.id, idDe('contacto', 'c1'))
  assert.equal(lucia.nombre, 'Lucía')
  assert.equal(lucia.apellido, 'Prueba')
  assert.equal(lucia.telefono, '+50670000001')
  assert.equal(lucia.correo, 'lucia@ejemplo.test')
  assert.equal(lucia.empresa, 'Panadería Inventada')
  assert.deepEqual(lucia.etiquetas, ['cliente', 'lead caliente'])
  assert.deepEqual(lucia.campos, {
    presupuesto_mensual: { etiqueta: 'Presupuesto mensual', valor: '500' },
    ghl_cfX: { etiqueta: null, valor: '7' },
  })
  assert.equal(lucia.fuente, 'Formulario de prueba')
  assert.equal(lucia.origen, 'ghl')
  // La última actividad es lo más nuevo: alta, actividad de GoHighLevel, mensajes (la de la oportunidad, el 4) y notas (el 5)
  assert.equal(lucia.ultima_actividad, '2026-03-05T12:00:00.000Z')
  const sinNombre = r.contactos.find((c) => c.ghl_id === 'c2')!
  assert.equal(sinNombre.nombre, '')
  assert.equal(sinNombre.ultima_actividad, '2026-01-11T15:00:00.000Z')
})

test('notas y tareas de cada contacto', () => {
  const r = transformar(copia())
  assert.deepEqual(
    r.notas.map((n) => [n.ghl_id, n.contacto_id, n.texto, n.fijada]),
    [['n1', idDe('contacto', 'c1'), 'Llamar el lunes', true]],
  )
  assert.equal(r.tareas.length, 1)
  assert.equal(r.tareas[0].titulo, 'Mandar propuesta')
  assert.equal(r.tareas[0].vence_en, '2026-03-06T15:00:00.000Z')
  assert.equal(r.tareas[0].hecha, false)
})

test('pipelines, etapas en orden y oportunidades (las que no tienen contacto o etapa quedan afuera, con aviso)', () => {
  const r = transformar(copia())
  assert.deepEqual(r.pipelines.map((p) => p.nombre), ['Ventas de prueba'])
  assert.deepEqual(r.etapas.map((e) => [e.nombre, e.orden]), [['Primera etapa', 0], ['Segunda etapa', 1]])
  assert.equal(r.oportunidades.length, 1)
  const o = r.oportunidades[0]
  assert.equal(o.estado, 'ganada')
  assert.equal(o.valor, 1200.5)
  assert.equal(o.etapa_id, idDe('etapa', 'e2'))
  assert.equal(o.pipeline_id, idDe('pipeline', 'p1'))
  assert.equal(o.cambio_etapa_en, '2026-01-20T15:00:00.000Z')
  assert.ok(r.avisos.includes('1 oportunidades sin su contacto en la copia'))
  assert.ok(r.avisos.includes('1 oportunidades con una etapa que no está en su pipeline'))
  assert.ok(r.avisos.includes('1 conversaciones sin su contacto en la copia'))
})

test('mensajes: canal, tipo, dirección, texto plano y lo que pasó con el envío', () => {
  const r = transformar(copia())
  const m = (id: string) => r.mensajes.find((x) => x.externo_id === id)!
  assert.equal(r.mensajes.length, 7)

  assert.deepEqual([m('m1').canal, m('m1').tipo, m('m1').direccion, m('m1').texto], ['whatsapp', 'mensaje', 'entrante', 'Hola, ¿precio?'])
  assert.deepEqual(m('m1').meta, { estado: 'leido' })
  assert.deepEqual(m('m2').meta, { estado: 'fallo', error: 'Número no válido' })

  // El correo: la dirección viene en meta.email y el HTML se va
  assert.deepEqual([m('m3').canal, m('m3').tipo, m('m3').direccion, m('m3').asunto], ['correo', 'correo', 'saliente', 'Tu propuesta'])
  assert.equal(m('m3').texto, 'Hola Lucía & equipo\nSaludos')

  assert.deepEqual([m('m4').canal, m('m4').tipo, m('m4').texto], ['llamada', 'llamada', null])
  assert.deepEqual(m('m4').meta, { llamada: { estado: 'contestada', segundos: 95 } })

  // El evento, en palabras sencillas y sin dirección
  assert.deepEqual([m('m5').canal, m('m5').tipo, m('m5').direccion, m('m5').texto], ['sistema', 'actividad', null, 'Oportunidad movida a «Segunda etapa»'])
  assert.deepEqual(m('m5').meta, { actividad: 'opportunity_stage_updated' })
  assert.equal(m('m6').canal, 'sms')
  for (const x of r.mensajes) assert.equal(x.id, idDe('mensaje', x.externo_id!))
})

test('conversaciones: el canal y la fecha son los del último mensaje de verdad (no los eventos)', () => {
  const r = transformar(copia())
  const v1 = r.conversaciones.find((c) => c.externo_id === 'v1')!
  assert.equal(v1.canal, 'llamada')
  assert.equal(v1.ultimo_mensaje_en, '2026-03-03T15:00:00.000Z')
  assert.equal(v1.sin_leer, 2)
  assert.equal(v1.creado_en, '2026-01-10T15:00:00.000Z')
  assert.equal(r.conversaciones.length, 2)
})

test('adjuntos: los bajados se suben y el mensaje los enlaza; los que no se pudieron bajar quedan marcados', () => {
  const r = transformar(copia())
  assert.equal(r.adjuntos.length, 1)
  const a = r.adjuntos[0]
  assert.equal(a.id, idDe('adjunto', 'm6:0'))
  assert.equal(a.mensaje_id, idDe('mensaje', 'm6'))
  assert.equal(a.archivo, 'adjuntos/v1/m6-0.jpg')
  assert.equal(a.ruta, `ghl/${idDe('contacto', 'c1')}/${a.id}.jpg`)
  assert.equal(a.tipo, 'image/jpeg')
  assert.equal(a.nombre, 'foto-2026-02-28.jpg')
  const enMensaje = r.mensajes.find((x) => x.externo_id === 'm6')!.adjuntos
  assert.deepEqual(enMensaje, [{ id: a.id, nombre: 'foto-2026-02-28.jpg', tipo: 'image/jpeg' }])
  const perdido = r.mensajes.find((x) => x.externo_id === 'm2')!.adjuntos
  assert.deepEqual(perdido, [{ id: null, nombre: 'documento-2026-03-01.pdf', tipo: 'application/pdf', perdido: true }])
})

test('identidades: teléfono, correo y los números de WhatsApp; uno compartido queda con el más reciente', () => {
  const r = transformar(copia())
  const de = (ghl: string) =>
    r.identidades
      .filter((i) => i.contacto_id === idDe('contacto', ghl))
      .map((i) => `${i.canal}:${i.valor}`)
      .sort()
  assert.deepEqual(de('c1'), ['correo:lucia@ejemplo.test', 'telefono:+50670000001', 'whatsapp:+50670000001', 'whatsapp:+50670000009'])
  assert.deepEqual(de('c2'), ['telefono:+13055550100'])
  // c3 también escribió desde +50670000009, pero c1 tiene actividad más reciente
  assert.deepEqual(de('c3'), ['telefono:+50670000003'])
  assert.ok(r.avisos.some((a) => a.startsWith('1 teléfonos o correos que ya eran de otro contacto')))
})

test('citas: estado, enlace solo si es una dirección web y las borradas afuera', () => {
  const r = transformar(copia())
  assert.equal(r.citas.length, 2)
  const a1 = r.citas.find((c) => c.ghl_id === 'a1')!
  assert.equal(a1.estado, 'no_asistio')
  assert.equal(a1.enlace, 'https://videollamada.test/abc')
  assert.equal(a1.inicio, '2026-03-10T16:00:00.000Z')
  const a2 = r.citas.find((c) => c.ghl_id === 'a2')!
  assert.equal(a2.titulo, 'Cita')
  assert.equal(a2.enlace, null)
  assert.equal(a2.estado, 'confirmada')
})

test('volver a transformar la misma copia da los mismos ids (la importación se puede repetir)', () => {
  const a = transformar(copia())
  const b = transformar(copia())
  assert.deepEqual(a, b)
})

test('canalDe: cada tipo de GoHighLevel a su canal', () => {
  const casos: [string, string, string][] = [
    ['TYPE_WHATSAPP', 'whatsapp', 'mensaje'],
    ['TYPE_CUSTOM_SMS', 'sms', 'mensaje'],
    ['TYPE_SMS', 'sms', 'mensaje'],
    ['TYPE_EMAIL', 'correo', 'correo'],
    ['TYPE_FACEBOOK', 'messenger', 'mensaje'],
    ['TYPE_INSTAGRAM', 'instagram', 'mensaje'],
    ['TYPE_CALL', 'llamada', 'llamada'],
    ['TYPE_ACTIVITY_APPOINTMENT', 'sistema', 'actividad'],
    ['TYPE_NO_SHOW', 'sistema', 'actividad'],
    ['TYPE_ALGO_NUEVO', 'otro', 'mensaje'],
  ]
  for (const [tipo, canal, clase] of casos) assert.deepEqual(canalDe(tipo), { canal, tipo: clase }, tipo)
})

test('textoActividad: los eventos en palabras sencillas', () => {
  const t = (type: string, data: Record<string, unknown> = {}) => textoActividad({ activity: { type, title: 'Original', data } })
  assert.equal(t('opportunity_created'), 'Oportunidad creada')
  assert.equal(t('opportunity_stage_updated', {}), 'Oportunidad cambiada')
  assert.equal(t('opportunity_status_updated', { status: 'won' }), 'Oportunidad marcada como ganada')
  assert.equal(t('appointment_created', { appointmentTitle: 'Llamada de prueba' }), 'Cita agendada: Llamada de prueba')
  assert.equal(t('appoitntment_cancelled'), 'Cita cancelada')
  assert.equal(t('payment_received', { amount: 1500, currency: 'USD' }), 'Pago recibido: $1,500')
  assert.equal(t('invoice_sent', { totalAmount: 97 }), 'Factura enviada por $97')
  assert.equal(t('contact_dnd_enabled'), 'Pidió no recibir más mensajes')
  assert.equal(t('algo_raro'), 'Original')
})

test('camposDe, estadoCita, iso y nombreAdjunto', () => {
  assert.deepEqual(camposDe([{ id: 'x', value: ['a', 'b'] }], new Map([['x', { id: 'x', name: 'Varios', fieldKey: 'contact.varios' }]])), {
    varios: { etiqueta: 'Varios', valor: 'a, b' },
  })
  assert.equal(estadoCita('showed'), 'asistio')
  assert.equal(estadoCita('cancelled'), 'cancelada')
  assert.equal(estadoCita('new'), 'nueva')
  assert.equal(iso(Date.parse('2026-01-01T00:00:00Z')), '2026-01-01T00:00:00.000Z')
  assert.equal(iso('2026-01-01T00:00:00-06:00'), '2026-01-01T06:00:00.000Z')
  assert.equal(iso('no es fecha'), null)
  assert.equal(iso(null), null)
  assert.equal(nombreAdjunto('https://x.test/a/b/9f8e.mp4?token=1', '2025-06-01T10:00:00.000Z'), 'video-2025-06-01.mp4')
  assert.equal(nombreAdjunto('https://x.test/a/nota-de-voz.ogg', '2025-06-01T10:00:00.000Z'), 'audio-2025-06-01.ogg')
  assert.equal(nombreAdjunto('https://x.test/a/sin-extension', '2025-06-01T10:00:00.000Z'), 'archivo-2025-06-01')
})
