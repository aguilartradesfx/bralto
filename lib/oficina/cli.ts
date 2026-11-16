// Lectura de argumentos de «marcar» y validación del catálogo de «sembrar». Puro: sin base de datos.
import type { Agente, NuevaMarca, TipoMarca } from './tipos.ts'

const TIPOS: TipoMarca[] = ['empieza', 'termina', 'falla', 'pasa', 'entrega', 'publica', 'saltada']
const DONDE: Agente['donde'][] = ['servidor', 'sitio', 'zernio', 'asistente', 'mano']
const BANDERAS = ['--para', '--enlace', '--ref', '--dura']

export type Orden = { orden: 'estado' } | { orden: 'marcar', marca: NuevaMarca } | { error: string }

export function leerArgs(argv: string[]): Orden {
  if (argv.length === 1 && argv[0] === 'estado') return { orden: 'estado' }
  const [agente, tipo, texto, ...resto] = argv
  if (!agente) return { error: 'Falta el agente' }
  if (!tipo) return { error: 'Falta el tipo' }
  if (!TIPOS.includes(tipo as TipoMarca)) return { error: `Tipo desconocido: ${tipo}` }
  if (texto === undefined) return { error: 'Falta el texto' }
  if (!texto.trim()) return { error: 'El texto está vacío' }
  const marca: NuevaMarca = { agente, tipo: tipo as TipoMarca, texto }
  for (let i = 0; i < resto.length; i += 2) {
    const bandera = resto[i]
    if (!BANDERAS.includes(bandera)) return { error: `Opción desconocida: ${bandera}` }
    const valor = resto[i + 1]
    if (valor === undefined) return { error: `Falta el valor de ${bandera}` }
    if (bandera === '--para') marca.para = valor
    else if (bandera === '--enlace') marca.enlace = valor
    else if (bandera === '--ref') {
      const corte = valor.indexOf(':')
      if (corte < 1 || corte === valor.length - 1) return { error: '--ref debe ser tabla:id' }
      marca.ref_tabla = valor.slice(0, corte)
      marca.ref_id = valor.slice(corte + 1)
    } else {
      if (!/^\d+$/.test(valor)) return { error: '--dura debe ser un número entero de segundos, 0 o más' }
      marca.dura_seg = Number(valor)
    }
  }
  return { orden: 'marcar', marca }
}

const texto = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

export function validarAgentes(json: unknown): { ok: Agente[] } | { error: string } {
  if (!Array.isArray(json)) return { error: 'El catálogo debe ser una lista' }
  const ids = new Set<string>()
  const puestos = new Set<number>()
  const ok: Agente[] = []
  for (let i = 0; i < json.length; i++) {
    const a = json[i] as Record<string, unknown> | null
    const nombre = a && typeof a === 'object' && texto(a.id) ? `«${a.id}»` : `#${i}`
    if (!a || typeof a !== 'object' || Array.isArray(a)) return { error: `Agente ${nombre}: debe ser un objeto` }
    for (const campo of ['id', 'nombre', 'oficio', 'area']) {
      if (!texto(a[campo])) return { error: `Agente ${nombre}: falta ${campo}` }
    }
    if (!Number.isInteger(a.puesto) || (a.puesto as number) < 0 || (a.puesto as number) > 23) {
      return { error: `Agente ${nombre}: puesto debe ser un entero de 0 a 23` }
    }
    if (!DONDE.includes(a.donde as Agente['donde'])) {
      return { error: `Agente ${nombre}: donde debe ser ${DONDE.join(', ')}` }
    }
    if (a.estado_fijo !== undefined && a.estado_fijo !== null && a.estado_fijo !== 'pendiente' && a.estado_fijo !== 'pedido') {
      return { error: `Agente ${nombre}: estado_fijo debe ser pendiente, pedido o null` }
    }
    if (ids.has(a.id as string)) return { error: `Agente ${nombre}: id repetido` }
    if (puestos.has(a.puesto as number)) return { error: `Agente ${nombre}: puesto ${a.puesto} repetido` }
    ids.add(a.id as string)
    puestos.add(a.puesto as number)
    ok.push({
      id: a.id as string,
      nombre: a.nombre as string,
      oficio: a.oficio as string,
      area: a.area as string,
      puesto: a.puesto as number,
      aspecto: (a.aspecto ?? {}) as Agente['aspecto'],
      personalidad: (a.personalidad ?? '') as string,
      frase: (a.frase ?? '') as string,
      horario: (a.horario ?? null) as string | null,
      cada_minutos: (a.cada_minutos ?? null) as number | null,
      ruta: (a.ruta ?? null) as string | null,
      donde: a.donde as Agente['donde'],
      estado_fijo: (a.estado_fijo ?? null) as Agente['estado_fijo'],
      despierto_siempre: (a.despierto_siempre ?? false) as boolean,
      dura_min: (a.dura_min ?? 10) as number,
      ultima_revision: (a.ultima_revision ?? null) as string | null,
    })
  }
  return { ok }
}

// Filas para el upsert del catálogo: los campos del catálogo y activo, sin lo que mantiene el servidor (ultima_revision)
export function filasParaSembrar(agentes: Agente[]): Omit<Agente, 'ultima_revision'>[] & { activo: true }[] {
  return agentes.map(({ ultima_revision: _omitida, ...resto }) => ({ ...resto, activo: true as const }))
}
