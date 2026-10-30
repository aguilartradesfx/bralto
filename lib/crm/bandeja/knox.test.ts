import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { ContextoKnox, DecisionKnox, MensajeParaKnox, ModoKnox } from '../../knox/conversar/tipos.ts'
import { atenderMensaje, ESPERA_MS, pausada, textoAviso, type ConversacionKnox, type DecisionNueva, type DepsKnox, type EntradaKnox } from './knox.ts'

// Todo inventado. Viernes 30 de octubre de 2026, 15:00 en Costa Rica
const AHORA = new Date('2026-10-30T21:00:00Z')
const hace = (min: number) => new Date(AHORA.getTime() - min * 60_000).toISOString()

const decisionDe = (cambios: Partial<DecisionKnox> = {}): DecisionKnox => ({
  tipo: 'trabajo',
  accion: 'responder',
  respuesta: '¡Hola, Ana! Soy Knox, el asistente de Ale 🤖 Le aviso para que te escriba.',
  aviso: 'Ana quiere una web para su panadería',
  etiquetas: ['Lead'],
  datos: { nombre: 'Ana', negocio: 'Panadería Inventada', necesidad: 'una web' },
  motivo: 'Quiere cotizar una web',
  ...cambios,
})

interface Mundo {
  modo: ModoKnox
  conv: ConversacionKnox
  ultimo: string // el último mensaje de la persona
  mensajes: MensajeParaKnox[]
  decision: DecisionKnox | Error
  propia: boolean
  avisoLibre: boolean
  envio: { ok: true; mensajeId: string } | { ok: false; error: string }
  // lo que pasó
  esperas: number[]
  decisiones: (DecisionNueva & { id: string })[]
  enviadas: { decisionId: string; mensajeId: string | null }[]
  errores: { decisionId: string; error: string }[]
  enviados: { conversacionId: string; texto: string }[]
  avisos: string[]
  tipos: string[]
  contactosCreados: number
  etiquetas: { contactoId: string; etiquetas: string[] }[]
  contextos: ContextoKnox[]
  alEsperar?: (m: Mundo) => void
  alDecidir?: (m: Mundo) => void
}

function mundo(cambios: Partial<Mundo> = {}): Mundo {
  return {
    modo: 'ensayo',
    conv: { id: 'conv-1', canal: 'instagram', nombre: 'Ana Prueba', usuario: 'ana.prueba', contactoId: null, pausadoHasta: null, ultimoEntranteEn: hace(1) },
    ultimo: 'msg-1',
    mensajes: [{ autor: 'persona', texto: 'Hola, ¿cuánto cuesta una web?', adjunto: null, en: hace(1) }],
    decision: decisionDe(),
    propia: false,
    avisoLibre: true,
    envio: { ok: true, mensajeId: 'msg-knox' },
    esperas: [],
    decisiones: [],
    enviadas: [],
    errores: [],
    enviados: [],
    avisos: [],
    tipos: [],
    contactosCreados: 0,
    etiquetas: [],
    contextos: [],
    ...cambios,
  }
}

function deps(m: Mundo): DepsKnox {
  return {
    ahora: () => AHORA,
    esperar: async (ms) => {
      m.esperas.push(ms)
      m.alEsperar?.(m)
    },
    ajustes: async () => ({ modo: m.modo, ficha: 'Ficha inventada' }),
    esPropia: async () => m.propia,
    conversacion: async (id) => (id === m.conv.id ? { ...m.conv } : null),
    ultimoEntrante: async () => m.ultimo,
    mensajes: async () => m.mensajes,
    contacto: async () => ({ etiquetas: ['cliente'], notas: ['Nota inventada'], oportunidadesAbiertas: 1 }),
    decidir: async (ctx) => {
      m.contextos.push(ctx)
      m.alDecidir?.(m)
      if (m.decision instanceof Error) throw m.decision
      return m.decision
    },
    guardarDecision: async (d) => {
      const id = `dec-${m.decisiones.length + 1}`
      m.decisiones.push({ ...d, id })
      return id
    },
    marcarEnviada: async (decisionId, mensajeId) => {
      m.enviadas.push({ decisionId, mensajeId })
    },
    anotarError: async (decisionId, error) => {
      m.errores.push({ decisionId, error })
    },
    guardarTipo: async (_id, tipo) => {
      m.tipos.push(tipo)
    },
    crearContacto: async () => {
      m.contactosCreados++
      return 'contacto-nuevo'
    },
    agregarEtiquetas: async (contactoId, etiquetas) => {
      m.etiquetas.push({ contactoId, etiquetas })
    },
    enviar: async (conversacionId, texto) => {
      m.enviados.push({ conversacionId, texto })
      return m.envio
    },
    reservarAviso: async () => m.avisoLibre,
    avisar: async (texto) => {
      m.avisos.push(texto)
    },
  }
}

