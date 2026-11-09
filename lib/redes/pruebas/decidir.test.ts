import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  avanzarGrupo,
  avisoGanadora,
  elegirGanadora,
  ESPERA_MS,
  GRACIA_MS,
  horaDeDecidir,
  puntaje,
  puntajesDelGrupo,
  type EfectosPrueba,
} from './decidir.ts'
import type { Metricas, Prueba, ResultadoPrueba } from './tipos.ts'
import type { Publicacion } from '../publicacion/tipos.ts'

const HORA = 3600_000
// La 5.ª versión salió el jueves 5 a las 22:00 de Costa Rica (04:00 UTC del viernes 6)
const T = Date.parse('2026-11-06T04:00:00.000Z')
// Las 5 versiones salieron ese jueves a las 8, 11, 14, 17 y 22 de Costa Rica
const SALIDAS = ['2026-11-05T14:00:00.000Z', '2026-11-05T17:00:00.000Z', '2026-11-05T20:00:00.000Z', '2026-11-05T23:00:00.000Z', '2026-11-06T04:00:00.000Z']
// Vence el domingo 8 a las 22:00 de Costa Rica; de noche no se decide, así que decide el lunes 9 a las 9:00
const DECIDE = T + ESPERA_MS + 11 * HORA

function version(n: number, extra: Partial<Publicacion> = {}): Publicacion {
  return {
    id: `fila-${n}`,
    titulo: `Prueba ${n}/5 · Radar`,
    tipo: 'reel',
    estado: 'publicado',
    publicar_en: SALIDAS[n - 1],
    texto: `Gancho ${n}\n\nComenta RADAR`,
    laminas: [],
    video_url: `v${n}.mp4`,
    portada_url: null,
    historias: [],
    colaborador: null,
    hecho_con_ia: true,
    facebook: false,
    comenta: { guia: 'radar', palabras: ['radar'], mensaje: 'm', respuestas: ['r'] },
    resultado: { instagram: { id: `media-${n}`, permalink: `https://www.instagram.com/reel/V${n}/`, en: SALIDAS[n - 1] } },
    intentos: 1,
    prueba: true,
    grupo: 'g-1',
    version: n,
    gancho: { tipo: 'pregunta', frase: `Gancho ${n}`, pantalla: `Gancho ${n}` },
    ...extra,
  }
}

const cinco = () => [1, 2, 3, 4, 5].map((n) => version(n))

function prueba(extra: Partial<Prueba> = {}): Prueba {
  return {
    grupo: 'g-1',
    titulo: 'Radar',
    origen: 'ia',
    estado: 'corriendo',
    facebook: true,
    decidir_en: new Date(T + ESPERA_MS).toISOString(),
    ganadora: null,
    resultado: {},
    intentos: 1,
    actualizado_en: '2026-11-06T04:05:00.000Z',
    ...extra,
  }
}

const medida = (views: number, skip: number | null, extra: Partial<Metricas> = {}): Metricas => ({
  views,
  reach: views,
  skip,
  promedioMs: 5000,
  shares: 0,
  saved: 0,
  leidas_en: '2026-11-09T04:00:00.000Z',
  ...extra,
})

// Efectos falsos: anotan cada llamada. `datos` da las métricas de cada media
function falsos(ahora: number, datos: Record<string, Metricas | 'sin_datos' | 'no_existe'>, over: Partial<EfectosPrueba> = {}) {
  const llamadas: string[] = []
  const guardados: Parameters<EfectosPrueba['guardar']>[1][] = []
  const avisos: string[] = []
  const e: EfectosPrueba = {
    async metricas(media) {
      llamadas.push(`metricas:${media}`)
      return datos[media] ?? 'sin_datos'
    },
    async borrar(media) {
      llamadas.push(`borrar:${media}`)
    },
    existe: async () => true,
    async publicarFacebook(p) {
      llamadas.push(`facebook:${p.id}`)
      return { postId: 'pagina_99', url: 'https://www.facebook.com/reel/99' }
    },
    async crearComentaFb(postId, p) {
      llamadas.push(`comentaFb:${postId}:${p.id}`)
      return 'auto-fb'
    },
    async guardar(_grupo, cambios) {
      guardados.push(structuredClone(cambios))
    },
    async avisar(texto) {
      avisos.push(texto)
    },
    ahora: () => ahora,
    ...over,
  }
  return { e, llamadas, guardados, avisos, ultimo: () => guardados.at(-1) }
}

