import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  anchosEmbudo,
  armarEsperando,
  armarPulso,
  barrasMejor,
  clientesNuevos,
  contarTramos,
  contraAyer,
  elegirMejor,
  esEtapaDePropuesta,
  estadoItem,
  filaCaliente,
  fraseMejor,
  fuentesRevisadas,
  insignia,
  listos,
  marcasDelDia,
  ofrecerRespuestas,
  pieEsperando,
  porResponder,
  preguntaAprobar,
  resultadoAprobar,
  proximo,
  puntoRadar,
  reporteViejo,
  seguidoresDeLaSemana,
  serieSeguidores,
  suavizar,
  textoProximo,
  tramoDe,
  tramosHabituales,
  tuDia,
  visibles,
  whatsappConectado,
  type FilaBandeja,
  type Persona,
} from './armar.ts'
import type { ItemDia, PostIg } from './tipos.ts'

// Viernes 30 de octubre, 17:42 en Costa Rica (23:42 UTC)
const AHORA = new Date('2026-10-30T23:42:00Z')
const cr = (dia: string, hora: string) => new Date(`${dia}T${hora}:00-06:00`).toISOString()

test('clientes nuevos: cuenta los de hoy, los separa por canal y los compara con ayer', () => {
  const personas: Persona[] = [
    { clave: 'a', en: cr('2026-10-30', '09:10'), canal: 'Instagram' },
    { clave: 'b', en: cr('2026-10-30', '11:00'), canal: 'Sitio web' },
    { clave: 'c', en: cr('2026-10-30', '16:20'), canal: 'Instagram' },
    { clave: 'd', en: cr('2026-10-30', '00:05'), canal: 'WhatsApp' },
    { clave: 'e', en: cr('2026-10-29', '23:50'), canal: 'Instagram' }, // ayer
    { clave: 'f', en: cr('2026-10-29', '10:00'), canal: 'Messenger' }, // ayer
    { clave: 'g', en: cr('2026-10-28', '10:00'), canal: 'Messenger' }, // antier: no cuenta
  ]
  const c = clientesNuevos(personas, AHORA)
  assert.equal(c.hoy, 4)
  assert.equal(c.ayer, 2)
  assert.deepEqual(c.porCanal, [
    { canal: 'Instagram', total: 2 },
    { canal: 'WhatsApp', total: 1 },
    { canal: 'Sitio web', total: 1 },
  ])
  assert.equal(c.puntos.length, 4)
  // El último punto es el más nuevo
  assert.deepEqual(c.puntos[3], puntoRadar('c'))
})

test('clientes nuevos: sin nadie, los canales salen en cero y en su orden', () => {
  const c = clientesNuevos([], AHORA)
  assert.equal(c.hoy, 0)
  assert.deepEqual(
    c.porCanal.map((x) => x.canal),
    ['Instagram', 'WhatsApp', 'Sitio web'],
  )
})

test('cada persona cae siempre en el mismo lugar del radar', () => {
  const p = puntoRadar('8d0c1c9e-0000-4000-8000-000000000001')
  assert.deepEqual(puntoRadar('8d0c1c9e-0000-4000-8000-000000000001'), p)
  assert.ok(p.angulo >= 0 && p.angulo < 360)
  assert.ok(p.radio >= 0.3 && p.radio < 0.9)
  assert.notDeepEqual(puntoRadar('otra persona'), p)
})

test('contra ayer', () => {
  assert.deepEqual(contraAyer(12, 8), { texto: '4 más que ayer', sube: true })
  assert.deepEqual(contraAyer(1, 3), { texto: '2 menos que ayer', sube: false })
  assert.deepEqual(contraAyer(5, 5), { texto: 'Igual que ayer', sube: null })
})

const fila = (o: Partial<FilaBandeja> & { id: string }): FilaBandeja => ({
  nombre: 'Persona de prueba',
  canal: 'instagram',
  tipo: 'trabajo',
  ultimoEn: cr('2026-10-30', '17:00'),
  vistaPrevia: 'Hola',
  ultimoDeLaPersona: true,
  contactoId: null,
  pendiente: null,
  ...o,
})

test('te están esperando: las de trabajo sin responder y las que tienen algo de Knox, las más nuevas primero', () => {
  const filas = [
    fila({ id: '1', ultimoEn: cr('2026-10-30', '10:00') }),
    fila({ id: '2', tipo: 'personal' }), // personal: no
    fila({ id: '3', ultimoDeLaPersona: false }), // ya le contestaron: no
    fila({ id: '4', tipo: null, ultimoEn: cr('2026-10-30', '17:40'), pendiente: { id: 'd4', respuesta: '¡Hola!' } }),
    fila({ id: '5', ultimoEn: cr('2026-10-30', '12:00') }),
  ]
  assert.deepEqual(
    porResponder(filas).map((f) => f.id),
    ['4', '5', '1'],
  )
})

