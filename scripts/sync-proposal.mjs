import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const env = (() => {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    return Object.fromEntries(
      raw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const eq = line.indexOf('=')
          return [line.slice(0, eq), line.slice(eq + 1).replace(/^"|"$/g, '')]
        }),
    )
  } catch {
    return {}
  }
})()

const SUPABASE_URL = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: node scripts/sync-proposal.mjs <slug>')
  process.exit(1)
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const htmlPath = resolve(process.cwd(), `.local-backups/${slug}.original.html`)
const html = readFileSync(htmlPath, 'utf8')

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const { data, error } = await supabase
  .from('generated_proposals')
  .update({ html_content: html })
  .eq('slug', slug)
  .select('slug, client_name, expires_at')
  .single()

if (error) {
  console.error('Update failed:', error.message)
  process.exit(1)
}

console.log(`Updated proposal "${data.client_name}" (slug: ${data.slug}) — ${html.length.toLocaleString()} bytes`)
console.log(`Expires: ${new Date(data.expires_at).toLocaleString('es-CR')}`)