const todas = (m: Record<number, Metricas | 'sin_datos' | 'no_existe'>) =>
  Object.fromEntries(Object.entries(m).map(([n, v]) => [`media-${n}`, v]))

test('puntaje: la gente que se quedó después de los primeros 3 segundos; sin el dato del gancho, no se inventa', () => {
  assert.equal(puntaje(medida(1000, 40)), 600)
  assert.equal(puntaje(medida(1000, null)), null)
})

test('elegirGanadora: si a una le falta el dato del gancho, se comparan todas por vistas (no se castiga a la que no lo trae)', () => {
  // Con el gancho, b ganaría (810 contra 0); sin el dato de a, gana la de más vistas
  assert.equal(elegirGanadora({ a: medida(1000, null), b: medida(900, 10) }), 'a')
  assert.equal(puntajesDelGrupo({ a: medida(1000, null), b: medida(900, 10) }).b, 900)
})

test('de noche no decide: vence a las 22:00 y espera a la mañana', async () => {
  const datos = todas({ 1: medida(1000, 70), 2: medida(1200, 40), 3: medida(800, 50), 4: medida(500, 20), 5: medida(300, 90) })
  const f = falsos(T + ESPERA_MS + 17 * 60_000, datos) // domingo 22:17
  const r = await avanzarGrupo(prueba(), cinco(), f.e)
  assert.equal(r, 'espera el día')
  assert.deepEqual(f.llamadas, [])
  assert.deepEqual(f.guardados, [])
  assert.equal(horaDeDecidir(T + ESPERA_MS + 17 * 60_000), false)
  assert.equal(horaDeDecidir(DECIDE), true) // lunes 9:00
  assert.equal(horaDeDecidir(T + ESPERA_MS - 2 * HORA + 17 * 60_000), true) // 20:17
})

test('sin versiones todavía (el script las está creando): no la cancela', async () => {
  const f = falsos(T, {})
  const r = await avanzarGrupo(prueba({ estado: 'programada', decidir_en: null }), [], f.e)
  assert.equal(r, 'sin versiones todavía')
  assert.deepEqual(f.guardados, [])
})

test('si el aviso no sale, no queda como enviado: la próxima corrida lo vuelve a mandar', async () => {
  const datos = todas({ 1: medida(1000, 70), 2: medida(1200, 40), 3: medida(800, 50), 4: medida(500, 20), 5: medida(300, 90) })
  const f = falsos(DECIDE, datos, {
    async avisar() {
      throw new Error('Telegram: HTTP 502')
    },
  })
  await assert.rejects(avanzarGrupo(prueba(), cinco(), f.e), /Telegram/)
  const ultimo = f.ultimo()!
  assert.equal(ultimo.resultado?.aviso, undefined)
  assert.equal(ultimo.resultado?.ganadora, 'fila-2')
  assert.notEqual(ultimo.estado, 'decidida')
})

test('elegirGanadora: el mayor puntaje; si empatan, más tiempo viéndola y después más compartidos y guardados', () => {
  assert.equal(elegirGanadora({ a: medida(1000, 40), b: medida(900, 10), c: medida(2000, 80) }), 'b')
  assert.equal(elegirGanadora({ a: medida(1000, 50, { promedioMs: 4000 }), b: medida(1000, 50, { promedioMs: 6000 }) }), 'b')
  assert.equal(elegirGanadora({ a: medida(1000, 50, { shares: 1, saved: 1 }), b: medida(1000, 50, { shares: 3 }) }), 'b')
  assert.equal(elegirGanadora({ a: medida(0, 40), b: medida(0, null) }), null)
})