test('te están esperando: nombre, iniciales, insignia y las respuestas listas', () => {
  const filas = [
    fila({ id: '1', nombre: 'Ana Prueba', contactoId: 'c1', ultimoEn: cr('2026-10-30', '17:40'), vistaPrevia: '¿Me pueden llamar hoy?' }),
    fila({ id: '2', nombre: 'Café Ejemplo', contactoId: 'c2', ultimoEn: cr('2026-10-30', '17:24') }),
    fila({ id: '3', nombre: '@persona.tres', ultimoEn: cr('2026-10-30', '16:40') }),
    fila({ id: '4', nombre: 'Otra', ultimoEn: cr('2026-10-30', '08:00') }),
  ]
  const etiquetas = new Map([
    ['c1', ['lead', 'pidio-llamada']],
    ['c2', ['Lead']],
  ])
  const e = armarEsperando(filas, etiquetas, ['d1', 'd2'])
  assert.equal(e.total, 4)
  assert.equal(e.conversaciones.length, 3)
  assert.deepEqual(
    e.conversaciones.map((c) => [c.iniciales, c.insignia]),
    [
      ['AP', 'QUIERE LLAMADA'],
      ['CE', 'LEAD'],
      ['PT', null],
    ],
  )
  assert.equal(e.conversaciones[0].texto, '¿Me pueden llamar hoy?')
  assert.deepEqual(e.borradores, ['d1', 'd2'])
})

test('insignias y la fila que se resalta', () => {
  assert.equal(insignia(['pidio-llamada']), 'QUIERE LLAMADA')
  assert.equal(insignia([' LEAD ']), 'LEAD')
  assert.equal(insignia(['interesado-sesiones']), null)
  assert.equal(insignia(null), null)
  assert.equal(filaCaliente([{ insignia: 'LEAD' }, { insignia: 'QUIERE LLAMADA' }]), 1)
  assert.equal(filaCaliente([{ insignia: null }, { insignia: 'LEAD' }]), 0)
  assert.equal(filaCaliente([]), -1)
})

test('camino a la venta: las barras contra la más larga y las etapas de propuesta', () => {
  assert.deepEqual(anchosEmbudo({ llegaron: 48, conversando: 21, propuesta: 7, ganados: 1 }), {
    llegaron: 100,
    conversando: 44,
    propuesta: 15,
    ganados: 3,
  })
  assert.deepEqual(anchosEmbudo({ llegaron: 0, conversando: 0, propuesta: 0, ganados: 0 }), { llegaron: 0, conversando: 0, propuesta: 0, ganados: 0 })
  assert.equal(esEtapaDePropuesta('Propuesta enviada'), true)
  assert.equal(esEtapaDePropuesta('Cotización'), true)
  assert.equal(esEtapaDePropuesta('Reunión inicial'), false)
})

test('seguidores: la serie se arma hacia atrás desde el total y la semana suma los últimos 7 días', () => {
  const diarios = [3, 0, 2, 1, 0, 4, 1, 2, 5].map((valor, i) => ({ valor, fin: `2026-10-${String(21 + i).padStart(2, '0')}T07:00:00+0000` }))
  // Desordenados a propósito
  const serie = serieSeguidores(2418, [...diarios].reverse())
  assert.equal(serie.length, 10)
  assert.equal(serie[9], 2418)
  assert.equal(serie[8], 2413)
  assert.equal(serie[0], 2418 - 18)
  assert.equal(seguidoresDeLaSemana(diarios), 15)
})

const post = (o: Partial<PostIg> & { en: string }): PostIg => ({
  titulo: 'Un post',
  tipo: 'reel',
  imagen: null,
  enlace: null,
  vistas: 100,
  alcance: 80,
  ...o,
})

