import { escapeHtml, isNewsAction, verifyNewsToken } from '@/lib/news/links'
import { getById, setStatus } from '@/lib/news/store'

export const dynamic = 'force-dynamic'

// Botones del correo. GET solo muestra la confirmación (los correos abren los links solos);
// el cambio lo hace el POST del formulario.
const VERB = { publicar: 'Publicar', ocultar: 'Ocultar' } as const

function page(title: string, inner: string, status = 200) {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#060607;color:#f4f4f5;font:16px/1.6 system-ui,sans-serif;padding:24px}main{max-width:520px}h1{font-size:22px;font-weight:600;margin:0 0 12px}p{color:#a1a1aa;margin:0 0 20px}button{background:#ff6d28;color:#0a0a0a;border:0;border-radius:999px;padding:12px 22px;font:600 15px system-ui,sans-serif;cursor:pointer}a{color:#ff8a52}</style></head><body><main>${inner}</main></body></html>`
  return new Response(html, { status, headers: { 'content-type': 'text/html; charset=utf-8' } })
}

async function check(req: Request) {
  const q = new URL(req.url).searchParams
  const id = q.get('id') ?? ''
  const accion = q.get('accion')
  const t = q.get('t') ?? ''
  if (!isNewsAction(accion) || accion === 'ver') return null
  if (!verifyNewsToken(process.env.NEWS_LINK_SECRET ?? '', id, accion, t)) return null
  const row = await getById(id)
  return row ? { row, accion } : null
}

const invalid = () =>
  page('Link no válido', '<h1>Este link no es válido</h1><p>Puede que esté incompleto. Ábralo de nuevo desde el correo.</p>', 403)

export async function GET(req: Request) {
  const ok = await check(req)
  if (!ok) return invalid()
  const { row, accion } = ok
  const done = (accion === 'publicar') === (row.estado === 'publicada')
  if (done) return page('Sin cambios', `<h1>La nota ya está ${row.estado}</h1><p>${escapeHtml(row.titulo_es)}</p>`)
  return page(
    `${VERB[accion]} nota`,
    `<h1>¿${VERB[accion]} esta nota?</h1><p>${escapeHtml(row.titulo_es)}</p><form method="post"><button type="submit">${VERB[accion]}</button></form>`,
  )
}

export async function POST(req: Request) {
  const ok = await check(req)
  if (!ok) return invalid()
  const row = await setStatus(ok.row.id, ok.accion === 'publicar' ? 'publicada' : 'oculta')
  if (!row) return page('No se encontró', '<h1>No se encontró la nota</h1>', 404)
  const url = `${new URL(req.url).origin}/es/noticias/${row.slug}`
  const msg = row.estado === 'publicada' ? `Ya está en el sitio: <a href="${url}">verla</a>.` : 'Ya no aparece en el sitio.'
  return page('Listo', `<h1>Listo: la nota quedó ${row.estado}</h1><p>${escapeHtml(row.titulo_es)}</p><p>${msg}</p>`)
}
