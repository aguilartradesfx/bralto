// Pasa la copia de GoHighLevel (la que arma exportar-ghl.mjs) al CRM del panel: tablas crm_* y bucket «crm».
// Se puede volver a correr con una copia más nueva antes de cerrar GoHighLevel: cada cosa conserva su id (sale del
// id de GoHighLevel), así que actualiza en vez de duplicar, y no pisa lo que se cambió desde el panel (contactos,
// tareas y oportunidades con editado_en). Los adjuntos que ya están en el bucket no se vuelven a subir.
//   npm run crm:importar -- <carpeta de la copia>             → importa
//   npm run crm:importar -- <carpeta de la copia> --prueba    → solo transforma y cuenta, sin escribir
// Nunca imprime datos de contactos: solo cuántos hay.
import { readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { transformar } from '../../lib/crm/ghl.ts'
import type { AdjuntoImportado, CopiaGhl } from '../../lib/crm/ghl.ts'

const args = process.argv.slice(2)
const prueba = args.includes('--prueba')
const ruta = args.find((a) => !a.startsWith('--'))
if (!ruta) throw new Error('Falta la carpeta de la copia: npm run crm:importar -- <carpeta>')
const carpeta = resolve(ruta)
const leer = <T>(nombre: string): T => JSON.parse(readFileSync(join(carpeta, nombre), 'utf8')) as T

const BUCKET = 'crm'
const LOTE = 500

// Trae todas las filas de una consulta, de a 1000 (el máximo que devuelve la API)
async function todas<T>(consulta: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const filas: T[] = []
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await consulta(desde, desde + 999)
    if (error) throw new Error(error.message)
    filas.push(...(data ?? []))
    if (!data || data.length < 1000) return filas
  }
}

async function guardar(db: SupabaseClient, tabla: string, filas: object[], onConflict = 'id', ignoreDuplicates = false) {
  for (let i = 0; i < filas.length; i += LOTE) {
    const { error } = await db.from(tabla).upsert(filas.slice(i, i + LOTE), { onConflict, ignoreDuplicates })
    if (error) throw new Error(`${tabla}: ${error.message}`)
  }
  console.log(`  ${tabla}: ${filas.length}`)
}

// Ids de lo que se editó desde el panel: la importación no lo toca
async function editados(db: SupabaseClient, tabla: string): Promise<Set<string>> {
  const filas = await todas<{ id: string }>((desde, hasta) =>
    db.from(tabla).select('id').eq('origen', 'ghl').not('editado_en', 'is', null).range(desde, hasta),
  )
  return new Set(filas.map((f) => f.id))
}

async function subirAdjuntos(db: SupabaseClient, adjuntos: AdjuntoImportado[]) {
  const yaSubidos = new Set(
    (await todas<{ id: string }>((desde, hasta) => db.from('crm_adjuntos').select('id').eq('origen', 'ghl').range(desde, hasta))).map((f) => f.id),
  )
  const filas = adjuntos.map(({ archivo, ...fila }) => ({ ...fila, tamano: statSync(join(carpeta, archivo)).size }))
  const nuevos = adjuntos.filter((a) => !yaSubidos.has(a.id))
  let subidos = 0
  for (let i = 0; i < nuevos.length; i += 4) {
    await Promise.all(
      nuevos.slice(i, i + 4).map(async (a) => {
        const { error } = await db.storage
          .from(BUCKET)
          .upload(a.ruta, readFileSync(join(carpeta, a.archivo)), { contentType: a.tipo ?? 'application/octet-stream', upsert: true })
        if (error) throw new Error(`bucket ${BUCKET}: ${error.message}`)
        subidos++
      }),
    )
  }
  console.log(`  archivos subidos al bucket: ${subidos} (ya estaban: ${adjuntos.length - nuevos.length})`)
  await guardar(db, 'crm_adjuntos', filas)
}

async function contar(db: SupabaseClient, tabla: string): Promise<number> {
  const { count, error } = await db.from(tabla).select('id', { count: 'exact', head: true }).eq('origen', 'ghl')
  if (error) throw new Error(`${tabla}: ${error.message}`)
  return count ?? 0
}

