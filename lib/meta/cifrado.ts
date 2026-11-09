import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

// Las claves de las páginas que conectan los clientes no se guardan a la vista: AES-256-GCM con
// META_TOKENS_KEY (32 bytes en base64). El sello es «v1.<iv>.<etiqueta>.<datos>».

const VERSION = 'v1'

function leerClave(claveBase64: string): Buffer {
  const clave = Buffer.from(claveBase64, 'base64')
  if (clave.length !== 32) throw new Error('META_TOKENS_KEY tiene que medir 32 bytes')
  return clave
}

export function cifrar(texto: string, claveBase64: string): string {
  const iv = randomBytes(12)
  const cifrador = createCipheriv('aes-256-gcm', leerClave(claveBase64), iv)
  const datos = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()])
  return [VERSION, iv.toString('base64url'), cifrador.getAuthTag().toString('base64url'), datos.toString('base64url')].join('.')
}

export function descifrar(sello: string, claveBase64: string): string {
  const [version, iv, etiqueta, datos, ...sobra] = sello.split('.')
  if (version !== VERSION || !iv || !etiqueta || !datos || sobra.length > 0) throw new Error('Esto no es un sello válido')
  const descifrador = createDecipheriv('aes-256-gcm', leerClave(claveBase64), Buffer.from(iv, 'base64url'))
  descifrador.setAuthTag(Buffer.from(etiqueta, 'base64url'))
  return Buffer.concat([descifrador.update(Buffer.from(datos, 'base64url')), descifrador.final()]).toString('utf8')
}
