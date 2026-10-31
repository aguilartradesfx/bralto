// La cita del diagnóstico pagado: el evento de Google (con Meet y la persona como invitada) y el correo de confirmación
// que le llega con el enlace (sale por Resend, no por Google). Puro, con pruebas (cita.test.ts).
// Título y descripción simples: la persona los ve en su calendario.
import type { DiagnosticBooking } from '../diagnostic/diagnostic.ts'
import type { EventoNuevo } from './google.ts'
import { horaCr, inicioYFin, ZONA } from './reglas.ts'

type Idioma = 'es' | 'en'

const EVENTO: Record<Idioma, { titulo: string; descripcion: string }> = {
  es: {
    titulo: 'Diagnóstico Bralto',
    descripcion:
      'Diagnóstico de 30 minutos con el equipo de Bralto.\n\n¿No puede asistir? Escríbanos a cs@bralto.io antes de la cita y le damos un nuevo horario.',
  },
  en: {
    titulo: 'Bralto diagnostic call',
    descripcion:
      "30-minute diagnostic call with the Bralto team.\n\nCan't make it? Email us at cs@bralto.io before the call and we'll give you a new time.",
  },
}

/**
 * Id del evento, fijo para cada pago: un reintento encuentra el mismo evento en vez de crear otro. Google pide
 * base32hex (0-9 y a-v): la referencia del pago escrita en hexadecimal cumple, y se puede leer de vuelta.
 */
export function idDeEvento(ref: string): string {
  return `brd${Array.from(new TextEncoder().encode(ref), (b) => b.toString(16).padStart(2, '0')).join('')}`
}

const nombreCompleto = (b: Pick<DiagnosticBooking, 'firstName' | 'lastName'>) => `${b.firstName} ${b.lastName}`.trim()

/** El evento del diagnóstico en el calendario de la agenda */
export function eventoDelDiagnostico(b: DiagnosticBooking, ref: string): EventoNuevo {
  const { inicio, fin } = inicioYFin(b.slot)
  const textos = EVENTO[b.locale]
  return {
    id: idDeEvento(ref),
    summary: `${textos.titulo} · ${nombreCompleto(b)}`,
    description: textos.descripcion,
    start: { dateTime: horaCr(inicio), timeZone: ZONA },
    end: { dateTime: horaCr(fin), timeZone: ZONA },
    attendees: [{ email: b.email, displayName: nombreCompleto(b) }],
    conferenceData: { createRequest: { requestId: ref, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
    guestsCanInviteOthers: false,
    // Solo los ve la agenda (no la persona): de qué pago salió
    extendedProperties: { private: { orden: ref, origen: 'sitio' } },
    reminders: { useDefault: true },
  }
}

/** «viernes, 6 de noviembre de 2026, 9:00 a. m.», como lo muestra la página de confirmación */
export function cuandoEs(inicio: number, idioma: Idioma): string {
  return new Intl.DateTimeFormat(idioma === 'en' ? 'en-US' : 'es-CR', { dateStyle: 'full', timeStyle: 'short', timeZone: ZONA }).format(inicio)
}

// «1:00 p. m.» no se parte en dos líneas
const sinCortarLaHora = (s: string) => s.replace(/(\d)\s([ap])\.\s?m\./g, '$1 $2. m.').replace(/(\d)\s(AM|PM)\b/g, '$1 $2')

const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const CORREO: Record<
  Idioma,
  { asunto: string; etiqueta: string; titulo: (nombre: string) => string; zona: string; boton: string; enlace: string; nota: string; cambio: string; firma: string }
> = {
  es: {
    asunto: 'Diagnóstico confirmado | Bralto',
    etiqueta: 'Diagnóstico de 30 minutos',
    titulo: (nombre) => `${nombre}, su diagnóstico está agendado.`,
    zona: '(hora de Costa Rica)',
    boton: 'Entrar a la llamada',
    enlace: 'Enlace de Google Meet:',
    nota: 'En 30 minutos entendemos su negocio y le decimos por dónde empezar. Si decide avanzar, le descontamos los $97 completos del proyecto.',
    cambio: '¿No puede asistir? Escríbanos a cs@bralto.io antes de la cita y le damos un nuevo horario.',
    firma: 'El equipo de Bralto',
  },
  en: {
    asunto: 'Diagnostic call confirmed | Bralto',
    etiqueta: '30-minute diagnostic call',
    titulo: (nombre) => `${nombre}, your diagnostic call is booked.`,
    zona: '(Costa Rica time)',
    boton: 'Join the call',
    enlace: 'Google Meet link:',
    nota: 'In 30 minutes we understand your business and tell you where to start. If you move forward, we credit the full $97 toward your project.',
    cambio: "Can't make it? Email us at cs@bralto.io before the call and we'll give you a new time.",
    firma: 'The Bralto team',
  },
}

/** El correo de confirmación con el enlace de Meet: asunto, HTML y texto */
export function correoDeConfirmacion(d: { idioma: Idioma; nombre: string; inicio: number; meet: string }): {
  asunto: string
  html: string
  texto: string
} {
  const t = CORREO[d.idioma]
  const nombre = d.nombre.trim() || (d.idioma === 'en' ? 'Hi' : 'Hola')
  const cuando = cuandoEs(d.inicio, d.idioma)
  const meet = escapar(d.meet)
  const cambio = escapar(t.cambio).replace('cs@bralto.io', '<a href="mailto:cs@bralto.io" style="color:#ff6d28;text-decoration:none">cs@bralto.io</a>')

  const html = `<!DOCTYPE html>
<html lang="${d.idioma}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f2">
  <div style="padding:32px 16px;background:#f4f4f2;font-family:'Helvetica Neue',Arial,sans-serif;color:#0a0a0a">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.06)">
    <div style="background:#0a0a0a;padding:24px 32px">
      <img src="https://www.bralto.io/logo.png" alt="Bralto" width="116" height="28" style="display:block;border:0">
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 10px;color:#ff6d28;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase">${escapar(t.etiqueta)}</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:600">${escapar(t.titulo(nombre))}</h1>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.5">${escapar(sinCortarLaHora(cuando))} <span style="color:#6b6b6b">${escapar(t.zona)}</span></p>
      <a href="${meet}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 22px;border-radius:999px">${escapar(t.boton)}</a>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#6b6b6b">${escapar(t.enlace)} <a href="${meet}" style="color:#0a0a0a">${meet}</a></p>
      <p style="margin:28px 0 0;font-size:15px;line-height:1.6;color:#3a3a3a">${escapar(t.nota)}</p>
      <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#3a3a3a">${cambio}</p>
      <p style="margin:28px 0 0;font-size:14px;color:#6b6b6b">${escapar(t.firma)}</p>
    </div>
  </div>
  </div>
</body>
</html>`

  const texto = [
    t.titulo(nombre),
    '',
    `${cuando} ${t.zona}`,
    `${t.enlace} ${d.meet}`,
    '',
    t.nota,
    t.cambio,
    '',
    t.firma,
  ].join('\n')

  return { asunto: t.asunto, html, texto }
}
