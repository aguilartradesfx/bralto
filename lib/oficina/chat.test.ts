import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { LineaTertulia, Marca, TipoMarca } from './tipos.ts'
import { CHAT_MAX, lineasDelChat, type LineaChat } from './chat.ts'

// Domingo 15/11/2026, 7:24 p. m. en Costa Rica (hoy empezó a las 06:00 UTC del 15)
const AHORA = new Date('2026-11-16T01:24:00.000Z')

function mk(agente: string, tipo: TipoMarca, creado_en: string, extra: Partial<Marca> = {}): Marca {
  return {
    id: `${agente}-${tipo}-${creado_en}`, agente, tipo, para: null, texto: `${tipo} de ${agente}`, enlace: null, ref_tabla: null,
    ref_id: null, dura_seg: null, extra: null, visto_en: null, creado_en, ...extra,
  }
}

function linea(id: string, de: string, mostrar_desde: string, extra: Partial<LineaTertulia> = {}): LineaTertulia {
  return { id, de, para: null, texto: `línea ${id}`, rincon: null, idea_id: null, mostrar_desde, ...extra }
}

test('el chat: las marcas que cuentan algo y la tertulia de hoy, por hora', () => {
  const marcas = [
    mk('beta', 'entrega', '2026-11-16T00:10:00Z', { texto: 'el plan de la semana' }), // 6:10 p. m.
    mk('alfa', 'pasa', '2026-11-15T20:00:00Z', { para: 'gama', texto: 'Te paso 2 temas' }), // 2:00 p. m.
    mk('alfa', 'empieza', '2026-11-15T19:00:00Z'), // empieza no sale
    mk('gama', 'saltada', '2026-11-15T22:00:00Z'), // saltada tampoco
    mk('delta', 'termina', '2026-11-15T03:00:00Z'), // ayer, 9:00 p. m.
    mk('delta', 'falla', '2026-11-16T01:00:00Z'), // 7:00 p. m.
    mk('eta', 'publica', '2026-11-15T23:00:00Z'), // 5:00 p. m.
    mk('eta', 'termina', '2026-11-15T14:00:00Z'), // 8:00 a. m.
  ]
  const tertulia = [
    linea('t1', 'gama', '2026-11-15T20:30:00Z', { para: 'alfa', idea_id: 'idea-1' }), // 2:30 p. m.
    linea('t0', 'beta', '2026-11-15T03:30:00Z'), // ayer
    linea('t2', 'beta', '2026-11-16T02:00:00Z'), // 8:00 p. m.: todavía no toca
  ]

  const l = lineasDelChat(marcas, tertulia, AHORA)

  assert.deepEqual(l.map((x) => [x.tipo, x.de, x.para]), [
    ['marca', 'eta', null], // 8:00 a. m. termina
    ['marca', 'alfa', 'gama'], // 2:00 p. m. pasa
    ['tertulia', 'gama', 'alfa'], // 2:30 p. m.
    ['marca', 'eta', null], // 5:00 p. m. publica
    ['marca', 'beta', 'ale'], // 6:10 p. m. entrega: para Ale
    ['marca', 'delta', null], // 7:00 p. m. falla
  ])
  const entrega = l.find((x) => x.de === 'beta')!
  assert.equal(entrega.texto, 'el plan de la semana')
  assert.equal(entrega.cuando, '2026-11-16T00:10:00Z')
  assert.equal(entrega.idea_id, null)
  const charla = l.find((x) => x.tipo === 'tertulia')!
  assert.deepEqual(charla, {
    id: 't1', de: 'gama', para: 'alfa', texto: 'línea t1', cuando: '2026-11-15T20:30:00Z', tipo: 'tertulia', idea_id: 'idea-1',
  })
})

test('el chat sin nada de hoy queda vacío', () => {
  assert.deepEqual(lineasDelChat([mk('alfa', 'termina', '2026-11-15T05:59:00Z')], [], AHORA), [])
})

test('el chat se queda con las 120 líneas más nuevas: marcas, tertulia y lo que dicen dormidos, juntos', () => {
  // 150 líneas, una por minuto desde las 6:00 a. m. de hoy, repartidas al azar (fijo) entre los tres tipos
  const base = Date.parse('2026-11-15T12:00:00Z')
  const iso = (min: number) => new Date(base + min * 60_000).toISOString()
  const minutos = Array.from({ length: 150 }, (_, i) => (i * 97) % 150) // una permutación de 0…149
  const marcas = minutos.slice(0, 90).map((m) => mk('alfa', 'termina', iso(m), { id: `m${m}` }))
  const tertulia = minutos.slice(90, 130).map((m) => linea(`t${m}`, 'beta', iso(m)))
  const suenos: LineaChat[] = minutos.slice(130).map((m) => ({ id: `s${m}`, de: 'gama', para: null, texto: 'Zzz', cuando: iso(m), tipo: 'sueno', idea_id: null }))

  const l = lineasDelChat(marcas, tertulia, AHORA, suenos)

  assert.equal(CHAT_MAX, 120)
  assert.equal(l.length, 120)
  // las que quedan son los minutos 30…149, de la más vieja a la más nueva
  assert.deepEqual(l.map((x) => Date.parse(x.cuando)), Array.from({ length: 120 }, (_, i) => base + (30 + i) * 60_000))
  assert.deepEqual(new Set(l.map((x) => x.tipo)), new Set(['marca', 'tertulia', 'sueno']))
})