const entrada = (cambios: Partial<EntradaKnox> = {}): EntradaKnox => ({
  conversacionId: 'conv-1',
  mensajeId: 'msg-1',
  standby: false,
  interactivo: false,
  remitente: { id: '1000000000000001', usuario: 'ana.prueba', telefono: null },
  ...cambios,
})

test('pausada: hasta una fecha futura o para siempre (infinity)', () => {
  assert.equal(pausada(null, AHORA), false)
  assert.equal(pausada(hace(-60), AHORA), true)
  assert.equal(pausada(hace(60), AHORA), false)
  assert.equal(pausada('infinity', AHORA), true)
})

test('apagado, otra app, botón, cuenta propia o conversación pausada: Knox no hace nada', async () => {
  const casos: [Partial<Mundo>, Partial<EntradaKnox>, string][] = [
    [{ modo: 'apagado' }, {}, 'apagado'],
    [{}, { standby: true }, 'otra app tiene el control'],
    [{}, { interactivo: true }, 'respuesta de botón'],
    [{ propia: true }, {}, 'cuenta propia'],
    [{ conv: { ...mundo().conv, pausadoHasta: hace(-120) } }, {}, 'pausada'],
    [{ conv: { ...mundo().conv, pausadoHasta: 'infinity' } }, {}, 'pausada'],
  ]
  for (const [cambios, e, esperado] of casos) {
    const m = mundo(cambios)
    assert.equal(await atenderMensaje(deps(m), entrada(e)), esperado)
    assert.equal(m.contextos.length, 0, esperado)
    assert.equal(m.decisiones.length, 0, esperado)
    assert.equal(m.enviados.length, 0, esperado)
  }
})

test('espera la ráfaga: si entró otro mensaje de la persona, ese se encarga', async () => {
  const m = mundo({ alEsperar: (x) => (x.ultimo = 'msg-2') })
  assert.equal(await atenderMensaje(deps(m), entrada()), 'otro mensaje se encarga')
  assert.deepEqual(m.esperas, [ESPERA_MS])
  assert.equal(m.contextos.length, 0)
})

test('si Ale contestó mientras esperaba (pausa o último mensaje suyo), Knox no decide', async () => {
  const pausa = mundo({ alEsperar: (x) => (x.conv.pausadoHasta = hace(-720)) })
  assert.equal(await atenderMensaje(deps(pausa), entrada()), 'pausada')
  const contesto = mundo({ mensajes: [...mundo().mensajes, { autor: 'ale', texto: 'Hola Ana', adjunto: null, en: hace(0) }] })
  assert.equal(await atenderMensaje(deps(contesto), entrada()), 'ya le contestaron')
  assert.equal(contesto.contextos.length, 0)
})

test('si Knox falla, queda la decisión con el error y no sale nada', async () => {
  const m = mundo({ decision: new Error('Claude no respondió') })
  assert.equal(await atenderMensaje(deps(m), entrada()), 'error')
  assert.equal(m.decisiones.length, 1)
  assert.equal(m.decisiones[0].estado, 'error')
  assert.equal(m.decisiones[0].error, 'Claude no respondió')
  assert.equal(m.decisiones[0].decision, null)
  assert.equal(m.enviados.length, 0)
  assert.equal(m.avisos.length, 0)
})

