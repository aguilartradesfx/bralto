// Knox conversa: lo que recibe para decidir qué contestar en un mensaje directo (Instagram, Messenger o
// WhatsApp, por Zernio) y lo que devuelve. La bandeja del CRM arma el contexto, llama a `decidir` y según el
// modo deja la respuesta como borrador para que Ale la apruebe o la manda sola.

export const CANALES_KNOX = ['instagram', 'messenger', 'whatsapp'] as const
export type CanalKnox = (typeof CANALES_KNOX)[number]

// Quién escribió cada mensaje de la conversación
export type AutorMensaje = 'persona' | 'ale' | 'knox' | 'automatizacion'

export type MensajeParaKnox = {
  autor: AutorMensaje
  texto: string // '' si solo mandó un archivo; `adjunto` dice qué era
  adjunto?: string | null // 'foto', 'video', 'audio', 'archivo', 'historia', 'publicación compartida'…
  en: string // ISO
}

export type ContextoKnox = {
  canal: CanalKnox
  nombre: string | null // como aparece en la red
  usuario: string | null // el @ de Instagram, si hay
  contacto: { etiquetas: string[]; notas: string[]; oportunidadesAbiertas: number } | null // si ya está en el CRM
  mensajes: MensajeParaKnox[] // los últimos (hasta 20), del más viejo al más nuevo; el último es de la persona
}

export const TIPOS_MENSAJE = ['trabajo', 'personal', 'spam'] as const
export type TipoMensaje = (typeof TIPOS_MENSAJE)[number]

// responder: Knox le contesta (y si `aviso` viene, también le avisa a Ale).
// pasar_a_ale: Knox no contesta y le avisa a Ale (alguien molesto, que pide hablar con él, algo delicado).
// silencio: ni contesta ni avisa (mensajes personales, spam).
export const ACCIONES_KNOX = ['responder', 'pasar_a_ale', 'silencio'] as const
export type AccionKnox = (typeof ACCIONES_KNOX)[number]

export type DecisionKnox = {
  tipo: TipoMensaje
  accion: AccionKnox
  respuesta: string | null // el texto para la persona; null si no contesta
  aviso: string | null // una línea para Ale (Telegram y panel); null si no hace falta avisar
  etiquetas: string[] // para el CRM: 'lead', 'interesado-sesiones', 'pidio-llamada'…
  datos: { nombre: string | null; negocio: string | null; necesidad: string | null } // lo que la persona contó
  motivo: string // por qué decidió eso, corto (se muestra en el panel)
}

export const MODOS_KNOX = ['apagado', 'ensayo', 'automatico'] as const
export type ModoKnox = (typeof MODOS_KNOX)[number]
