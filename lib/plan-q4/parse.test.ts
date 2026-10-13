import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePlan, parseResumen, planBody, PlanParseError, splitRow, unescapeMd } from './parse.ts'

const FIXTURE = `# Plan Q4 2026 — prueba

## Qué construir

Instrucciones que el parser ignora.

### Pestaña Resumen

- **Meta:** \\$1–2K/mes de prueba
- **Presupuesto:** \\$10/mes
- **Hitos:** 3 oct arranque · 14 nov revisión · 5 dic cierre

---

# Parte 2 · Contenido del plan

## B0 — Foco · Lectura

### Contexto

Texto de lectura con un monto de \\$100.

## B1 — Campañas · Acción

### Tareas (seed)

| ID | Tarea | Responsable | Apoyo | Fecha | Tipo | Estado |
|----|-------|-------------|-------|-------|------|--------|
| B1-01 | Armar la campaña A \\| Leads: tope \\$5/día | Ale | Soshil | 2026-10-18 | única | pendiente |
| B1-02 | Publicar 5 Reels | Soshil | — | desde 2026-10-12 | semanal | — |
| B1-03 | Landing lista | Alina | — | 2026-10-07 | única | hecho |


### Contexto

#### Estructura

| Activo | Decisión |
|--------|----------|
| Pixel  | Reusar   |

## Decisiones · Lectura

### Contexto

Todo resuelto.
`

function problemsOf(source: string): string[] {
  try {
    parsePlan(source)
    return []
  } catch (error) {
    assert.ok(error instanceof PlanParseError)
    return error.problems
  }
}

const withRow = (row: string) => FIXTURE.replace(/\| B1-03 .*\n/, `${row}\n`)

test('parsePlan: bloques en orden, con clave, tipo y pestaña', () => {
  assert.deepEqual(parsePlan(FIXTURE).map((b) => [b.key, b.code, b.titulo, b.tipo]), [
    ['b0', 'B0', 'Foco', 'lectura'],
    ['b1', 'B1', 'Campañas', 'accion'],
    ['decisiones', null, 'Decisiones', 'lectura'],
  ])
})

test('parsePlan: el Contexto no incluye la tabla del seed', () => {
  const b1 = parsePlan(FIXTURE)[1]
  assert.match(b1.contexto, /^#### Estructura/)
  assert.doesNotMatch(b1.contexto, /B1-01/)
})

test('parsePlan: títulos sin escapes, apoyo vacío, semanales y hechas', () => {
  const [t1, t2, t3] = parsePlan(FIXTURE)[1].tareas
  assert.deepEqual(t1, {
    id: 'B1-01', bloque: 'b1', titulo: 'Armar la campaña A | Leads: tope $5/día',
    responsable: 'ale', apoyo: 'soshil', fecha: '2026-10-18', tipo: 'unica', estado: 'pendiente',
  })
  assert.deepEqual(t2, {
    id: 'B1-02', bloque: 'b1', titulo: 'Publicar 5 Reels',
    responsable: 'soshil', apoyo: null, fecha: '2026-10-12', tipo: 'semanal', estado: null,
  })
  assert.equal(t3.estado, 'hecho')
})

test('planBody guarda solo la Parte 2 y se vuelve a parsear igual', () => {
  const body = planBody(FIXTURE)
  assert.doesNotMatch(body, /Qué construir/)
  assert.deepEqual(parsePlan(body), parsePlan(FIXTURE))
})

test('parsePlan: errores de una fila, todos juntos y con su ubicación', () => {
  const problems = problemsOf(withRow('| B1-03 | Algo | Pedro | Ale | 2026-13-40 | única | listo |'))
  assert.ok(problems.some((p) => p.includes('B1 fila 3') && p.includes('responsable desconocido "Pedro"')))
  assert.ok(problems.some((p) => p.includes('fecha inválida')))
  assert.ok(problems.some((p) => p.includes('estado desconocido "listo"')))
})

test('parsePlan: id repetido o de otro bloque, semanal mal escrita, apoyo = responsable', () => {
  assert.ok(problemsOf(withRow('| B1-01 | Otra | Ale | — | 2026-10-20 | única | pendiente |')).some((p) => p.includes('id repetido B1-01')))
  assert.ok(problemsOf(withRow('| B2-01 | Otra | Ale | — | 2026-10-20 | única | pendiente |')).some((p) => p.includes('patrón B1-NN')))
  assert.ok(problemsOf(withRow('| B1-03 | Otra | Ale | — | desde 2026-10-12 | semanal | pendiente |')).some((p) => p.includes('no llevan estado')))
  assert.ok(problemsOf(withRow('| B1-03 | Otra | Ale | — | 2026-10-12 | semanal | — |')).some((p) => p.includes('llevan "desde')))
  assert.ok(problemsOf(withRow('| B1-03 | Otra | Ale | Ale | 2026-10-12 | única | pendiente |')).some((p) => p.includes('el apoyo es el mismo responsable')))
})

test('parsePlan: encabezado mal escrito y bloque de lectura con tareas', () => {
  assert.ok(problemsOf(FIXTURE.replace('## B0 — Foco · Lectura', '## B0 - Foco')).some((p) => p.includes('encabezado inválido')))
  assert.ok(problemsOf(FIXTURE.replace('## B1 — Campañas · Acción', '## B1 — Campañas · Lectura')).some((p) => p.includes('un bloque de lectura no lleva tareas')))
})

test('parseResumen: encabezado sin escapes y hitos con fecha del año del plan', () => {
  assert.deepEqual(parseResumen(FIXTURE), {
    encabezado: [
      { label: 'Meta', value: '$1–2K/mes de prueba' },
      { label: 'Presupuesto', value: '$10/mes' },
    ],
    hitos: [
      { fecha: '2026-10-03', titulo: 'Arranque' },
      { fecha: '2026-11-14', titulo: 'Revisión' },
      { fecha: '2026-12-05', titulo: 'Cierre' },
    ],
  })
  assert.equal(parseResumen(planBody(FIXTURE)), null)
})

test('parseResumen: un hito sin fecha legible es un error', () => {
  assert.throws(() => parseResumen(FIXTURE.replace('14 nov revisión', 'pronto revisión')), PlanParseError)
})

test('splitRow y unescapeMd', () => {
  assert.deepEqual(splitRow('| a | b \\| c | — |'), ['a', 'b \\| c', '—'])
  assert.equal(unescapeMd('b \\| c \\$5 \\[RESUELTO\\]'), 'b | c $5 [RESUELTO]')
})
