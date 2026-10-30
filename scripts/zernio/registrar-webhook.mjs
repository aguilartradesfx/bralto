// Registra en Zernio el webhook de la bandeja (Instagram, Messenger y WhatsApp → /api/zernio/webhook). Se corre una
// sola vez, a mano, cuando ZERNIO_WEBHOOK_SECRET ya está en Vercel y el deploy con la bandeja está arriba. Si ya hay
// un webhook con esa URL, lo pone al día en vez de crear otro. Nunca imprime la clave ni el secreto.
//   node --env-file=.env.local scripts/zernio/registrar-webhook.mjs https://admin.bralto.io/api/zernio/webhook
//   node --env-file=.env.local scripts/zernio/registrar-webhook.mjs <url> --probar   → y manda el evento de prueba
const API = 'https://zernio.com/api/v1'
const NOMBRE = 'Bralto · bandeja del CRM'
const EVENTOS = ['message.received', 'message.sent', 'message.delivered', 'message.read', 'message.failed']

const args = process.argv.slice(2)
const url = args.find((a) => !a.startsWith('--'))
const probar = args.includes('--probar')
const clave = process.env.ZERNIO_API_KEY
const secreto = process.env.ZERNIO_WEBHOOK_SECRET

if (!url || !/^https:\/\/[^\s]+\/api\/zernio\/webhook$/.test(url)) {
  console.error('Uso: node --env-file=.env.local scripts/zernio/registrar-webhook.mjs https://admin.bralto.io/api/zernio/webhook [--probar]')
  process.exit(1)
}
if (!clave) throw new Error('Falta ZERNIO_API_KEY')
if (!secreto || secreto.length < 32) throw new Error('Falta ZERNIO_WEBHOOK_SECRET (al menos 32 caracteres; tiene que ser el mismo que está en Vercel)')

async function zernio(metodo, ruta, cuerpo) {
  const res = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  })
  const j = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Zernio ${metodo} ${ruta}: HTTP ${res.status} ${String(j.error ?? j.message ?? '').slice(0, 200)}`)
  return j
}

const { webhooks = [] } = await zernio('GET', '/webhooks/settings')
const existente = webhooks.find((w) => w.url === url)
const datos = { name: NOMBRE, url, events: EVENTOS, secret: secreto }
const r = existente ? await zernio('PUT', '/webhooks/settings', { webhookId: existente._id, ...datos }) : await zernio('POST', '/webhooks/settings', datos)
const id = r.webhook?._id ?? existente?._id
console.log(`${existente ? 'Puesto al día' : 'Registrado'}: ${id} → ${url}`)
console.log(`Eventos: ${EVENTOS.join(', ')}`)

if (probar && id) {
  await zernio('POST', '/webhooks/test', { webhookId: id })
  console.log('Evento de prueba enviado: en los logs de Vercel tiene que aparecer «[zernio] webhook.test …: prueba»')
}
