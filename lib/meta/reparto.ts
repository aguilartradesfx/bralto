import { createHmac } from 'node:crypto'

// Meta deja una sola dirección de avisos por app. La de «Bralto.io» es la puerta de Bralto, y desde aquí
// cada aviso de la cuenta de un cliente se le pasa a su propio sitio, como si se lo mandara Meta. Sin
// conexiones (las pruebas están en reparto.test.ts); el envío está en app/api/meta/webhook/route.ts.

// Un cliente y sus cuentas: el id de la página, el de Instagram y el de la cuenta de WhatsApp (WABA)
export type Destino = { nombre: string; url: string; cuentas: string[] }

type Aviso = { object: string; entry: unknown[] }

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

// META_REENVIOS en Vercel: [{"nombre":…,"url":"https://…","cuentas":["…"]}]. Lo que no sirve se descarta.
export function leerDestinos(json: string | undefined): Destino[] {
  if (!json) return []
  let lista: unknown
  try {
    lista = JSON.parse(json)
  } catch {
    console.error('[meta/reparto] META_REENVIOS no es JSON válido')
    return []
  }
  if (!Array.isArray(lista)) return []
  return lista.filter(
    (d): d is Destino =>
      esObjeto(d) &&
      typeof d.nombre === 'string' &&
      typeof d.url === 'string' &&
      d.url.startsWith('https://') &&
      Array.isArray(d.cuentas) &&
      d.cuentas.length > 0 &&
      d.cuentas.every((c) => typeof c === 'string'),
  )
}

// Cada «entry» del aviso trae la cuenta en entry.id: la que es de un cliente va a ese cliente y el resto
// se queda en Bralto (null si no queda nada). Un aviso que no se entiende se queda entero en Bralto.
export function repartir(aviso: unknown, destinos: Destino[]): { envios: { destino: Destino; aviso: Aviso }[]; resto: unknown } {
  if (!esObjeto(aviso) || typeof aviso.object !== 'string' || !Array.isArray(aviso.entry) || destinos.length === 0) {
    return { envios: [], resto: aviso }
  }
  const object = aviso.object
  const entradas: unknown[] = aviso.entry
  const dueno = (entry: unknown) => (esObjeto(entry) ? destinos.find((d) => d.cuentas.includes(String(entry.id ?? ''))) : undefined)

  const envios = destinos
    .map((destino) => ({ destino, aviso: { object, entry: entradas.filter((e) => dueno(e) === destino) } }))
    .filter((e) => e.aviso.entry.length > 0)
  const propias = entradas.filter((e) => !dueno(e))
  return { envios, resto: propias.length > 0 ? { object, entry: propias } : null }
}

// La misma firma que pone Meta: el cliente la comprueba con la clave secreta de la app, que es la misma
export function firmar(cuerpo: string, secreto: string): string {
  return `sha256=${createHmac('sha256', secreto).update(cuerpo).digest('hex')}`
}
