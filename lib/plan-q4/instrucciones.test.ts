import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseInstrucciones } from './instrucciones.ts'
import { PlanParseError } from './parse.ts'

const FIXTURE = `# Plan

# Instrucciones de las tareas

Nota para quien edita: no se muestra.

## B1-01 · Armar la campaña

### Qué es

La campaña de prueba, con **un solo** conjunto.

### Cómo hacerlo

1. Entrar al administrador de anuncios.
2. Crear la campaña.

## B1-02

### Qué es

Publicar los videos de la semana.

### Cómo hacerlo

- Cortar
- Subir

---

# Parte 2 · Contenido del plan

## B1 — Campañas · Acción
`

test('parseInstrucciones: qué es y cómo hacerlo de cada tarea', () => {
  assert.deepEqual(parseInstrucciones(FIXTURE), {
    'B1-01': {
      descripcion: 'La campaña de prueba, con **un solo** conjunto.',
      instrucciones: '1. Entrar al administrador de anuncios.\n2. Crear la campaña.',
    },
    'B1-02': { descripcion: 'Publicar los videos de la semana.', instrucciones: '- Cortar\n- Subir' },
  })
})

test('parseInstrucciones: sin la sección devuelve null', () => {
  assert.equal(parseInstrucciones('# Plan\n\n# Parte 2\n'), null)
})

test('parseInstrucciones: id mal escrito, repetido, sin alguna de las dos partes o con otra sección', () => {
  assert.throws(() => parseInstrucciones(FIXTURE.replace('## B1-02', '## B1 02')), PlanParseError)
  assert.throws(() => parseInstrucciones(FIXTURE.replace('## B1-02', '## B1-01')), PlanParseError)
  assert.throws(() => parseInstrucciones(FIXTURE.replace('### Cómo hacerlo\n\n- Cortar', '### Pasos\n\n- Cortar')), PlanParseError)
  assert.throws(() => parseInstrucciones(FIXTURE.replace('### Qué es\n\nPublicar los videos de la semana.\n\n', '')), PlanParseError)
})
