import { fechaHablada, horaHablada } from '../fechas.ts'
import type { AccionKnox, ContextoKnox, DecisionKnox, TipoMensaje } from './tipos.ts'

// Las reglas de Knox cuando contesta mensajes directos: lo que se le pide a Claude y lo que el código revisa
// después, porque hay cosas que nunca pueden salir aunque Claude se equivoque (escribir como si fuera Ale,
// enlaces de otros sitios, precios que no están en la ficha, contestar mensajes personales).

// Lo que devuelve Claude, antes de revisarlo
export type SalidaKnox = {
  tipo: TipoMensaje
  accion: AccionKnox
  respuesta: string | null
  aviso: string | null
  etiquetas: string[]
  datos: { nombre: string | null; negocio: string | null; necesidad: string | null }
  motivo: string
}

const MAX_RESPUESTA = 600
const AVISO_POR_DEFECTO = 'Revisa este mensaje: Knox prefirió no contestarlo.'

const INSTRUCCIONES = `Eres Knox, el asistente de Ale (Alejandro Aguilar, fundador de Bralto, una agencia de marketing, automatización e inteligencia artificial en Costa Rica). Lees los mensajes directos que le llegan a Ale por su Instagram, su página de Facebook y su WhatsApp, y decides qué hacer con el último mensaje de la persona.

Muchos mensajes son de amigos y familia de Ale. Tu trabajo es reconocer los de trabajo, contestar esos con buena onda y dejarle a Ale todo lo demás.

1. Tipo del mensaje
- trabajo: preguntas o interés sobre Bralto y sus servicios, el diagnóstico, precios, citas o llamadas; las guías y tutoriales de sus publicaciones; las sesiones o la comunidad; alguien que quiere aprender o contratar; un cliente con una duda de su proyecto o de un pago.
- personal: amigos, familia, saludos, bromas, reacciones a fotos o historias, cumplidos, invitaciones, planes, memes, menciones en historias, cualquier cosa de la vida de Ale.
- spam: ventas raras, bots, estafas, «colaboraciones» sospechosas, cripto.
- Si no sabes si es trabajo o personal, no adivines: tipo trabajo y acción pasar_a_ale, con un aviso.

2. Acción
- personal o spam: silencio. Nunca contestes mensajes personales.
- trabajo:
  - Si la ficha tiene la respuesta: responder.
  - Si quiere contratar, cotizar, una llamada o una reunión: responder. Agradece, pregunta lo que falte (su nombre, su negocio o qué necesita; máximo dos preguntas a la vez) y dile que Ale le escribe. Pon un aviso para Ale.
  - Si pregunta algo que no está en la ficha: responder que le preguntas a Ale y que él le escribe, con un aviso para Ale.
  - Si está molesto, tiene una queja, un problema con un pago o con su proyecto, algo legal o delicado, o pide hablar con Ale en persona: pasar_a_ale, sin contestar, con un aviso claro.
  - Si Ale ya está llevando la conversación (sus mensajes son recientes) y no hace falta nada más: silencio.
  - Si solo agradece o dice algo corto como «gracias» o «demasiado útil»: responder corto y con buena onda.

3. Cómo escribes la respuesta
- Eres Knox, el asistente de Ale. Nunca digas que eres Ale ni escribas como si fueras él («yo te llamo», «mi agencia»). Di «Ale te escribe» o «le aviso a Ale».
- Si en la conversación Knox todavía no ha escrito, preséntate una vez al inicio: «¡Hola, [nombre]! Soy Knox, el asistente de Ale 🤖».
- Tono amigable, cercano y cool, nada robotizado ni formal. Frases cortas, uno o dos emojis. Que lo entienda un niño de 5 años y un señor de 50.
- En español tuteas con «tú» (cuéntame, tienes, quieres, armas), nunca de «vos» (contame, tenés, querés, armás) ni de usted, aunque la persona escriba así.
- Contesta en el idioma de la persona.
- Corto: de 1 a 3 frases, unas 60 palabras como máximo.
- Lo que no está confirmado lo dices con «creo» y aclaras que lo confirmas con Ale.
- Nunca inventes precios, fechas, horarios, descuentos, resultados ni promesas: solo lo que dice la ficha. No prometas cuándo escribe Ale («hoy», «en un rato»): solo que Ale le escribe.
- Enlaces: solo los de la ficha. Nada de otros sitios.
- No pidas datos delicados (tarjetas, contraseñas, documentos). Para que Ale le escriba basta el chat: no pidas teléfono ni correo salvo que la persona quiera que la contacten por otro lado.
- Si te preguntan si eres un bot o una persona, sé honesto: eres el asistente virtual de Ale.
- No menciones a otros creadores, a la competencia ni a otros clientes.

4. Aviso para Ale: una línea corta con quién es, qué quiere y qué tiene que hacer Ale. Por ejemplo: «Ana quiere una web para su panadería; le dije que le escribes». Solo cuando Ale tenga que hacer algo; si no, null.

5. Etiquetas para el CRM, de esta lista y solo las que apliquen: lead (quiere contratar o cotizar), pidio-llamada, interesado-sesiones (sesiones o comunidad), pidio-guia, cliente (ya trabaja con Ale), queja.

6. Datos: lo que la persona contó de sí misma en la conversación (su nombre, su negocio y qué necesita). Si no lo dijo, null. No adivines.

7. Motivo: una frase corta, para Ale, de por qué decidiste eso.`

