import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resumenSemanal, type GrupoDecidido } from './resumen.ts'
import type { TipoGancho } from '../publicacion/tipos.ts'

const AHORA = new Date('2026-11-29T15:00:00Z') // domingo 29, 9:00 en Costa Rica
const DIA = 86_400_000

// Un grupo de 5 versiones; gana la del tipo `gana`. `horas` son las de Costa Rica de un lunes (UTC−6)
function grupo(n: number, gana: TipoGancho, opciones: { hace?: number; horas?: number[]; puntajes?: number[] } = {}): GrupoDecidido {
  const tipos: TipoGancho[] = [gana, ...(['sorpresa', 'mito', 'advertencia', 'pregunta', 'lista'] as TipoGancho[]).filter((t) => t !== gana)].slice(0, 5)
  const horas = opciones.horas ?? [8, 11, 14, 17, 20]
  const puntajes = opciones.puntajes ?? [900, 400, 300, 200, 100]
  return {
    ganadora: `g${n}-v1`,
    decidida_en: new Date(AHORA.getTime() - (opciones.hace ?? 20) * DIA).toISOString(),
    versiones: tipos.map((tipo, i) => ({
      id: `g${n}-v${i + 1}`,
      publicar_en: new Date(Date.UTC(2026, 10, 9, horas[i] + 6)).toISOString(), // lunes 9 de noviembre
      tipo,
      puntaje: puntajes[i],
    })),
  }
}

test('resumen: muy pronto (menos de 2 semanas de datos) no manda nada', () => {
  assert.equal(resumenSemanal([], AHORA), null)
  assert.equal(resumenSemanal([grupo(1, 'pregunta', { hace: 5 }), grupo(2, 'mito', { hace: 3 })], AHORA), null)
})

test('resumen: dice qué tipo de gancho gana más', () => {
  const grupos = [
    grupo(1, 'pregunta'),
    grupo(2, 'pregunta'),
    grupo(3, 'pregunta'),
    grupo(4, 'pregunta'),
    grupo(5, 'mito'),
    grupo(6, 'lista'),
  ]
  const texto = resumenSemanal(grupos, AHORA)!
  assert.match(texto, /el gancho de pregunta ganó 4 de 6/i)
})

test('resumen: la mejor hora de cada día, por puntaje relativo a su grupo', () => {
  // Dos grupos el lunes: en los dos, la versión de las 17:00 (5:00 p. m.) queda cerca de la mejor
  const a = grupo(1, 'pregunta', { horas: [8, 11, 14, 17, 20], puntajes: [1000, 100, 100, 950, 100] })
  const b = grupo(2, 'mito', { horas: [9, 12, 15, 17, 21], puntajes: [10, 10, 10, 50, 10] })
  const texto = resumenSemanal([a, b], AHORA)!
  assert.match(texto, /lunes: 5:00 p\. m\./i)
})

test('resumen: después de 4 semanas cierra con la propuesta y no cambia nada solo', () => {
  const grupos = [grupo(1, 'pregunta', { hace: 30 }), grupo(2, 'pregunta'), grupo(3, 'mito')]
  const texto = resumenSemanal(grupos, AHORA)!
  assert.match(texto, /2 versiones con gancho de pregunta y 3 para seguir probando/)
  assert.ok(texto.trimEnd().endsWith('Contéstame si la aplico.'))
})

test('resumen: las primeras 4 semanas solo cuenta cómo va, sin proponer cambios', () => {
  const grupos = [grupo(1, 'pregunta', { hace: 20 }), grupo(2, 'pregunta'), grupo(3, 'mito')]
  const texto = resumenSemanal(grupos, AHORA)!
  assert.match(texto, /el gancho de pregunta ganó 2 de 3/i)
  assert.doesNotMatch(texto, /Propuesta/)
})
