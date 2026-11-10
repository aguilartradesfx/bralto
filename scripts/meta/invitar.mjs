// Crea el enlace para que un cliente conecte sus cuentas.
// Uso: node --env-file=.env.local scripts/meta/invitar.mjs "Nombre del cliente" [días] [es|en]
import { randomBytes } from 'node:crypto'

const [cliente, dias = '14', idioma = 'es'] = process.argv.slice(2)
if (!cliente || !Number.isInteger(Number(dias)) || Number(dias) < 1 || !['es', 'en'].includes(idioma)) {
  console.error('Uso: node --env-file=.env.local scripts/meta/invitar.mjs "Nombre del cliente" [días] [es|en]')
  process.exit(1)
}

const codigo = randomBytes(18).toString('base64url')
const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/meta_invitaciones`, {
  method: 'POST',
  headers: {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ codigo, cliente, expira_en: new Date(Date.now() + Number(dias) * 86_400_000).toISOString() }),
})
if (!r.ok) {
  console.error('No se pudo crear la invitación:', r.status, (await r.text()).slice(0, 300))
  process.exit(1)
}
console.log(`https://www.bralto.io/${idioma}/conectar/${codigo}`)