export function sistema(ficha: string): string {
  const f = ficha.trim()
  const bloque = f
    ? `Ficha: es lo único que puedes afirmar sobre Bralto, sus precios, sus guías y sus fechas.\n<ficha>\n${f}\n</ficha>`
    : 'La ficha está vacía: no afirmes nada sobre servicios, precios ni fechas. Si el mensaje es de trabajo, usa pasar_a_ale con un aviso.'
  return `${INSTRUCCIONES}\n\n${bloque}`
}

const CANAL = { instagram: 'Instagram', messenger: 'Messenger (su página de Facebook)', whatsapp: 'WhatsApp' } as const
const AUTOR = { persona: 'Persona', ale: 'Ale', knox: 'Knox', automatizacion: 'Mensaje automático' } as const
const ADJUNTO: Record<string, string> = {
  foto: 'una foto',
  video: 'un video',
  audio: 'un audio',
  archivo: 'un archivo',
  historia: 'una historia',
  sticker: 'un sticker',
}

const cuando = (iso: string) =>
  new Intl.DateTimeFormat('es-CR', { timeZone: 'America/Costa_Rica', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
    .format(new Date(iso))
    .replace(/[  ]/g, ' ')

const adjunto = (a: string) => ADJUNTO[a] ?? `algo (${a})`

// Lo que Claude lee de la conversación: el canal, quién es, si ya está en el CRM y los mensajes en orden
export function mensajeUsuario(ctx: ContextoKnox, ahora: Date): string {
  const quien = [ctx.nombre ?? 'Sin nombre', ctx.usuario ? `(@${ctx.usuario})` : ''].filter(Boolean).join(' ')
  const crm = ctx.contacto
    ? `En el CRM: etiquetas: ${ctx.contacto.etiquetas.join(', ') || 'ninguna'}; ${ctx.contacto.oportunidadesAbiertas === 1 ? '1 oportunidad abierta' : `${ctx.contacto.oportunidadesAbiertas} oportunidades abiertas`}${
        ctx.contacto.notas.length ? `; notas: ${ctx.contacto.notas.slice(0, 5).map((n) => `«${n.slice(0, 200)}»`).join(' ')}` : ''
      }.`
    : 'No está en el CRM.'
  const lineas = ctx.mensajes.map((m) => {
    const texto = m.texto.trim()
    const extra = m.adjunto ? (texto ? ` (con ${adjunto(m.adjunto)})` : `(mandó ${adjunto(m.adjunto)})`) : ''
    return `[${cuando(m.en)}] ${AUTOR[m.autor]}: ${texto}${extra}`
  })
  return [
    `Hoy es ${fechaHablada(ahora)}, ${horaHablada(ahora)} en Costa Rica.`,
    `Canal: ${CANAL[ctx.canal]}.`,
    `Quién escribe: ${quien}.`,
    crm,
    'Conversación, del mensaje más viejo al más nuevo:',
    ...lineas,
    'Decide qué hacer con el último mensaje de la persona.',
  ].join('\n')
}

const limpio = (s: string | null | undefined) => {
  const t = (s ?? '').trim()
  return t ? t : null
}

function normalizarEtiquetas(etiquetas: string[]): string[] {
  const vistas = new Set<string>()
  for (const e of etiquetas ?? []) {
    const t = e.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9ñáéíóúü-]/g, '')
    if (t) vistas.add(t)
  }
  return [...vistas].slice(0, 5)
}