test('ensayo: el borrador queda pendiente, se crea el contacto con sus etiquetas y avisa por Telegram', async () => {
  const m = mundo()
  assert.equal(await atenderMensaje(deps(m), entrada()), 'borrador')
  const ctx = m.contextos[0]
  assert.deepEqual(ctx, { canal: 'instagram', nombre: 'Ana Prueba', usuario: 'ana.prueba', contacto: null, mensajes: m.mensajes })
  assert.deepEqual(m.tipos, ['trabajo'])
  assert.equal(m.contactosCreados, 1)
  assert.deepEqual(m.etiquetas, [{ contactoId: 'contacto-nuevo', etiquetas: ['lead'] }])
  assert.equal(m.decisiones.length, 1)
  const d = m.decisiones[0]
  assert.equal(d.estado, 'pendiente')
  assert.equal(d.modo, 'ensayo')
  assert.equal(d.respuesta, decisionDe().respuesta)
  assert.equal(m.enviados.length, 0)
  assert.equal(m.avisos.length, 1)
  assert.match(m.avisos[0], /Knox · Instagram · Ana Prueba/)
  assert.match(m.avisos[0], /Ana quiere una web para su panadería/)
  assert.match(m.avisos[0], /Te dejé esta respuesta: «¡Hola, Ana!/)
  assert.match(m.avisos[0], /https:\/\/admin\.bralto\.io\/crm\/mensajes\/conv-1$/)
})

test('ensayo: con contacto, le pasa su contexto y no crea otro', async () => {
  const m = mundo({ conv: { ...mundo().conv, contactoId: 'contacto-1' } })
  await atenderMensaje(deps(m), entrada())
  assert.deepEqual(m.contextos[0].contacto, { etiquetas: ['cliente'], notas: ['Nota inventada'], oportunidadesAbiertas: 1 })
  assert.equal(m.contactosCreados, 0)
  assert.deepEqual(m.etiquetas, [{ contactoId: 'contacto-1', etiquetas: ['lead'] }])
})

test('silencio (personal): se guarda, sin contacto nuevo, sin borrador y sin aviso', async () => {
  const m = mundo({ decision: decisionDe({ tipo: 'personal', accion: 'silencio', respuesta: null, aviso: null, etiquetas: [] }) })
  assert.equal(await atenderMensaje(deps(m), entrada()), 'silencio')
  assert.deepEqual(m.tipos, ['personal'])
  assert.equal(m.contactosCreados, 0)
  assert.deepEqual(m.decisiones.map((d) => d.estado), ['silencio'])
  assert.equal(m.avisos.length, 0)
})

test('pasar a Ale: queda pendiente sin respuesta y avisa, en los dos modos', async () => {
  for (const modo of ['ensayo', 'automatico'] as const) {
    const m = mundo({ modo, decision: decisionDe({ accion: 'pasar_a_ale', respuesta: null, aviso: 'Está molesto con un pago' }) })
    assert.equal(await atenderMensaje(deps(m), entrada()), 'se la pasó a Ale')
    assert.equal(m.decisiones[0].estado, 'pendiente')
    assert.equal(m.decisiones[0].respuesta, null)
    assert.equal(m.enviados.length, 0)
    assert.equal(m.avisos.length, 1)
    assert.doesNotMatch(m.avisos[0], /respuesta/)
  }
})

test('máximo un aviso cada 30 minutos por conversación', async () => {
  const m = mundo({ avisoLibre: false })
  assert.equal(await atenderMensaje(deps(m), entrada()), 'borrador')
  assert.equal(m.decisiones.length, 1)
  assert.equal(m.avisos.length, 0)
})

