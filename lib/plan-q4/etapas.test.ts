import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decisionesDelMes, etapaActual, parseEtapas, progresoEtapa, semanaContiene } from './etapas.ts'
import type { PlanBlock } from './parse.ts'
import type { PlanTask } from './types.ts'

const CALENDARIO = `Texto de arriba.

#### Octubre — preparar todo

| Semana       | Foco                                      | Hito             |
|--------------|-------------------------------------------|------------------|
| 5–11 oct     | Configurar la medición                    | —                |
| 12–18 oct    | **Encender la campaña:** \\$5/día \\| prueba | Campaña encendida |

#### Noviembre — lanzar

| Semana  | Foco            | Hito  |
|---------|-----------------|-------|
| 2–8 nov | Anunciar        | Abre  |

#### Puntos de decisión

| Cuándo | Pregunta                 | Qué se hace          |
|--------|--------------------------|----------------------|
| 26 oct | ¿Está decidido el nombre? | Si no, no se abre    |
`

const block = (contexto: string): PlanBlock => ({ key: 'b12', code: 'B12', titulo: 'Calendario', tipo: 'lectura', contexto, tareas: [] })

test('parseEtapas: meses, títulos, semanas con foco en markdown e hitos', () => {
  const { etapas, decisiones } = parseEtapas([block('Nada.'), block(CALENDARIO)])
  assert.deepEqual(etapas, [
    {
      mes: 10, nombreMes: 'Octubre', titulo: 'preparar todo',
      semanas: [
        { semana: '5–11 oct', foco: 'Configurar la medición', hito: null },
        { semana: '12–18 oct', foco: '**Encender la campaña:** \\$5/día | prueba', hito: 'Campaña encendida' },
      ],
    },
    { mes: 11, nombreMes: 'Noviembre', titulo: 'lanzar', semanas: [{ semana: '2–8 nov', foco: 'Anunciar', hito: 'Abre' }] },
  ])
  assert.deepEqual(decisiones, [{ cuando: '26 oct', pregunta: '¿Está decidido el nombre?', accion: 'Si no, no se abre' }])
})

test('parseEtapas: sin calendario no hay etapas', () => {
  assert.deepEqual(parseEtapas([block('Solo texto.')]), { etapas: [], decisiones: [] })
})

test('etapaActual: el mes de hoy; antes del plan la primera y después la última', () => {
  const { etapas } = parseEtapas([block(CALENDARIO)])
  assert.equal(etapaActual(etapas, '2026-10-13')?.mes, 10)
  assert.equal(etapaActual(etapas, '2026-11-02')?.mes, 11)
  assert.equal(etapaActual(etapas, '2026-09-20')?.mes, 10)
  assert.equal(etapaActual(etapas, '2026-12-20')?.mes, 11)
  assert.equal(etapaActual([], '2026-10-13'), null)
})

test('semanaContiene: rangos del calendario, también los que cruzan de mes', () => {
  assert.equal(semanaContiene('12–18 oct', '2026-10-13'), true)
  assert.equal(semanaContiene('12–18 oct', '2026-10-19'), false)
  assert.equal(semanaContiene('26 oct–1 nov', '2026-11-01'), true)
  assert.equal(semanaContiene('26 oct–1 nov', '2026-10-25'), false)
  assert.equal(semanaContiene('30 nov–6 dic', '2026-12-03'), true)
  assert.equal(semanaContiene('texto raro', '2026-10-13'), false)
})

test('decisionesDelMes: las que tienen fecha en el mes y las que no tienen fecha', () => {
  const decisiones = [
    { cuando: '26 oct', pregunta: 'A', accion: '' },
    { cuando: 'Día 7 de pauta', pregunta: 'B', accion: '' },
    { cuando: '20 nov', pregunta: 'C', accion: '' },
  ]
  const oct = decisionesDelMes(decisiones, 10)
  assert.deepEqual(oct.delMes.map((d) => d.pregunta), ['A'])
  assert.deepEqual(oct.sinFecha.map((d) => d.pregunta), ['B'])
  assert.deepEqual(decisionesDelMes(decisiones, 11).delMes.map((d) => d.pregunta), ['C'])
})

test('progresoEtapa: únicas del mes, hechas sobre total', () => {
  const t = (id: string, fecha: string, estado: PlanTask['estado'], tipo: PlanTask['tipo'] = 'unica'): PlanTask => ({
    id, bloque: 'b8', titulo: id, responsable: 'ale', apoyo: null, fecha, tipo, estado, nota: null, origen: 'plan', actualizado_por: null, actualizado_en: null,
  })
  const tasks = [t('a', '2026-10-02', 'hecho'), t('b', '2026-10-20', 'pendiente'), t('c', '2026-11-03', 'hecho'), t('d', '2026-10-12', null, 'semanal')]
  assert.deepEqual(progresoEtapa(tasks, 10), { hechas: 1, total: 2 })
  assert.deepEqual(progresoEtapa(tasks, 12), { hechas: 0, total: 0 })
})
