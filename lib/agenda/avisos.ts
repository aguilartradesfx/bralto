// Lo que la agenda le cuenta a Alejandro por Telegram: cada diagnóstico agendado y, sobre todo, cuando alguien pagó y
// se quedó sin cita (para que nunca pase sin que lo sepa). Texto plano. Puro, con pruebas (avisos.test.ts).
import type { DiagnosticBooking } from '../diagnostic/diagnostic.ts'
import { telefonoLegible } from '../crm/telefono.ts'
import { inicioYFin, ZONA } from './reglas.ts'

const PREGUNTAS: [keyof DiagnosticBooking['answers'], string][] = [
  ['size', 'Personas'],
  ['revenue', 'Ingreso mensual'],
  ['challenge', 'Desafío'],
  ['industry', 'Industria'],
  ['timeline', 'Plazo'],
]

/** «viernes 6 de noviembre, 9:00 a. m.», en hora de Costa Rica */
export function cuandoCorto(slot: string): string {
  const { inicio } = inicioYFin(slot)
  return new Intl.DateTimeFormat('es-CR', { timeZone: ZONA, weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
    .format(inicio)
    .replace(',', '')
}

/** Las respuestas del formulario, una por línea (para preparar la llamada) */
export function respuestas(b: Pick<DiagnosticBooking, 'answers'>): string {
  return PREGUNTAS.filter(([id]) => b.answers?.[id])
    .map(([id, etiqueta]) => `${etiqueta}: ${b.answers[id]}`)
    .join('\n')
}

function quien(b: DiagnosticBooking, ref: string): string {
  const telefono = b.phone ? telefonoLegible(b.phone) : ''
  return [`${b.firstName} ${b.lastName}`.trim(), cuandoCorto(b.slot), [b.email, telefono].filter(Boolean).join(' · '), `Orden ${ref}`].join('\n')
}

export function textoCitaNueva(b: DiagnosticBooking, ref: string, meet: string, opciones: { recuperada?: boolean } = {}): string {
  const titulo = opciones.recuperada
    ? '✅ Ya quedó la cita que había fallado: le llegó el correo con el enlace'
    : '🗓️ Diagnóstico pagado y agendado'
  return [titulo, quien(b, ref), `Meet: ${meet}`, '', respuestas(b)].join('\n').trim()
}

export function textoCorreoNoSalio(b: DiagnosticBooking, ref: string, meet: string, error: string): string {
  return [
    '⚠️ La cita quedó en el calendario, pero NO salió el correo con el enlace',
    quien(b, ref),
    `Meet: ${meet}`,
    `Error: ${error}`,
    '',
    'Mándale el enlace a mano.',
  ].join('\n')
}

export function textoSinCita(tipo: 'calendario' | 'conflicto', b: DiagnosticBooking, ref: string, error?: string): string {
  if (tipo === 'conflicto') {
    return [
      '⚠️ Pagó el diagnóstico, pero ese horario ya estaba ocupado por otro pago',
      quien(b, ref),
      '',
      'La página le dijo que le escribimos para coordinar otro horario. Escríbele.',
    ].join('\n')
  }
  return [
    '⚠️ Pagó el diagnóstico y NO se pudo crear la cita en Google Calendar',
    quien(b, ref),
    ...(error ? [`Error: ${error}`] : []),
    '',
    'Se reintenta sola cada 10 minutos y te aviso cuando quede. Si no, créala a mano y mándale el enlace.',
  ].join('\n')
}

export function textoSigueSinCita(b: DiagnosticBooking, ref: string, intentos: number, error: string): string {
  return [`⚠️ Sigue sin cita después de ${intentos} intentos`, quien(b, ref), `Error: ${error}`, '', 'Créala a mano y mándale el enlace.'].join('\n')
}

export function textoCitaVencida(b: DiagnosticBooking, ref: string): string {
  return ['⚠️ Ya pasó la hora y nunca se pudo crear la cita de este diagnóstico pagado', quien(b, ref), '', 'Escríbele para darle otro horario.'].join('\n')
}

export function textoCitaCancelada(b: DiagnosticBooking, ref: string): string {
  return ['ℹ️ La cita de este diagnóstico estaba cancelada en Google Calendar: no se vuelve a crear', quien(b, ref)].join('\n')
}

export function textoFallaGoogle(detalle: string, opciones: { parcial?: boolean } = {}): string {
  const mientras = opciones.parcial
    ? 'Mientras tanto /agendar revisa solo los calendarios que sí respondieron.'
    : 'Mientras tanto /agendar ofrece los horarios fijos sin revisar el calendario.'
  return [
    '⚠️ La agenda no pudo leer Google Calendar',
    detalle,
    '',
    `${mientras} Si dice invalid_grant, hay que volver a conectar esa cuenta de Google.`,
  ].join('\n')
}