test('pasa a corriendo: cuando salieron las 5, decide 72 h después de la última', async () => {
  const f = falsos(T + HORA, {})
  await avanzarGrupo(prueba({ estado: 'programada', decidir_en: null }), cinco(), f.e)
  assert.deepEqual(f.ultimo(), { estado: 'corriendo', decidir_en: new Date(T + ESPERA_MS).toISOString() })
  assert.deepEqual(f.llamadas, [])
})

test('programada: mientras falte alguna por salir, no cambia nada', async () => {
  const versiones = cinco()
  versiones[4] = version(5, { estado: 'programado', resultado: {} })
  const f = falsos(T, {})
  await avanzarGrupo(prueba({ estado: 'programada', decidir_en: null }), versiones, f.e)
  assert.deepEqual(f.guardados, [])
})

test('programada: si no salió ninguna (frenadas o con error), queda cancelada sin aviso', async () => {
  const versiones = [1, 2, 3, 4, 5].map((n) => version(n, { estado: 'error', resultado: {} }))
  const f = falsos(T + HORA, {})
  await avanzarGrupo(prueba({ estado: 'programada', decidir_en: null }), versiones, f.e)
  assert.equal(f.ultimo()?.estado, 'cancelada')
  assert.deepEqual(f.avisos, [])
})

test('todavía no: antes de las 72 h no lee métricas', async () => {
  const f = falsos(T + ESPERA_MS - HORA, {})
  await avanzarGrupo(prueba(), cinco(), f.e)
  assert.deepEqual(f.llamadas, [])
  assert.deepEqual(f.guardados, [])
})

test('decide: gana la de mayor puntaje, borra las otras 4, saca la ganadora en Facebook y avisa', async () => {
  const datos = todas({ 1: medida(1000, 70), 2: medida(1200, 40), 3: medida(800, 50), 4: medida(500, 20), 5: medida(300, 90) })
  const f = falsos(DECIDE, datos)
  await avanzarGrupo(prueba(), cinco(), f.e)
  const borradas = f.llamadas.filter((l) => l.startsWith('borrar:'))
  assert.deepEqual(borradas.sort(), ['borrar:media-1', 'borrar:media-3', 'borrar:media-4', 'borrar:media-5'])
  assert.deepEqual(
    f.llamadas.filter((l) => l.startsWith('facebook') || l.startsWith('comentaFb')),
    ['facebook:fila-2', 'comentaFb:pagina_99:fila-2'],
  )
  assert.equal(f.avisos.length, 1)
  const final = f.ultimo()!
  assert.equal(final.estado, 'decidida')
  assert.equal(final.ganadora, 'fila-2')
  assert.equal(final.resultado?.facebook?.automatizacion, 'auto-fb')
})

