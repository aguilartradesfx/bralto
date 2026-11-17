// A dónde volver después de entrar: el enlace que pidió (por ejemplo, el de Telegram a /guiones#<id>) si es seguro.
// Seguro = una ruta de este mismo sitio: empieza con una sola «/», sin «//» ni «\», sin espacios ni caracteres de
// control (así no hay esquema ni otro sitio posible) y que no sea el mismo login. Lo demás se ignora.
// Lo usan el middleware (al mandar a /login), la página de login y su acción. Puro, sin dependencias.

const MAX = 2000

export function siguienteSeguro(v: unknown): string | null {
  if (typeof v !== 'string' || v.length > MAX) return null
  if (!/^\/(?![/\\])/.test(v)) return null
  if (/[\\\s\u0000-\u001f\u007f]/.test(v)) return null
  if (/^\/login(?:[/?#]|$)/.test(v)) return null
  return v
}

// /login con el enlace que pidió. El #ancla no viaja al servidor: el navegador lo conserva al pasar por la redirección
export function rutaDeLogin(pathname: string, search = ''): string {
  const destino = siguienteSeguro(pathname + search)
  return destino && destino !== '/admin' && destino !== '/' ? `/login?next=${encodeURIComponent(destino)}` : '/login'
}

// El destino con el #ancla con que se abrió /login (si es un ancla limpia)
export function conAncla(destino: string, hash: string): string {
  const sinAncla = destino.split('#')[0]
  return /^#[\w-]{1,100}$/.test(hash) ? `${sinAncla}${hash}` : sinAncla
}