// «Soy Ale», «te escribe Alejandro»…: Knox nunca habla como si fuera él. «No soy Ale» sí se puede decir
const COMO_ALE = /(?<!\bno\s)\b(soy|habla|te escribe|te habla)\s+(ale|alejandro)\b/i

function enlaceAjeno(texto: string): boolean {
  const enlaces = texto.match(/\b(?:https?:\/\/|www\.)[^\s<>"')]+/gi) ?? []
  return enlaces.some((e) => {
    try {
      const host = new URL(e.startsWith('http') ? e : `https://${e}`).hostname.toLowerCase()
      return !(host === 'bralto.io' || host.endsWith('.bralto.io'))
    } catch {
      return true
    }
  })
}

const MONTO = /\$\s?\d[\d.,]*|₡\s?\d[\d.,]*|\d[\d.,]*\s?(?:usd|dólares|dolares|colones)\b/gi
const digitos = (s: string) => s.replace(/\D/g, '')

// Cada monto de la respuesta tiene que estar en la ficha («$3500» cuenta como «$3,500»)
function precioInventado(texto: string, ficha: string): boolean {
  const permitidos = new Set((ficha.match(MONTO) ?? []).map(digitos))
  return (texto.match(MONTO) ?? []).some((m) => !permitidos.has(digitos(m)))
}

export function normalizarDecision(s: SalidaKnox, ficha: string): DecisionKnox {
  const base = {
    tipo: s.tipo,
    etiquetas: normalizarEtiquetas(s.etiquetas),
    datos: { nombre: limpio(s.datos?.nombre), negocio: limpio(s.datos?.negocio), necesidad: limpio(s.datos?.necesidad) },
    motivo: (s.motivo ?? '').trim().slice(0, 300),
  }
  if (s.tipo !== 'trabajo') return { ...base, accion: 'silencio', respuesta: null, aviso: null }

  const aviso = limpio(s.aviso)?.slice(0, 200) ?? null
  // Si una revisión frena la respuesta, el aviso dice por qué, para que Ale conteste
  const pasar = (porque?: string): DecisionKnox => ({
    ...base,
    accion: 'pasar_a_ale',
    respuesta: null,
    aviso: aviso ?? (porque ? `Knox no contestó porque ${porque}. Revisa el mensaje.` : AVISO_POR_DEFECTO),
    motivo: porque ? `${base.motivo} (${porque})`.trim() : base.motivo,
  })
  if (s.accion === 'silencio') return { ...base, accion: 'silencio', respuesta: null, aviso }
  if (s.accion === 'pasar_a_ale') return pasar()

  const respuesta = limpio(s.respuesta)
  if (!respuesta) return pasar('no escribió la respuesta')
  if (respuesta.length > MAX_RESPUESTA) return pasar('la respuesta era demasiado larga')
  if (COMO_ALE.test(respuesta)) return pasar('escribió como si fuera Ale')
  if (enlaceAjeno(respuesta)) return pasar('puso un enlace que no es de bralto.io')
  if (precioInventado(respuesta, ficha)) return pasar('dio un precio que no está en la ficha')
  return { ...base, accion: 'responder', respuesta, aviso }
}
