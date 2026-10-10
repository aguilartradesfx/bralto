import { createHmac, timingSafeEqual } from 'node:crypto'
import type { NewsAction } from './types'

// Links del correo (ver la vista previa, publicar, ocultar): un HMAC por nota y acción,
// sin vencimiento; solo cambian la visibilidad de una nota.
const ACTIONS: readonly NewsAction[] = ['ver', 'publicar', 'ocultar']

export const isNewsAction = (v: unknown): v is NewsAction => ACTIONS.includes(v as NewsAction)

export function signNewsToken(secret: string, id: string, action: NewsAction): string {
  if (!secret) throw new Error('Falta NEWS_LINK_SECRET')
  return createHmac('sha256', secret).update(`noticias:${id}:${action}`).digest('base64url')
}

export function verifyNewsToken(secret: string, id: string, action: NewsAction, token: string): boolean {
  if (!secret || !token) return false
  const want = Buffer.from(signNewsToken(secret, id, action))
  const got = Buffer.from(token)
  return want.length === got.length && timingSafeEqual(want, got)
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