async function main() {
  const copia: CopiaGhl = {
    contactos: leer('contactos.json'),
    campos: leer('campos.json'),
    pipelines: leer('pipelines.json'),
    oportunidades: leer('oportunidades.json'),
    conversaciones: leer('conversaciones.json'),
    citas: leer('citas.json'),
    adjuntos: leer('adjuntos.json'),
  }
  const resumen = leer<{ cuenta: Record<string, number> }>('resumen.json')
  const r = transformar(copia)
  console.log(`Copia: ${carpeta}`)
  console.log(
    `Para importar: ${r.contactos.length} contactos, ${r.notas.length} notas, ${r.tareas.length} tareas, ${r.pipelines.length} pipelines ` +
      `(${r.etapas.length} etapas), ${r.oportunidades.length} oportunidades, ${r.conversaciones.length} conversaciones, ` +
      `${r.mensajes.length} mensajes, ${r.citas.length} citas, ${r.adjuntos.length} adjuntos, ${r.identidades.length} identidades.`,
  )
  for (const aviso of r.avisos) console.log(`Aviso: ${aviso}`)
  if (prueba) return console.log('Prueba: no se escribió nada.')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  // Lo editado desde el panel se queda como está
  const [contactosEditados, tareasEditadas, oportunidadesEditadas] = await Promise.all([
    editados(db, 'crm_contactos'),
    editados(db, 'crm_tareas'),
    editados(db, 'crm_oportunidades'),
  ])
  const conservados = contactosEditados.size + tareasEditadas.size + oportunidadesEditadas.size
  if (conservados > 0) {
    console.log(`Editados en el panel (no se tocan): ${contactosEditados.size} contactos, ${tareasEditadas.size} tareas, ${oportunidadesEditadas.size} oportunidades.`)
  }

  console.log('Guardando…')
  await guardar(db, 'crm_pipelines', r.pipelines)
  await guardar(db, 'crm_etapas', r.etapas)
  await guardar(db, 'crm_contactos', r.contactos.filter((c) => !contactosEditados.has(c.id)))
  // Si el teléfono o el correo de alguien se cambió en el panel, el viejo de GoHighLevel no vuelve
  const identidades = r.identidades.filter((i) => !(contactosEditados.has(i.contacto_id) && (i.canal === 'telefono' || i.canal === 'correo')))
  await guardar(db, 'crm_identidades', identidades, 'canal,valor', true)
  await guardar(db, 'crm_notas', r.notas)
  await guardar(db, 'crm_tareas', r.tareas.filter((t) => !tareasEditadas.has(t.id)))
  await guardar(db, 'crm_oportunidades', r.oportunidades.filter((o) => !oportunidadesEditadas.has(o.id)))
  await guardar(db, 'crm_citas', r.citas)
  await guardar(db, 'crm_conversaciones', r.conversaciones)
  await guardar(db, 'crm_mensajes', r.mensajes)
  await subirAdjuntos(db, r.adjuntos)

  // Lo que quedó en la base contra lo que dice la copia
  const esperado: [string, string, number][] = [
    ['contactos', 'crm_contactos', resumen.cuenta.contactos],
    ['notas', 'crm_notas', resumen.cuenta.notas],
    ['tareas', 'crm_tareas', resumen.cuenta.tareas],
    ['oportunidades', 'crm_oportunidades', resumen.cuenta.oportunidades],
    ['conversaciones', 'crm_conversaciones', resumen.cuenta.conversaciones],
    ['mensajes', 'crm_mensajes', resumen.cuenta.mensajes],
    ['citas', 'crm_citas', resumen.cuenta.citas],
    ['adjuntos', 'crm_adjuntos', Object.keys(copia.adjuntos.mapa).length],
  ]
  console.log('\nEn la base (origen GoHighLevel) contra la copia:')
  let todoBien = true
  for (const [nombre, tabla, esperados] of esperado) {
    const hay = await contar(db, tabla)
    const ok = hay === esperados
    todoBien &&= ok
    console.log(`  ${ok ? 'ok' : 'NO CUADRA'}  ${nombre}: ${hay} de ${esperados}`)
  }
  const { count: identidadesEnBase } = await db.from('crm_identidades').select('id', { count: 'exact', head: true })
  console.log(`  identidades (teléfono, correo, WhatsApp): ${identidadesEnBase ?? 0}`)
  if (!todoBien) process.exitCode = 1
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
