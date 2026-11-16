// Carga el catálogo de agentes (un JSON fuera del repo) en oficina_agentes; actualiza por id.
//   npm run oficina:sembrar -- <ruta-del-json>
// Nunca imprime claves.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { validarAgentes } from '../../lib/oficina/cli.ts'
import { createServiceClient } from '../../lib/supabase/service.ts'

try {
  const ruta = process.argv[2]
  if (!ruta) throw new Error('Falta la ruta del JSON: npm run oficina:sembrar -- <ruta>')
  let json: unknown
  try {
    json = JSON.parse(readFileSync(resolve(ruta), 'utf8'))
  } catch (e) {
    throw new Error(`No pude leer el JSON: ${(e as Error).message}`)
  }
  const v = validarAgentes(json)
  if ('error' in v) throw new Error(v.error)
  const { error } = await createServiceClient()
    .from('oficina_agentes')
    .upsert(v.ok.map((a) => ({ ...a, activo: true })), { onConflict: 'id' })
  if (error) throw new Error(`oficina_agentes: ${error.message}`)
  console.log(`Sembré ${v.ok.length} agentes`)
} catch (e) {
  console.error((e as Error).message)
  process.exit(1)
}
