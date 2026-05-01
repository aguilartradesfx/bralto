import { NextResponse } from 'next/server'
import { getResend } from '@/lib/email/resend'

const TYPE_LABELS: Record<string, string> = {
  admin: 'Discovery Operativo · Administrador PDV',
  ao: 'Discovery Estratégico · Liquidation Relaunch',
  cd: 'Discovery Estratégico · Centro de Distribución',
}

function buildEmailHtml(
  typeLabel: string,
  meta: Record<string, string>,
  answeredCount: number,
  totalCount: number,
  date: string,
) {
  const responder = meta.name || meta.encargado || meta.respondente || '—'
  const pdv = meta.pdv ? meta.pdv.replace(/^./, (c) => c.toUpperCase()) : null
  const contact = meta.contact || meta.telefono || '—'
  const email = meta.email || null

  const rows = [
    ['Respondido por', responder],
    pdv ? ['Punto de venta', pdv] : null,
    ['Contacto', contact],
    email ? ['Email', email] : null,
    ['Fecha', date],
    ['Preguntas completadas', `${answeredCount} de ${totalCount}`],
  ].filter(Boolean) as [string, string][]

  const rowsHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 16px;font-size:0.82rem;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap;border-bottom:1px solid #f0f0f0;">${k}</td><td style="padding:10px 16px;font-size:0.9rem;color:#0a0a0a;border-bottom:1px solid #f0f0f0;">${v}</td></tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#f2f2f2;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:0 0 16px 16px;overflow:hidden;">

  <div style="background:#0a0a0a;padding:36px 40px;text-align:center;">
    <img src="https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69c038d25596d1b810fd385d.png" alt="Bralto" style="width:90px;">
  </div>
  <div style="height:4px;background:linear-gradient(90deg,#ff6b2b 0%,#e63946 100%);"></div>

  <div style="padding:40px 40px 32px;">
    <div style="font-family:monospace;font-size:0.65rem;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#ff6b2b;margin-bottom:10px;">${typeLabel}</div>
    <h1 style="font-size:1.8rem;font-weight:800;color:#0a0a0a;margin:0 0 10px;line-height:1.2;">Discovery recibido.</h1>
    <p style="font-size:0.95rem;color:#666;margin:0 0 32px;line-height:1.7;">El cuestionario fue completado y enviado correctamente. El PDF con todas las respuestas va adjunto en este correo.</p>

    <div style="border:1px solid #eee;border-radius:12px;overflow:hidden;margin-bottom:28px;">
      <div style="background:#fafafa;padding:14px 16px;border-bottom:1px solid #eee;">
        <div style="font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#888;">Información del respondente</div>
      </div>
      <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
    </div>

    <div style="background:#fff8f3;border:1px solid rgba(255,107,43,0.3);border-radius:12px;padding:20px 24px;margin-bottom:28px;display:flex;align-items:flex-start;gap:14px;">
      <div style="font-size:1.4rem;flex-shrink:0;">📎</div>
      <div>
        <div style="font-size:0.9rem;font-weight:700;color:#0a0a0a;margin-bottom:4px;">PDF adjunto</div>
        <div style="font-size:0.84rem;color:#666;line-height:1.6;">El discovery completo con todas las respuestas está adjunto como PDF en este correo. Abrilo para ver el desglose completo por bloque.</div>
      </div>
    </div>

    <p style="font-size:0.82rem;color:#aaa;margin:0;line-height:1.6;">Este correo fue generado automáticamente por el sistema de discovery de Bralto. ${date}</p>
  </div>

  <div style="background:#0a0a0a;padding:24px 40px;text-align:center;">
    <p style="font-size:0.75rem;color:#555;margin:0;">Bralto · Infraestructura digital inteligente · <a href="https://bralto.io" style="color:#ff6b2b;text-decoration:none;">bralto.io</a></p>
  </div>
</div>
</body>
</html>`
}

export async function POST(req: Request) {
  let body: {
    type: string
    pdfBase64?: string
    pdfFilename?: string
    metadata?: Record<string, string>
    answeredCount?: number
    totalCount?: number
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, pdfBase64, pdfFilename, metadata = {}, answeredCount = 0, totalCount = 0 } = body

  const typeLabel = TYPE_LABELS[type] ?? 'Discovery Bralto'
  const date = new Date().toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' })
  const responder = metadata.name || metadata.encargado || metadata.respondente || 'Sin nombre'

  const subject = `${typeLabel} · ${responder} · ${date}`
  const html = buildEmailHtml(typeLabel, metadata, answeredCount, totalCount, date)

  const attachments =
    pdfBase64
      ? [{ filename: pdfFilename || 'discovery.pdf', content: Buffer.from(pdfBase64, 'base64') }]
      : []

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: 'Discovery Bralto <noreply@send.bralto.io>',
    to: ['aguilartradesfx@gmail.com'],
    subject,
    html,
    attachments,
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: 'Error al enviar el correo' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
