import { createHmac, timingSafeEqual } from 'node:crypto'

// La firma de los webhooks de Zernio: X-Zernio-Signature es el HMAC-SHA256 del cuerpo crudo con el secreto, en hex.
// Se compara en tiempo constante. Sin secreto o sin firma, nunca pasa
export function firmaValida(cuerpo: string | Uint8Array, firma: string | null | undefined, secreto: string | null | undefined): boolean {
  if (!secreto || !firma) return false
  const recibida = firma.trim()
  if (!/^[0-9a-f]{64}$/i.test(recibida)) return false
  const esperada = createHmac('sha256', secreto).update(cuerpo).digest()
  return timingSafeEqual(Buffer.from(recibida, 'hex'), esperada)
}