test('el que más gustó: el de más vistas de la semana, contra el alcance de los demás', () => {
  const posts = [
    post({ titulo: 'A', en: cr('2026-10-29', '10:00'), vistas: 300, alcance: 240 }),
    post({ titulo: 'B', en: cr('2026-10-28', '10:00'), vistas: 2200, alcance: 1800 }),
    post({ titulo: 'C', en: cr('2026-10-27', '10:00'), vistas: 500, alcance: 360 }),
    post({ titulo: 'Viejo', en: cr('2026-10-10', '10:00'), vistas: 9000, alcance: 8000 }),
  ]
  const m = elegirMejor(posts, AHORA)
  assert.ok(m)
  assert.equal(m.titulo, 'B')
  assert.equal(m.dias, 7)
  assert.equal(m.otros, 2)
  assert.equal(m.promedioOtros, 300)
  assert.equal(m.veces, 6)
  assert.deepEqual(fraseMejor(m), { antes: 'Llegó ', fuerte: '6 veces más lejos', despues: ' que tus otros posts.' })
  assert.deepEqual(barrasMejor(m), { este: 100, demas: 17 })
})

test('el que más gustó: sin posts en la semana busca en 30 días; sin posts, false; sin números, null', () => {
  const viejo = elegirMejor([post({ titulo: 'Viejo', en: cr('2026-10-10', '10:00') })], AHORA)
  assert.ok(viejo)
  assert.equal(viejo.dias, 30)
  assert.equal(viejo.otros, 0)
  assert.deepEqual(fraseMejor(viejo), { antes: 'Es tu ', fuerte: 'único post', despues: ' de estos 30 días.' })
  assert.equal(elegirMejor([], AHORA), false)
  assert.equal(elegirMejor([post({ en: cr('2026-10-29', '10:00'), vistas: null })], AHORA), null)
})

test('la frase del que más gustó dice lo justo', () => {
  assert.equal(fraseMejor({ veces: 1.54, dias: 7, otros: 3 }).fuerte, '1,5 veces más lejos')
  assert.equal(fraseMejor({ veces: 12.4, dias: 7, otros: 3 }).fuerte, '12 veces más lejos')
  assert.equal(fraseMejor({ veces: 1.2, dias: 7, otros: 3 }).fuerte, 'un poco más lejos')
  assert.equal(fraseMejor({ veces: 0.8, dias: 7, otros: 3 }).fuerte, 'menos gente')
  assert.equal(fraseMejor({ veces: null, dias: 30, otros: 3 }).fuerte, 'este mes')
  assert.equal(barrasMejor({ alcance: 100, promedioOtros: 400 })?.este, 25)
  assert.equal(barrasMejor({ alcance: null, promedioOtros: 400 }), null)
})

test('tu día: citas, posts y tareas de hoy, en orden de hora', () => {
  const items = tuDia(
    {
      citas: [
        { titulo: 'Llamada de prueba', inicio: cr('2026-10-30', '09:30') },
        { titulo: 'Cita de mañana', inicio: cr('2026-10-31', '09:30') },
      ],
      posts: [
        { titulo: 'Post de la tarde', tipo: 'carrusel', estado: 'programado', publicar_en: cr('2026-10-30', '18:00') },
        { titulo: 'Reel de la mañana', tipo: 'reel', estado: 'publicado', publicar_en: cr('2026-10-30', '10:00') },
        { titulo: 'Cancelado', tipo: 'reel', estado: 'cancelado', publicar_en: cr('2026-10-30', '12:00') },
      ],
      tareas: [{ titulo: 'Revisar la propuesta', vence_en: cr('2026-10-30', '19:30'), hecha: false, contacto: 'Hotel de prueba' }],
    },
    AHORA,
  )
  assert.deepEqual(
    items.map((i) => [i.titulo, i.detalle]),
    [
      ['Llamada de prueba', null],
      ['Reel de la mañana', 'Reel · ya salió'],
      ['Post de la tarde', 'Carrusel · ya está programado'],
      ['Revisar la propuesta', 'Tarea · Hotel de prueba'],
    ],
  )
  assert.deepEqual(
    items.map((i) => estadoItem(i, AHORA).texto),
    ['Hecho', 'Hecho', 'En 18 min', 'Luego'],
  )
  assert.equal(listos(items, AHORA), 2)
  const siguiente = proximo(items, AHORA)
  assert.equal(siguiente?.titulo, 'Post de la tarde')
  assert.equal(textoProximo(siguiente!), 'sale el carrusel')
})

const item = (o: Partial<ItemDia> & { en: string }): ItemDia => ({ tipo: 'tarea', titulo: 'x', detalle: null, hecho: false, fallo: false, ...o })

