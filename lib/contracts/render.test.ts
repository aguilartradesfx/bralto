import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderContractMarkdown } from './render.ts'

const template = readFileSync(join(import.meta.dirname, '../../templates/contract/v1.md'), 'utf-8')
const CLOSING_DATE = /el día \*\*(.*?)\*\* del mes de \*\*(.*?)\*\* del año \*\*(.*?)\*\*/
const AI_CONSUMPTION_CLAUSE = 'costos de consumo de servicios de terceros'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function contract(overrides: Record<string, unknown> = {}): any {
  return { servicios: { ads: true }, ...overrides }
}

function closingDate(markdown: string) {
  return markdown.match(CLOSING_DATE)?.slice(1)
}

test('sin firmar: la fecha de cierre es hoy en hora de Costa Rica', () => {
  // 01-oct 03:00 UTC = 30-sep 21:00 en Costa Rica
  const md = renderContractMarkdown(contract(), template, new Date('2026-10-01T03:00:00Z'))
  assert.deepEqual(closingDate(md), ['30', 'septiembre', '2026'])
})

test('firmado: la fecha de cierre es la de la firma del cliente', () => {
  const md = renderContractMarkdown(
    contract({ firma: { cliente_timestamp: '2026-05-14T16:00:00Z' } }),
    template,
    new Date('2026-09-30T12:00:00Z'),
  )
  assert.deepEqual(closingDate(md), ['14', 'mayo', '2026'])
})

test('una fecha explícita en los datos se respeta', () => {
  const md = renderContractMarkdown(contract({ firma: { dia: '5', mes: 'enero', anio: '2026' } }), template)
  assert.deepEqual(closingDate(md), ['5', 'enero', '2026'])
})

test('solo automatizaciones: sin cláusula de consumo de IA (regla vigente en producción)', () => {
  const md = renderContractMarkdown(contract({ servicios: { automatizaciones: true } }), template)
  assert.equal(md.includes(AI_CONSUMPTION_CLAUSE), false)
  assert.match(md, /### DÉCIMA TERCERA: TERMINACIÓN ANTICIPADA/)
})

test('agente de WhatsApp: incluye la cláusula de consumo de IA', () => {
  const md = renderContractMarkdown(contract({ servicios: { agente_whatsapp: true } }), template)
  assert.equal(md.includes(AI_CONSUMPTION_CLAUSE), true)
  assert.match(md, /### DÉCIMA CUARTA: TERMINACIÓN ANTICIPADA/)
})