test('automático: contesta solo dentro de las 24 horas y marca la decisión enviada', async () => {
  const m = mundo({ modo: 'automatico', decision: decisionDe({ aviso: null }) })
  assert.equal(await atenderMensaje(deps(m), entrada()), 'contestó')
  assert.deepEqual(m.enviados, [{ conversacionId: 'conv-1', texto: decisionDe().respuesta }])
  assert.deepEqual(m.enviadas, [{ decisionId: 'dec-1', mensajeId: 'msg-knox' }])
  assert.equal(m.decisiones[0].modo, 'automatico')
  // Sin aviso de Knox no hay Telegram
  assert.equal(m.avisos.length, 0)
})

test('automático: si hay aviso, también va por Telegram, con lo que ya le contestó', async () => {
  const m = mundo({ modo: 'automatico' })
  assert.equal(await atenderMensaje(deps(m), entrada()), 'contestó')
  assert.equal(m.avisos.length, 1)
  assert.match(m.avisos[0], /Ya le contesté: «/)
})

test('automático: pasadas las 24 horas no manda; queda el borrador con el porqué y avisa', async () => {
  const m = mundo({ modo: 'automatico', conv: { ...mundo().conv, ultimoEntranteEn: hace(25 * 60) }, decision: decisionDe({ aviso: null }) })
  assert.equal(await atenderMensaje(deps(m), entrada()), 'no pudo contestar')
  assert.equal(m.enviados.length, 0)
  assert.equal(m.decisiones[0].estado, 'pendiente')
  assert.equal(m.errores.length, 1)
  assert.match(m.errores[0].error, /24 horas/)
  assert.equal(m.avisos.length, 1)
  assert.match(m.avisos[0], /No la pude mandar/)
})

test('automático: si Zernio no lo manda, queda pendiente con el error', async () => {
  const m = mundo({ modo: 'automatico', envio: { ok: false, error: 'Zernio no lo pudo mandar ahora.' } })
  assert.equal(await atenderMensaje(deps(m), entrada()), 'no pudo contestar')
  assert.equal(m.enviadas.length, 0)
  assert.deepEqual(m.errores, [{ decisionId: 'dec-1', error: 'Zernio no lo pudo mandar ahora.' }])
})

test('si mientras Knox pensaba entró otro mensaje o contestó Ale, no guarda ni manda', async () => {
  const otro = mundo({ modo: 'automatico', alDecidir: (x) => (x.ultimo = 'msg-3') })
  assert.equal(await atenderMensaje(deps(otro), entrada()), 'otro mensaje se encarga')
  const ale = mundo({ modo: 'automatico', alDecidir: (x) => (x.conv.pausadoHasta = hace(-720)) })
  assert.equal(await atenderMensaje(deps(ale), entrada()), 'pausada')
  for (const m of [otro, ale]) {
    assert.equal(m.decisiones.length, 0)
    assert.equal(m.enviados.length, 0)
  }
})

test('si apagan a Knox mientras espera, no decide', async () => {
  const m = mundo({ alEsperar: (x) => (x.modo = 'apagado') })
  assert.equal(await atenderMensaje(deps(m), entrada()), 'apagado')
  assert.equal(m.contextos.length, 0)
})

test('textoAviso: sin nombre usa el @; sin aviso dice que es de trabajo', () => {
  const conv: ConversacionKnox = { id: 'conv-9', canal: 'whatsapp', nombre: null, usuario: null, contactoId: null, pausadoHasta: null, ultimoEntranteEn: null }
  const t = textoAviso({ conv, decision: decisionDe({ aviso: null, respuesta: null, accion: 'pasar_a_ale' }), enviada: false, error: null })
  assert.equal(t, '🤖 Knox · WhatsApp · Alguien\nTe escribió por trabajo.\nhttps://admin.bralto.io/crm/mensajes/conv-9')
  const ig = textoAviso({ conv: { ...conv, canal: 'instagram', usuario: 'beto.prueba' }, decision: decisionDe(), enviada: false, error: null })
  assert.match(ig, /^🤖 Knox · Instagram · @beto\.prueba\n/)
})
