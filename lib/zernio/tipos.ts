// Lo que devuelve Zernio (docs.zernio.com): la bandeja por la API y los webhooks. Solo los campos que se usan.
// Todo es opcional: lo que entra de afuera se revisa antes de usarlo.

export type RedZernio = 'instagram' | 'facebook' | 'whatsapp' | (string & {})

// sentVia: qué parte de Zernio mandó el mensaje. null: no se sabe (lo escrito en la app de la red, una respuesta
// automática de Meta). 'api' es lo que manda el panel
export type EnviadoPor = 'human' | 'api' | 'broadcast' | 'sequence' | 'workflow' | 'comment_automation' | 'bulk-api' | null

export interface AdjuntoZernio {
  type?: string // image, video, audio, file, sticker, share, template, unsupported_type
  originalType?: string // ig_reel, ig_post, ig_story, story_mention…
  mimeType?: string
  url?: string
  payload?: { voice?: boolean }
}

// GET /v1/inbox/conversations → data[]. En Instagram y Messenger el id es el de la persona (IGSID / PSID)
export interface ConversacionZernio {
  id: string
  platform?: RedZernio
  accountId?: string
  accountUsername?: string
  participantId?: string
  participantName?: string
  participantUsername?: string
  participantPicture?: string | null
  lastMessage?: string
  updatedTime?: string
  unreadCount?: number | null
  threadControl?: 'app' | 'ai_agent' | 'other'
}

// GET /v1/inbox/conversations/{id}/messages → messages[]. id es el de la red (el mismo platformMessageId de los webhooks)
export interface MensajeZernio {
  id: string
  conversationId?: string
  accountId?: string
  platform?: RedZernio
  message?: string | null
  senderId?: string
  senderName?: string
  direction?: 'incoming' | 'outgoing'
  createdAt?: string
  sentAt?: string
  attachments?: AdjuntoZernio[]
  storyReply?: { storyId?: string } | null
  isStoryMention?: boolean
  deliveryStatus?: string
  sentVia?: EnviadoPor
  metadata?: Record<string, unknown> | null
}

export interface CuentaZernio {
  _id: string
  platform?: RedZernio
  platformUserId?: string
  username?: string
}

// Webhooks (POST a /api/zernio/webhook) ------------------------------------------------------------------------------

export interface RemitenteZernio {
  id?: string
  name?: string
  username?: string
  picture?: string
  phoneNumber?: string | null
}

export interface MensajeWebhook {
  id?: string // el de Zernio
  conversationId?: string
  platform?: RedZernio
  platformMessageId?: string // el de la red: con este se reconoce el mensaje
  direction?: 'incoming' | 'outgoing'
  text?: string | null
  attachments?: AdjuntoZernio[]
  sender?: RemitenteZernio
  sentAt?: string
  sentVia?: EnviadoPor
}

export interface ConversacionWebhook {
  id?: string // el de Zernio
  platformConversationId?: string // el mismo id que da GET /v1/inbox/conversations
  participantId?: string
  participantName?: string
  participantUsername?: string
  participantPicture?: string
}

export interface CuentaWebhook {
  id?: string
  accountId?: string
  platform?: string
  username?: string
  pageId?: string
}

export interface EventoZernio {
  id?: string
  event?: string // message.received, message.sent, message.delivered, message.read, message.failed, webhook.test…
  test?: boolean
  timestamp?: string
  message?: MensajeWebhook
  conversation?: ConversacionWebhook
  account?: CuentaWebhook
  metadata?: Record<string, unknown> | null
  statusAt?: string
  error?: { code?: number; title?: string; message?: string; explanation?: string | null } | null
}