test('tu día: lo que se quedó atrás y lo que está pasando', () => {
  assert.deepEqual(estadoItem(item({ tipo: 'cita', en: cr('2026-10-30', '17:20') }), AHORA), { texto: 'Ahora', clase: 'pronto' })
  assert.deepEqual(estadoItem(item({ tipo: 'post', en: cr('2026-10-30', '17:35') }), AHORA), { texto: 'Saliendo', clase: 'pronto' })
  assert.deepEqual(estadoItem(item({ tipo: 'post', en: cr('2026-10-30', '15:00') }), AHORA), { texto: 'Pendiente', clase: 'alerta' })
  assert.deepEqual(estadoItem(item({ tipo: 'post', en: cr('2026-10-30', '15:00'), fallo: true }), AHORA), { texto: 'No salió', clase: 'alerta' })
  assert.deepEqual(estadoItem(item({ en: cr('2026-10-30', '12:00') }), AHORA), { texto: 'Pendiente', clase: 'alerta' })
  assert.deepEqual(estadoItem(item({ en: cr('2026-10-30', '17:42') }), AHORA), { texto: 'Pendiente', clase: 'alerta' })
  assert.deepEqual(estadoItem(item({ en: cr('2026-10-30', '18:41') }), AHORA), { texto: 'En 59 min', clase: 'pronto' })
})

test('tu día: caben 4, con lo último que pasó y lo que viene', () => {
  const horas = ['08:00', '09:00', '10:00', '11:00', '18:00', '19:00', '20:00']
  const items = horas.map((h, i) => item({ en: cr('2026-10-30', h), titulo: h, hecho: i < 4 }))
  assert.deepEqual(
    visibles(items, AHORA).map((i) => i.titulo),
    ['11:00', '18:00', '19:00', '20:00'],
  )
  const temprano = horas.map((h) => item({ en: cr('2026-10-30', h), titulo: h }))
  assert.deepEqual(
    visibles(temprano, new Date(cr('2026-10-30', '07:00'))).map((i) => i.titulo),
    ['08:00', '09:00', '10:00', '11:00'],
  )
  const todoListo = horas.map((h) => item({ en: cr('2026-10-30', h), titulo: h, hecho: true }))
  assert.deepEqual(
    visibles(todoListo, AHORA).map((i) => i.titulo),
    ['11:00', '18:00', '19:00', '20:00'],
  )
  assert.equal(proximo(todoListo, AHORA), null)
})

test('pulso: los tramos de 30 minutos van de 6:00 a 23:00, en hora de Costa Rica', () => {
  assert.equal(tramoDe(cr('2026-10-30', '06:00')), 0)
  assert.equal(tramoDe(cr('2026-10-30', '06:29')), 0)
  assert.equal(tramoDe(cr('2026-10-30', '06:30')), 1)
  assert.equal(tramoDe(cr('2026-10-30', '17:42')), 23)
  assert.equal(tramoDe(cr('2026-10-30', '22:59')), 33)
  assert.equal(tramoDe(cr('2026-10-30', '23:00')), null)
  assert.equal(tramoDe(cr('2026-10-30', '05:59')), null)
  const v = contarTramos([cr('2026-10-30', '06:10'), cr('2026-10-30', '06:20'), cr('2026-10-29', '06:10'), cr('2026-10-30', '23:30')], '2026-10-30')
  assert.equal(v.length, 34)
  assert.equal(v[0], 2)
  assert.equal(v.reduce((s, x) => s + x, 0), 2)
})

test('pulso: el día de siempre es el promedio de los 7 días anteriores', () => {
  const instantes = [cr('2026-10-29', '10:05'), cr('2026-10-28', '10:10'), cr('2026-10-23', '10:00'), cr('2026-10-22', '10:00'), cr('2026-10-30', '10:00')]
  const h = tramosHabituales(instantes, '2026-10-30')
  // Del 23 al 29: tres en el tramo de las 10:00 (el 22 queda fuera y el de hoy no cuenta)
  assert.equal(h[8], Math.round((3 / 7) * 100) / 100)
  assert.equal(h.reduce((s, x) => s + x, 0), h[8])
})

