import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseGuia } from './guia.ts'
import { PlanParseError } from './parse.ts'

const FIXTURE = `# Plan de prueba

## Qué construir

Texto de la Parte 1 que la guía ignora.

# Guía para el equipo

Nota para quien edita: esto no se muestra.

## Qué es esto

Es el plan del trimestre. Aquí ves **qué toca**.

## Qué vamos a hacer

Dos negocios:

- Uno
- Otro

## Etapas

### Octubre

Preparar todo.

### Noviembre

Lanzar.

## Equipo

### Ale

Decide y aprueba.

### Alina

Llamadas y seguimiento.

## Estrategia

- La idea: B0, B1
- Calendario y decisiones: B12, Decisiones

## Áreas

- B2: Precios
- B10: Guiones y videos

---

# Parte 2 · Contenido del plan

## B0 — Foco · Lectura
`

test('parseGuia: textos, etapas, equipo, grupos y áreas', () => {
  assert.deepEqual(parseGuia(FIXTURE), {
    queEs: 'Es el plan del trimestre. Aquí ves **qué toca**.',
    queVamos: 'Dos negocios:\n\n- Uno\n- Otro',
    etapas: { octubre: 'Preparar todo.', noviembre: 'Lanzar.' },
    equipo: { ale: 'Decide y aprueba.', alina: 'Llamadas y seguimiento.' },
    grupos: [
      { titulo: 'La idea', bloques: ['b0', 'b1'] },
      { titulo: 'Calendario y decisiones', bloques: ['b12', 'decisiones'] },
    ],
    areas: { b2: 'Precios', b10: 'Guiones y videos' },
  })
})

test('parseGuia: sin la sección devuelve null', () => {
  assert.equal(parseGuia('# Plan\n\n# Parte 2\n\n## B0 — Foco · Lectura\n'), null)
})

test('parseGuia: secciones desconocidas, personas que no existen y meses inválidos son errores', () => {
  assert.throws(() => parseGuia(FIXTURE.replace('## Áreas', '## Otra cosa')), PlanParseError)
  assert.throws(() => parseGuia(FIXTURE.replace('### Alina', '### Pedro')), PlanParseError)
  assert.throws(() => parseGuia(FIXTURE.replace('### Noviembre', '### Brumario')), PlanParseError)
  assert.throws(() => parseGuia(FIXTURE.replace('- B2: Precios', '- Precios')), PlanParseError)
})
