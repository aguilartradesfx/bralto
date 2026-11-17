import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { AgenteSnap, LineaVisita } from './tipos.ts'
import { repartirVisitas, textoVisita } from './visitas.ts'

const MIN = 60_000
// Lunes 16/11/2026, 10:00 a. m. en Costa Rica
const AHORA = new Date('2026-11-16T16:00:00Z')
const en = (min: number) => new Date(AHORA.getTime() + min * MIN).toISOString()

function ag(id: string, extra: Partial<AgenteSnap> = {}): AgenteSnap {
  return {
    id, nombre: id.charAt(0).toUpperCase() + id.slice(1), oficio: 'Oficio', area: 'Contenido', puesto: 0,
    aspecto: { tela: '#cccccc', ropa: '#333333', glifo: 'lineas' }, personalidad: '', frase: '', horario: null, cada_minutos: null,
    ruta: null, donde: 'sitio', estado_fijo: null, despierto_siempre: false, dura_min: 10, ultima_revision: null, lugar: null,
    estado: 'descansando', numeros: { tareas: 0, horas: 0, diasSinFallar: 0 }, semana: [], ...extra,
  }
}

// Una visita de `visitante` a la oficina de `anfitrion`: sus líneas se turnan, el visitante primero, en los minutos
// (desde AHORA) que se le pasan
function visita(hilo: string, visitante: string, anfitrion: string, minutos: number[]): LineaVisita[] {
  return minutos.map((m, i) => {
    const habla = i % 2 === 0 ? visitante : anfitrion
    return { id: `${hilo}-${i}`, de: habla, para: habla === visitante ? anfitrion : visitante, rincon: 'visita', donde: anfitrion, hilo, mostrar_desde: en(m) }
  })
}

const AGENTES = [ag('krono'), ag('lynx'), ag('quark')]
const repartir = (lineas: LineaVisita[], extra: Partial<Parameters<typeof repartirVisitas>[0]> = {}) =>
  repartirVisitas({ lineas, agentes: AGENTES, ahora: AHORA, dormida: false, ...extra })

test('el visitante está en la oficina del anfitrión desde 1 min antes de la primera línea hasta 4 min después de la última', () => {
  const lineas = visita('h1', 'krono', 'lynx', [0, 2, 3]) // de las 10:00 a las 10:03
  const r = repartir(lineas)
  assert.deepEqual(r, { krono: { anfitrion: 'lynx', hilo: 'h1', desde: en(-1), hasta: en(7) } })
  const a = (min: number) => repartir(lineas, { ahora: new Date(AHORA.getTime() + min * MIN) })
  assert.deepEqual(a(-1.5), {}, 'todavía no sale')
  assert.equal(a(-1).krono?.anfitrion, 'lynx', 'un minuto antes ya va caminando')
  assert.equal(a(6.9).krono?.anfitrion, 'lynx')
  assert.deepEqual(a(7), {}, 'cuatro minutos después de la última, ya volvió')
})

test('solo va si está libre, con la regla de la sala (no trabaja ni le toca trabajar en 10 min)', () => {
  const lineas = visita('h1', 'krono', 'lynx', [0, 1])
  for (const estado of ['descansando', 'listo', 'pedido'] as const) {
    assert.equal(repartir(lineas, { agentes: [ag('krono', { estado }), ag('lynx')] }).krono?.anfitrion, 'lynx', estado)
  }
  for (const estado of ['trabajando', 'publicando', 'a-medias', 'fallo'] as const) {
    assert.deepEqual(repartir(lineas, { agentes: [ag('krono', { estado }), ag('lynx')] }), {}, estado)
  }
  // le toca trabajar a las 10:08 (en 8 min): se queda en su escritorio
  assert.deepEqual(repartir(lineas, { agentes: [ag('krono', { horario: '8 16 * * *' }), ag('lynx')] }), {})
  // el anfitrión puede estar trabajando: lo visitan en su escritorio
  assert.equal(repartir(lineas, { agentes: [ag('krono'), ag('lynx', { estado: 'trabajando' })] }).krono?.anfitrion, 'lynx')
})

test('con la oficina dormida no hay visitas', () => {
  assert.deepEqual(repartir(visita('h1', 'krono', 'lynx', [0, 1]), { dormida: true }), {})
})

test('sin anfitrión (no está en el catálogo) o sin visitante, no hay visita', () => {
  assert.deepEqual(repartir(visita('h1', 'krono', 'fantasma', [0, 1])), {})
  assert.deepEqual(repartir(visita('h1', 'fantasma', 'lynx', [0, 1])), {})
})

