const LOGO_URL = 'https://bralto.io/logo.png'
const ORANGE = '#ff6700'
const DARK = '#0a0a0a'

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { margin:0; padding:0; background:#f5f5f5; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; }
  .wrap { max-width:560px; margin:32px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,0.06); }
  .header { background:${DARK}; padding:28px 36px; text-align:left; }
  .header img { height:32px; }
  .body { padding:36px; color:#374151; font-size:15px; line-height:1.65; }
  .body h1 { font-size:22px; font-weight:700; color:${DARK}; margin:0 0 8px; }
  .body p { margin:0 0 16px; }
  .btn { display:inline-block; background:${ORANGE}; color:#ffffff !important; text-decoration:none; padding:14px 28px; border-radius:8px; font-weight:600; font-size:14px; margin:8px 0 16px; }
  .meta { background:#f9f9f9; border-radius:8px; padding:16px 20px; margin:20px 0; font-size:13px; color:#6b7280; }
  .meta b { color:${DARK}; }
  .footer { padding:24px 36px; border-top:1px solid #f0f0f0; font-size:12px; color:#9ca3af; text-align:center; }
  .footer a { color:${ORANGE}; text-decoration:none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <img src="${LOGO_URL}" alt="Bralto" />
  </div>
  <div class="body">${content}</div>
  <div class="footer">Bralto · Infraestructura digital inteligente · <a href="https://bralto.io">bralto.io</a></div>
</div>
</body>
</html>`
}

export function emailContractSent({
  clienteName,
  empresa,
  contractUrl,
}: {
  clienteName: string
  empresa: string
  contractUrl: string
}): { subject: string; html: string } {
  return {
    subject: `Tu contrato de servicio está listo — ${empresa}`,
    html: base(`
      <h1>Hola, ${clienteName} 👋</h1>
      <p>Hemos preparado el contrato de prestación de servicios para <b>${empresa}</b>. Podés revisarlo y firmarlo directamente desde el siguiente enlace:</p>
      <a href="${contractUrl}" class="btn">Revisar y firmar contrato →</a>
      <p>El proceso de firma es 100% digital y tiene plena validez legal. Solo necesitás leer el documento y dibujar tu firma.</p>
      <div class="meta">
        <b>¿Tenés alguna duda?</b><br />
        Respondé este correo o escribinos directamente y lo resolvemos.
      </div>
      <p style="color:#9ca3af;font-size:13px;">Si no esperabas este correo, podés ignorarlo sin problema.</p>
    `),
  }
}

export function emailContractSigned({
  clienteName,
  empresa,
  contractUrl,
  signedAt,
}: {
  clienteName: string
  empresa: string
  contractUrl: string
  signedAt: string
}): { subject: string; html: string } {
  return {
    subject: `¡Contrato firmado! Confirmación de ${empresa}`,
    html: base(`
      <h1>¡Gracias, ${clienteName}!</h1>
      <p>Tu contrato de servicio con <b>Bralto</b> para <b>${empresa}</b> ha sido firmado exitosamente.</p>
      <div class="meta">
        <b>Fecha de firma:</b> ${signedAt}<br />
        <b>Empresa:</b> ${empresa}<br />
        <b>Representante:</b> ${clienteName}
      </div>
      <p>Podés acceder al documento firmado en cualquier momento desde el siguiente enlace:</p>
      <a href="${contractUrl}" class="btn">Ver contrato firmado →</a>
      <p>Nuestro equipo ya fue notificado y se pondrá en contacto contigo en las próximas horas para coordinar el inicio del proyecto.</p>
    `),
  }
}

export function emailContractReminder({
  clienteName,
  empresa,
  contractUrl,
}: {
  clienteName: string
  empresa: string
  contractUrl: string
}): { subject: string; html: string } {
  return {
    subject: `Recordatorio: tu contrato con Bralto sigue pendiente`,
    html: base(`
      <h1>Hola, ${clienteName}</h1>
      <p>Te recordamos que tu contrato de servicio para <b>${empresa}</b> sigue pendiente de firma.</p>
      <p>Solo te toma un par de minutos revisarlo y firmarlo:</p>
      <a href="${contractUrl}" class="btn">Firmar contrato ahora →</a>
      <p>Si tenés alguna pregunta sobre el contenido del contrato o los términos, respondé este correo y te ayudamos.</p>
      <div class="meta" style="border-left:3px solid ${ORANGE}; border-radius:0 8px 8px 0;">
        Este enlace es único y privado para vos. No lo compartas con terceros.
      </div>
    `),
  }
}
