import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

// «Conectar cuentas»: cada cliente abre su enlace, entra con Facebook y escoge su página y su Instagram.
// Aquí solo va lo que no tiene conexiones (con pruebas en conectar.test.ts); lo que habla con Meta y con la
// base está en conectar-servidor.ts y las rutas en app/api/meta/conectar.

export const VERSION_GRAPH = 'v26.0'
// Tiene que ser idéntica a la que está en el panel de Meta, por eso no sale del dominio de cada visita
export const REDIRECCION = 'https://www.bralto.io/api/meta/conectar/volver'

const VIGENCIA_ESTADO_MS = 15 * 60_000
const HOLGURA_RELOJ_MS = 60_000

export type Idioma = 'es' | 'en'
export type DatosEstado = { codigo: string; nonce: string; idioma: Idioma }
export type Cuenta = { paginaId: string; nombre: string; token: string; instagramId: string | null; instagramUsuario: string | null }
export type Fallo = 'cancelado' | 'sin_cuentas' | 'fallo'

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

export const crearCodigo = () => randomBytes(18).toString('base64url')
export const crearNonce = () => randomBytes(16).toString('base64url')
export const codigoValido = (c: unknown): c is string => typeof c === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(c)

const firma = (cuerpo: string, secreto: string) => createHmac('sha256', secreto).update(`conectar:${cuerpo}`).digest('base64url')

// El «state» que viaja a Facebook y vuelve: dice de qué invitación viene y no se puede falsificar
export function firmarEstado(d: DatosEstado, secreto: string, ahoraMs: number): string {
  const cuerpo = [d.codigo, d.nonce, d.idioma, String(ahoraMs)].join('.')
  return `${cuerpo}.${firma(cuerpo, secreto)}`
}

export function leerEstado(estado: string | null, secreto: string, ahoraMs: number): DatosEstado | null {
  if (!estado || !secreto) return null
  const partes = estado.split('.')
  if (partes.length !== 5) return null
  const [codigo, nonce, idioma, momento, recibida] = partes
  const dada = Buffer.from(recibida)
  const esperada = Buffer.from(firma(partes.slice(0, 4).join('.'), secreto))
  if (dada.length !== esperada.length || !timingSafeEqual(dada, esperada)) return null
  const t = Number(momento)
  if (!Number.isFinite(t) || ahoraMs - t > VIGENCIA_ESTADO_MS || t - ahoraMs > HOLGURA_RELOJ_MS) return null
  if (idioma !== 'es' && idioma !== 'en') return null
  return { codigo, nonce, idioma }
}

export function urlDialogo(o: { appId: string; configId: string; estado: string }): string {
  const q = new URLSearchParams({
    client_id: o.appId,
    redirect_uri: REDIRECCION,
    state: o.estado,
    config_id: o.configId,
    response_type: 'code',
  })
  return `https://www.facebook.com/${VERSION_GRAPH}/dialog/oauth?${q}`
}

// GET /me/accounts: las páginas que la persona autorizó, con la clave de cada una y su Instagram
export function leerCuentas(respuesta: unknown): Cuenta[] {
  if (!esObjeto(respuesta) || !Array.isArray(respuesta.data)) return []
  const cuentas: Cuenta[] = []
  for (const p of respuesta.data) {
    if (!esObjeto(p) || typeof p.id !== 'string' || typeof p.name !== 'string' || typeof p.access_token !== 'string') continue
    const ig = esObjeto(p.instagram_business_account) ? p.instagram_business_account : null
    cuentas.push({
      paginaId: p.id,
      nombre: p.name,
      token: p.access_token,
      instagramId: typeof ig?.id === 'string' ? ig.id : null,
      instagramUsuario: typeof ig?.username === 'string' ? ig.username : null,
    })
  }
  return cuentas
}

export function invitacionVigente(expiraEn: string, ahoraMs: number): boolean {
  const vence = Date.parse(expiraEn)
  return Number.isFinite(vence) && ahoraMs <= vence
}

// Qué pasó al volver de Facebook, antes de cambiar el código (null: todo bien)
export function falloDeVuelta(params: URLSearchParams): Fallo | null {
  if (params.get('error') === 'access_denied') return 'cancelado'
  if (params.get('error') || !params.get('code')) return 'fallo'
  return null
}