test('pulso: lo de hoy hasta ahora, las personas nuevas y las marcas del día', () => {
  const marcas = marcasDelDia(
    {
      posts: [
        { titulo: 'x', tipo: 'reel', estado: 'publicado', publicar_en: cr('2026-10-30', '10:00') },
        { titulo: 'y', tipo: 'carrusel', estado: 'cancelado', publicar_en: cr('2026-10-30', '12:00') },
      ],
      citas: [{ titulo: 'z', inicio: cr('2026-10-30', '15:00') }],
      propuestas: [cr('2026-10-30', '19:30'), cr('2026-10-29', '19:30')],
    },
    AHORA,
  )
  assert.deepEqual(
    marcas.map((m) => [m.tipo, m.etiqueta]),
    [
      ['post', 'Reel'],
      ['cita', 'Cita'],
      ['propuesta', 'Propuesta'],
    ],
  )
  const p = armarPulso(
    {
      mensajes: [cr('2026-10-30', '10:05'), cr('2026-10-30', '18:30'), cr('2026-10-29', '10:05')],
      personas: [{ clave: 'a', en: cr('2026-10-30', '10:20'), canal: 'Instagram' }],
      marcas,
    },
    AHORA,
  )
  assert.equal(p.hoy[8], 2) // el mensaje de las 10:05 y la persona de las 10:20
  assert.equal(p.hoy[25], 0) // lo de las 18:30 todavía no pasó
  assert.equal(p.habitual[8], Math.round((1 / 7) * 100) / 100)
  assert.deepEqual(p.clientes, [cr('2026-10-30', '10:20')])
  assert.deepEqual(suavizar([0, 4, 0]), [1, 2, 1])
})

test('conexiones, modo y reporte', () => {
  assert.equal(whatsappConectado([{ platform: 'instagram' }, { platform: 'whatsapp', isActive: true }]), true)
  assert.equal(whatsappConectado([{ platform: 'whatsapp', needsReconnection: true }]), false)
  assert.equal(whatsappConectado([{ platform: 'instagram' }]), false)
  const seis = { cambio: null, redes: null, leads: null, agenda: null, conversaciones: null, contenido: null }
  assert.equal(fuentesRevisadas({ ...seis, faltan: [] }), 6) // los reportes de antes del correo
  assert.equal(fuentesRevisadas({ ...seis, correos: null, faltan: [] }), 7)
  assert.equal(fuentesRevisadas({ ...seis, correos: null, faltan: ['agenda'] }), 6)
  assert.equal(fuentesRevisadas(undefined), 0)
  // Con más de una hora, Knox vuelve a revisar
  assert.equal(reporteViejo({ fecha: '2026-10-30', creadoEn: cr('2026-10-30', '16:50') }, AHORA), false)
  assert.equal(reporteViejo({ fecha: '2026-10-30', creadoEn: cr('2026-10-30', '16:40') }, AHORA), true)
  assert.equal(reporteViejo({ fecha: '2026-10-30', creadoEn: cr('2026-10-30', '06:00') }, AHORA), true)
  assert.equal(reporteViejo({ fecha: '2026-10-29', creadoEn: cr('2026-10-29', '23:59') }, new Date(cr('2026-10-30', '00:30'))), true)
})

test('los textos de las respuestas de Knox', () => {
  assert.equal(pieEsperando(3, 5), 'Knox ya tiene las 3 respuestas listas')
  assert.equal(pieEsperando(1, 1), 'Knox ya tiene la respuesta lista')
  assert.equal(pieEsperando(0, 2), 'Ver todos los mensajes')
  assert.equal(pieEsperando(0, 0), 'Abrir los mensajes')
  assert.deepEqual(ofrecerRespuestas(3), { dice: 'Tengo 3 respuestas listas.', pregunta: '¿Les escribo yo?' })
  assert.deepEqual(ofrecerRespuestas(1), { dice: 'Tengo 1 respuesta lista.', pregunta: '¿Le escribo yo?' })
  assert.equal(preguntaAprobar(3), '¿Mando las 3 respuestas de Knox?')
  assert.equal(preguntaAprobar(1), '¿Mando la respuesta de Knox?')
  assert.equal(resultadoAprobar({ enviadas: 3, fallidas: 0 }), 'Listo: mandé las 3 respuestas.')
  assert.equal(resultadoAprobar({ enviadas: 1, fallidas: 0 }), 'Listo: mandé la respuesta.')
  assert.equal(resultadoAprobar({ enviadas: 2, fallidas: 1 }), 'Mandé 2. 1 no se pudo: contéstale desde Mensajes.')
  assert.equal(resultadoAprobar({ enviadas: 1, fallidas: 2 }), 'Mandé 1. 2 no se pudieron: contéstales desde Mensajes.')
  assert.equal(resultadoAprobar({ enviadas: 0, fallidas: 2 }), 'No pude mandar ninguna de las 2. Contéstales desde Mensajes.')
  assert.equal(resultadoAprobar({ enviadas: 0, fallidas: 0 }), 'Esas respuestas ya no estaban pendientes.')
})
