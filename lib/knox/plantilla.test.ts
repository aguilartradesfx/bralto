import { test } from 'node:test'
import assert from 'node:assert/strict'
import { escribirPlantilla, paraVoz, sinSaludoNiFecha } from './plantilla.ts'
import type { Datos } from './tipos.ts'

const AHORA = new Date('2026-10-30T13:00:00Z') // viernes, 7:00 a. m. en Costa Rica

function datos(extra: Partial<Datos> = {}): Datos {
  return {
    cambio: { compra: 450.8, venta: 455.44, fecha: '2026-10-30' },
    redes: {
      instagram: [
        { usuario: 'cuenta.personal', seguidores: 4446, nuevosAyer: 2 },
        { usuario: 'cuenta.marca', seguidores: 11, nuevosAyer: null },
      ],
      facebook: [{ nombre: 'Página', seguidores: 1116, sinLeer: 1 }],
      mensajesIgSinLeer: 0,
      publicaciones: [
        { cuenta: 'cuenta.personal', titulo: 'Tu propio asistente 🤖', tipo: 'carrusel', en: '2026-10-30T16:00:00.000Z', enlace: null, vistas: 600, alcance: 184, meGusta: 10, comentarios: 3, guardados: 1, compartidos: 2 },
        { cuenta: 'cuenta.personal', titulo: 'El reel que más gustó', tipo: 'reel', en: '2026-10-29T00:48:00.000Z', enlace: null, vistas: 2145, alcance: 1355, meGusta: 60, comentarios: 6, guardados: 1, compartidos: 9 },
      ],
      comentarios: [{ usuario: 'alguien', texto: '¡Quiero la guía! 🔥', en: '2026-10-30T12:00:00.000Z', publicacion: 'Tu propio asistente' }],
    },
    leads: [{ nombre: 'María Pérez', origen: 'la guía JARVIS', en: '2026-10-30T11:00:00.000Z' }],
    agenda: [{ titulo: 'Diagnóstico con Juan', inicio: '2026-10-30T21:00:00.000Z' }],
    conversaciones: { sinLeer: 9, porCanal: { Messenger: 6, llamadas: 3 }, ultimas: [] },
    contenido: {
      hoy: [{ titulo: 'Herramientas', tipo: 'carrusel', en: '2026-10-31T00:00:00.000Z', hora: '6:00 p. m.', estado: 'programado' }],
      manana: 0,
    },
    faltan: [],
    ...extra,
  }
}

const texto = (d: Datos) => escribirPlantilla(d, AHORA).map((s) => s.texto).join(' ')

test('arranca directo con lo importante, sin saludo ni fecha (ya saludó el arranque), y termina con el cierre', () => {
  const secciones = escribirPlantilla(datos(), AHORA)
  assert.equal(secciones[0].tarjeta, 'cambio')
  assert.doesNotMatch(texto(datos()), /Buenos días|Hoy es|viernes|30 de octubre/)
  assert.equal(secciones.at(-1)?.tarjeta, 'cierre')
})

test('al saludo que escribe Claude le quita el saludo y la fecha, y deja el resumen del día', () => {
  assert.equal(sinSaludoNiFecha('Buenos días, Ale. Hoy es viernes 30 de octubre. Hoy viene movido: dos leads nuevos.'), 'Hoy viene movido: dos leads nuevos.')
  assert.equal(sinSaludoNiFecha('¡Hola, Ale! Es domingo 1 de noviembre y está tranquilo.'), '')
  assert.equal(sinSaludoNiFecha('Hoy viene tranquilo, con una cita en la tarde.'), 'Hoy viene tranquilo, con una cita en la tarde.')
  assert.equal(sinSaludoNiFecha('Buenas noches, Ale, te cuento.'), '')
})

test('cuenta los leads con su nombre y por dónde entraron', () => {
  assert.match(texto(datos()), /1 lead nuevo: María Pérez, por la guía JARVIS/)
  assert.match(texto(datos({ leads: [] })), /No entraron leads nuevos/)
})

test('avisa cuando mañana no hay nada programado', () => {
  assert.match(texto(datos()), /para mañana no hay nada programado/)
  const conManana = datos({ contenido: { hoy: [], manana: 2 } })
  assert.match(texto(conManana), /Para mañana hay 2 publicaciones listas/)
})

test('dice las citas con su hora hablada', () => {
  assert.match(texto(datos()), /Tienes 1 cita: hoy a las 3 de la tarde, Diagnóstico con Juan/)
  assert.match(texto(datos({ agenda: [] })), /No tienes citas para hoy ni para mañana/)
})

test('los mensajes sin leer van por canal y el dólar redondeado', () => {
  const t = texto(datos())
  assert.match(t, /9 conversaciones sin responder: 6 por Messenger y 3 por llamadas/)
  assert.match(t, /El dólar está a 455 colones para la venta y 451 para la compra/)
})

test('nombra la publicación más reciente y la mejor de la semana, sin emojis', () => {
  const t = texto(datos())
  assert.match(t, /«Tu propio asistente» lleva 600 vistas, 10 me gusta y 3 comentarios/)
  assert.match(t, /Lo que mejor va esta semana es el reel «El reel que más gustó», con 2145 vistas/)
  assert.doesNotMatch(t, /🤖|🔥/)
})

test('cuenta los correos sin leer sin leer de quién son (eso lo decide el escritor)', () => {
  const conCorreos = datos({ correos: { cuentas: ['a@ejemplo.test'], sinLeer: 4, recientes: [{ cuenta: 'a@ejemplo.test', de: 'Ana', asunto: 'Hola', resumen: '', en: '2026-10-30T12:00:00.000Z' }] } })
  const t = texto(conCorreos)
  assert.match(t, /4 correos sin leer de hoy/)
  assert.doesNotMatch(t, /Ana/)
  assert.doesNotMatch(texto(datos()), /correos sin leer/)
})

test('si el correo no respondió, lo dice en el cierre', () => {
  assert.match(texto(datos({ correos: null, faltan: ['correos'] })), /Hoy no pude leer tu correo/)
})

test('si una fuente no respondió, lo dice antes de despedirse y no inventa esa parte', () => {
  const d = datos({ cambio: null, faltan: ['cambio'] })
  const t = texto(d)
  assert.doesNotMatch(t, /dólar/)
  assert.match(t, /Hoy no pude leer el tipo de cambio/)
})

test('paraVoz quita emojis, símbolos y espacios de más', () => {
  assert.equal(paraVoz('Hola 👋  ₡455   ¡listo! ✅'), 'Hola 455 colones ¡listo!')
})