test('una visita por visitante: la más nueva', () => {
  // la vieja todavía dura (termina a las 10:05 + 4) cuando empieza la nueva
  const vieja = visita('h-vieja', 'krono', 'lynx', [-3, -1, 1])
  const nueva = visita('h-nueva', 'krono', 'quark', [0.5, 2])
  for (const lineas of [[...vieja, ...nueva], [...nueva, ...vieja]]) {
    assert.deepEqual(Object.keys(repartir(lineas)), ['krono'])
    assert.equal(repartir(lineas).krono.anfitrion, 'quark')
    assert.equal(repartir(lineas).krono.hilo, 'h-nueva')
  }
})

test('dos visitas a la vez de distintos visitantes, cada uno donde va (también dos a la misma oficina)', () => {
  const agentes = [...AGENTES, ag('zap')]
  const r = repartir([...visita('h1', 'krono', 'lynx', [0, 1]), ...visita('h2', 'quark', 'zap', [0, 2])], { agentes })
  assert.deepEqual(Object.keys(r).sort(), ['krono', 'quark'])
  assert.equal(r.krono.anfitrion, 'lynx')
  assert.equal(r.quark.anfitrion, 'zap')
  const misma = repartir([...visita('h1', 'krono', 'lynx', [0, 1]), ...visita('h2', 'quark', 'lynx', [0, 2])])
  assert.deepEqual([misma.krono?.anfitrion, misma.quark?.anfitrion], ['lynx', 'lynx'])
})

test('no se ve la visita a quien anda en ese momento de visita en otra oficina', () => {
  // Quark busca a Krono, pero Krono anda donde Lynx: solo se ve la de Krono
  const r = repartir([...visita('h1', 'krono', 'lynx', [0, 1]), ...visita('h2', 'quark', 'krono', [0.5, 2])])
  assert.deepEqual(Object.keys(r), ['krono'])
  assert.equal(r.krono.anfitrion, 'lynx')
  // cuando Krono vuelve (4 min después de su última línea), la de Quark ya se ve
  const luego = repartir([...visita('h1', 'krono', 'lynx', [0, 1]), ...visita('h2', 'quark', 'krono', [3, 5])], { ahora: new Date(AHORA.getTime() + 5.5 * MIN) })
  assert.deepEqual(Object.keys(luego), ['quark'])
  // si Krono no está libre, su visita no se ve y él está en su oficina: la de Quark sí
  const ocupado = repartir([...visita('h1', 'krono', 'lynx', [0, 1]), ...visita('h2', 'quark', 'krono', [0.5, 2])], {
    agentes: [ag('krono', { estado: 'trabajando' }), ag('lynx'), ag('quark')],
  })
  assert.deepEqual(Object.keys(ocupado), ['quark'])
})

test('en una cadena, cada visita mira si su anfitrión está o no en su oficina', () => {
  // Zap busca a Quark, Quark a Krono y Krono a Lynx: Krono va donde Lynx, Quark se queda (Krono no está) y Zap lo encuentra
  const agentes = [...AGENTES, ag('zap')]
  const r = repartir([...visita('h1', 'krono', 'lynx', [0, 1]), ...visita('h2', 'quark', 'krono', [0.2, 1]), ...visita('h3', 'zap', 'quark', [0.4, 1])], { agentes })
  assert.deepEqual(Object.fromEntries(Object.entries(r).map(([id, v]) => [id, v.anfitrion])), { krono: 'lynx', zap: 'quark' })
})

test('si dos se visitan a la vez, se ve la más nueva', () => {
  const r = repartir([...visita('h1', 'krono', 'lynx', [-2, -1]), ...visita('h2', 'lynx', 'krono', [0, 1])])
  assert.deepEqual(Object.keys(r), ['lynx'])
  assert.equal(r.lynx.anfitrion, 'krono')
})

test('el visitante sale de la charla aunque la primera línea sea del anfitrión, y las líneas que no son de visita no cuentan', () => {
  const alReves: LineaVisita[] = [{ id: 'x', de: 'lynx', para: 'krono', rincon: 'visita', donde: 'lynx', hilo: 'h1', mostrar_desde: en(0) }]
  assert.equal(repartir(alReves).krono?.anfitrion, 'lynx')
  const cafe: LineaVisita[] = [{ id: 'y', de: 'krono', para: 'lynx', rincon: 'cafe', donde: null, hilo: 'h2', mostrar_desde: en(0) }]
  assert.deepEqual(repartir(cafe), {})
  const sinHilo: LineaVisita[] = [{ id: 'z', de: 'krono', para: 'lynx', rincon: 'visita', donde: 'lynx', hilo: null, mostrar_desde: en(0) }]
  assert.deepEqual(repartir(sinHilo), {})
})

test('lo que dice la ficha de quien está de visita', () => {
  assert.equal(textoVisita({ anfitrion: 'lynx' }, (id) => ({ lynx: 'Lynx' })[id] ?? id), 'De visita en la oficina de Lynx')
})
