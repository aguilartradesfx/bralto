// Carga el Plan Q4 en Supabase desde el archivo del plan (por defecto plan-q4-admin.md en la raíz, fuera de git).
// Se puede correr las veces que haga falta: inserta las tareas nuevas y en las existentes solo actualiza el título.
//   npm run plan:seed                  → carga
//   npm run plan:seed -- --dry-run     → solo valida y muestra qué haría
//   npm run plan:seed -- ruta/plan.md  → otro archivo
// Enlaza a cada persona con su usuario del panel según PLAN_Q4_EMAILS="ale:correo,soshil:correo" (.env.local).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { parsePlan, parseResumen, planBody, PlanParseError } from '../lib/plan-q4/parse.ts'
import { PLAN_TEAM, parseTeamEmails, planSeedChanges, type ExistingTask } from '../lib/plan-q4/seed.ts'
import { PERSONA_NAMES } from '../lib/plan-q4/types.ts'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const file = resolve(args.find((a) => !a.startsWith('--')) ?? 'plan-q4-admin.md')

async function main() {
  const source = readFileSync(file, 'utf8')
  const blocks = parsePlan(source)
  const resumen = parseResumen(source)
  const tasks = blocks.flatMap((b) => b.tareas)
  console.log(`${file}\n${blocks.length} bloques, ${tasks.length} tareas en el archivo.`)
  if (resumen) console.log(`Resumen: ${resumen.encabezado.length} datos de encabezado, ${resumen.hitos.length} hitos.`)
  else console.log('Aviso: no hay "### Pestaña Resumen"; el encabezado del Resumen queda como estaba.')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: existing, error: existingError } = await db.from('plan_tasks').select('id, titulo, origen')
  if (existingError) throw existingError
  const changes = planSeedChanges(tasks, (existing ?? []) as ExistingTask[])
  console.log(`Tareas: ${changes.nuevas.length} nuevas, ${changes.renombradas.length} con título nuevo, ${changes.sinCambios} sin cambios.`)
  if (changes.choques.length > 0) {
    console.log(`Choques (el id ya lo usa una tarea creada en el panel; no se tocaron): ${changes.choques.join(', ')}. Renumerá esas filas en el archivo.`)
  }
  if (changes.soloEnBase.length > 0) console.log(`En la base pero no en el archivo (no se borran): ${changes.soloEnBase.join(', ')}`)
  if (dryRun) {
    console.log('--dry-run: no se escribió nada.')
    return
  }

  // 1. Equipo, enlazado a su usuario del panel cuando su correo está en PLAN_Q4_EMAILS
  const { error: teamError } = await db
    .from('plan_team')
    .upsert(PLAN_TEAM.map(({ slug, rol }) => ({ slug, nombre: PERSONA_NAMES[slug], rol })))
  if (teamError) throw teamError
  const emails = parseTeamEmails(process.env.PLAN_Q4_EMAILS)
  const { data: { users }, error: usersError } = await db.auth.admin.listUsers({ perPage: 1000 })
  if (usersError) throw usersError
  for (const { slug } of PLAN_TEAM) {
    const email = emails[slug]
    const userId = email ? users.find((u) => u.email?.toLowerCase() === email)?.id : undefined
    if (!userId) {
      console.log(`· ${PERSONA_NAMES[slug]}: ${email ? 'no hay usuario del panel con ese correo' : 'sin correo en PLAN_Q4_EMAILS'} (queda como estaba)`)
      continue
    }
    const { error } = await db.from('plan_team').update({ user_id: userId }).eq('slug', slug)
    if (error) throw error
    console.log(`· ${PERSONA_NAMES[slug]}: enlazado a su usuario`)
  }

  // 2. Contenido de las pestañas y encabezado del Resumen
  const { error: contentError } = await db.from('plan_content').upsert({
    id: 1,
    markdown: planBody(source),
    ...(resumen && { resumen }),
    actualizado_en: new Date().toISOString(),
  })
  if (contentError) throw contentError

  // 3. Tareas
  if (changes.nuevas.length > 0) {
    const { error } = await db.from('plan_tasks').insert(changes.nuevas)
    if (error) throw error
  }
  for (const t of changes.renombradas) {
    const { error } = await db.from('plan_tasks').update({ titulo: t.titulo }).eq('id', t.id)
    if (error) throw error
  }
  console.log('Listo.')
}

main().catch((error) => {
  console.error(error instanceof PlanParseError ? error.message : error)
  process.exitCode = 1
})