test('el aviso: título, la frase de las 10 personas, el enlace, el botón y una línea por versión con su hora', async () => {
  const datos = todas({ 1: medida(1000, 70), 2: medida(1240, 40), 3: medida(800, 50), 4: medida(500, 20), 5: medida(300, 90) })
  const f = falsos(DECIDE, datos)
  await avanzarGrupo(prueba(), cinco(), f.e)
  const aviso = f.avisos[0]
  assert.match(aviso, /Ganó la versión 2 de «Radar»/)
  assert.match(aviso, /de cada 10 personas, 6 se quedaron después del gancho/i)
  assert.match(aviso, /https:\/\/www\.instagram\.com\/reel\/V2\//)
  assert.match(aviso, /Compartir con seguidores/)
  assert.match(aviso, /2 · 11:00 a\. m\. · 1,240 vistas/)
  assert.match(aviso, /5 · 10:00 p\. m\. · 300 vistas/)
})

test('sin métricas espera: a las 72 h, si a una le faltan datos, no decide ni borra', async () => {
  const datos = todas({ 1: medida(1000, 70), 2: medida(1200, 40), 3: 'sin_datos', 4: medida(500, 20), 5: medida(300, 90) })
  const f = falsos(DECIDE, datos)
  const r = await avanzarGrupo(prueba(), cinco(), f.e)
  assert.equal(r, 'espera métricas')
  assert.equal(f.llamadas.filter((l) => l.startsWith('borrar')).length, 0)
  assert.deepEqual(f.avisos, [])
  // Lo que ya leyó queda guardado: si en la próxima lectura Meta falla, no se pierde
  assert.equal(typeof f.ultimo()?.resultado?.metricas?.['fila-1'], 'object')
})

test('sin métricas a las 96 h: decide con las que tienen datos', async () => {
  const datos = todas({ 1: medida(1000, 70), 2: medida(1200, 40), 3: 'sin_datos', 4: medida(500, 20), 5: medida(300, 90) })
  const f = falsos(DECIDE + GRACIA_MS, datos)
  await avanzarGrupo(prueba(), cinco(), f.e)
  assert.equal(f.ultimo()?.ganadora, 'fila-2')
  assert.equal(f.ultimo()?.estado, 'decidida')
})

test('sin métricas a las 96 h: si ninguna tiene datos, avisa y no borra nada', async () => {
  const datos = todas({ 1: 'sin_datos', 2: 'sin_datos', 3: 'sin_datos', 4: 'sin_datos', 5: 'sin_datos' })
  const f = falsos(DECIDE + GRACIA_MS, datos)
  await avanzarGrupo(prueba(), cinco(), f.e)
  assert.equal(f.llamadas.filter((l) => l.startsWith('borrar') || l.startsWith('facebook')).length, 0)
  assert.match(f.avisos[0], /ninguna versión de «Radar» tuvo vistas/i)
  assert.equal(f.ultimo()?.estado, 'decidida')
  assert.equal(f.ultimo()?.ganadora, null)
})

test('versión borrada a mano: queda fuera y no se intenta borrar', async () => {
  const datos = todas({ 1: medida(1000, 70), 2: medida(1200, 40), 3: 'no_existe', 4: medida(500, 20), 5: medida(300, 90) })
  const f = falsos(DECIDE, datos)
  await avanzarGrupo(prueba(), cinco(), f.e)
  assert.equal(f.ultimo()?.ganadora, 'fila-2')
  assert.equal(f.llamadas.includes('borrar:media-3'), false)
  assert.equal(f.llamadas.filter((l) => l.startsWith('borrar')).length, 3)
})

test('frenada a medias: salieron 2 y las otras quedaron en borrador; decide entre las 2', async () => {
  const versiones = cinco().map((v, i) =>
    i < 2 ? v : { ...v, estado: 'borrador' as const, resultado: {}, publicar_en: new Date(T - 5 * HORA).toISOString() },
  )
  const ultima = Date.parse(SALIDAS[1])
  const f = falsos(T, {})
  await avanzarGrupo(prueba({ estado: 'programada', decidir_en: null }), versiones, f.e)
  assert.deepEqual(f.ultimo(), { estado: 'corriendo', decidir_en: new Date(ultima + ESPERA_MS).toISOString() })

  const g = falsos(ultima + ESPERA_MS + HORA, todas({ 1: medida(500, 50), 2: medida(900, 30) }))
  await avanzarGrupo(prueba({ decidir_en: new Date(ultima + ESPERA_MS).toISOString() }), versiones, g.e)
  assert.equal(g.ultimo()?.ganadora, 'fila-2')
  assert.deepEqual(g.llamadas.filter((l) => l.startsWith('borrar')), ['borrar:media-1'])
})

test('segunda corrida no repite nada: con todo hecho, solo la deja decidida', async () => {
  const hecho: ResultadoPrueba = {
    metricas: { 'fila-1': medida(1, 1), 'fila-2': medida(9, 1), 'fila-3': medida(1, 1), 'fila-4': medida(1, 1), 'fila-5': medida(1, 1) },
    ganadora: 'fila-2',
    borradas: { 'fila-1': 'ok', 'fila-3': 'ok', 'fila-4': 'ok', 'fila-5': 'ok' },
    facebook: { postId: 'pagina_99', url: 'u', automatizacion: 'auto-fb' },
    aviso: '2026-11-09T05:00:00.000Z',
  }
  const f = falsos(DECIDE + HORA, {})
  await avanzarGrupo(prueba({ estado: 'decidiendo', resultado: hecho }), cinco(), f.e)
  assert.deepEqual(f.llamadas, [])
  assert.deepEqual(f.avisos, [])
  assert.equal(f.ultimo()?.estado, 'decidida')
})

test('ya decidida: no hace nada', async () => {
  const f = falsos(DECIDE + HORA, {})
  await avanzarGrupo(prueba({ estado: 'decidida' }), cinco(), f.e)
  assert.deepEqual(f.llamadas, [])
  assert.deepEqual(f.guardados, [])
})

test('un borrado falla: se anota, las demás se borran y el aviso lo dice', async () => {
  const datos = todas({ 1: medida(1000, 70), 2: medida(1200, 40), 3: medida(800, 50), 4: medida(500, 20), 5: medida(300, 90) })
  const f = falsos(DECIDE, datos, {
    async borrar(media) {
      if (media === 'media-4') throw new Error('Meta: no se pudo')
    },
  })
  await avanzarGrupo(prueba(), cinco(), f.e)
  const final = f.ultimo()!
  assert.equal(final.estado, 'decidida')
  assert.match(String(final.resultado?.borradas?.['fila-4']), /no se pudo/)
  assert.equal(final.resultado?.borradas?.['fila-1'], 'ok')
  assert.match(f.avisos[0], /no pude borrar 1 versión/i)
})

test('se comparan medidas al mismo tiempo: mientras falte una, la próxima corrida vuelve a leer todas', async () => {
  const antes: ResultadoPrueba = {
    metricas: { 'fila-1': medida(100, 50), 'fila-2': medida(100, 50), 'fila-3': 'sin_datos', 'fila-4': medida(100, 50), 'fila-5': medida(100, 50) },
  }
  const datos = todas({ 1: medida(2000, 50), 2: medida(1000, 50), 3: medida(1500, 50), 4: medida(900, 50), 5: medida(800, 50) })
  const f = falsos(DECIDE + HORA, datos)
  await avanzarGrupo(prueba({ resultado: antes }), cinco(), f.e)
  assert.equal(f.llamadas.filter((l) => l.startsWith('metricas:')).length, 5)
  const metricas = f.ultimo()?.resultado?.metricas
  assert.equal((metricas?.['fila-1'] as Metricas).views, 2000)
  assert.equal(f.ultimo()?.ganadora, 'fila-1')
})

test('si una lectura nueva falla, se conserva la última buena', async () => {
  const antes: ResultadoPrueba = {
    metricas: { 'fila-1': medida(3000, 10), 'fila-2': 'sin_datos', 'fila-3': medida(100, 50), 'fila-4': medida(100, 50), 'fila-5': medida(100, 50) },
  }
  const datos = todas({ 1: 'sin_datos', 2: medida(500, 50), 3: medida(100, 50), 4: medida(100, 50), 5: medida(100, 50) })
  const f = falsos(DECIDE + HORA, datos)
  await avanzarGrupo(prueba({ resultado: antes }), cinco(), f.e)
  assert.equal(f.ultimo()?.ganadora, 'fila-1')
})

test('borrado repetido: si Meta da error pero el reel ya no está, cuenta como borrado y el aviso no se queja', async () => {
  const datos = todas({ 1: medida(1000, 70), 2: medida(1200, 40), 3: medida(800, 50), 4: medida(500, 20), 5: medida(300, 90) })
  const f = falsos(DECIDE, datos, {
    async borrar(media) {
      if (media === 'media-4') throw new Error('Meta: does not exist')
    },
    existe: async (media) => media !== 'media-4',
  })
  await avanzarGrupo(prueba(), cinco(), f.e)
  assert.equal(f.ultimo()?.resultado?.borradas?.['fila-4'], 'ok')
  assert.doesNotMatch(f.avisos[0], /no pude borrar/i)
})

test('avisoGanadora sin datos del gancho no inventa la frase de las 10 personas', () => {
  const r: ResultadoPrueba = { metricas: { 'fila-1': medida(100, null) }, ganadora: 'fila-1' }
  const texto = avisoGanadora(prueba(), [version(1)], r)
  assert.doesNotMatch(texto, /de cada 10 personas/)
  assert.match(texto, /Ganó la versión 1/)
})
