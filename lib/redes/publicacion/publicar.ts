import { avisoError, avisoListo } from './aviso.ts'
import { MAX_INTENTOS, type Estado, type Publicacion, type Resultado } from './tipos.ts'

// Publica una fila de redes_publicaciones, paso por paso:
//   1. Instagram: el contenedor (carrusel o reel, con collab y texto), esperar a que se procese, publicar.
//   2. El «Comenta» de Instagram (Zernio).  3. Facebook (Zernio) y su «Comenta».
//   4. Aceptar la collab desde la otra cuenta.  5. Las historias, en orden.  6. El aviso por Telegram.
// Cada paso queda en `resultado` apenas termina: si una corrida se corta, la siguiente sigue donde quedó
// sin repetir lo hecho. El contenedor se guarda antes de publicarlo para no publicar dos veces. Solo el paso 1
// puede tumbar la publicación; lo que falla después queda anotado y sale en el aviso.
// Las conexiones reales están en servidor.ts; acá todo llega por `Efectos`, para probarlo.

export { MAX_INTENTOS }

export type Cambios = { estado?: Estado; resultado?: Resultado; ultimo_error?: string | null }

export type Efectos = {
  crearContenedor(p: Publicacion): Promise<string>
  estadoContenedor(id: string): Promise<string> // IN_PROGRESS, FINISHED, PUBLISHED, ERROR o EXPIRED
  publicarContenedor(id: string): Promise<{ id: string; permalink: string | null }>
  buscarPublicado(texto: string): Promise<{ id: string; permalink: string | null } | null>
  crearComenta(origen: 'ig' | 'fb', postId: string, p: Publicacion): Promise<string>
  publicarFacebook(p: Publicacion): Promise<{ zernioId?: string | null; postId: string | null; url: string | null; estado?: string }>
  aceptarCollab(mediaId: string): Promise<void>
  publicarHistoria(url: string): Promise<string>
  guardar(id: string, cambios: Cambios): Promise<void>
  avisar(texto: string): Promise<void>
  dormir(ms: number): Promise<void>
  ahora(): number
}

const ESPERA_MS = 5000
const VUELTAS = { carrusel: 24, reel: 36 } // hasta 2 y 3 minutos procesando

// Un problema que reintentar no arregla (o que, reintentado, podría publicar dos veces)
class SinReintento extends Error {}

const mensaje = (err: unknown) => (err instanceof Error ? err.message : String(err)).slice(0, 400)

export function validar(p: Publicacion): string | null {
  if (p.tipo === 'carrusel' && (p.laminas.length < 2 || p.laminas.length > 10)) {
    return `un carrusel lleva de 2 a 10 láminas (tiene ${p.laminas.length})`
  }
  if (p.tipo === 'reel' && !p.video_url) return 'el reel no tiene video'
  const texto = p.texto.trim()
  if (!texto) return 'no tiene texto'
  if (texto.length > 2200) return `el texto tiene ${texto.length} caracteres; Instagram deja 2200`
  const hashtags = texto.match(/#[\p{L}\p{N}_]+/gu)?.length ?? 0
  if (hashtags > 5) return `el texto tiene ${hashtags} hashtags; Instagram deja 5`
  return null
}

async function esperar(id: string, p: Publicacion, e: Efectos) {
  for (let i = 0; i < VUELTAS[p.tipo]; i++) {
    const estado = await e.estadoContenedor(id)
    if (estado === 'FINISHED') return
    if (estado === 'ERROR' || estado === 'EXPIRED') throw new Error(`Instagram: el contenedor quedó en ${estado}`)
    await e.dormir(ESPERA_MS)
  }
  throw new Error('Instagram: el contenedor no terminó de procesarse')
}

async function instagram(p: Publicacion, r: Resultado, e: Efectos) {
  if (r.instagram) return
  if (r.contenedor) {
    // Reintento: ¿el contenedor de la corrida anterior sigue vivo, o ya salió? Si no se puede saber, no se
    // rehace (pudo haber salido y sería un post repetido): el error sube y se reintenta en la próxima corrida
    const estado = await e.estadoContenedor(r.contenedor.id)
    if (estado === 'PUBLISHED') {
      const ya = await e.buscarPublicado(p.texto)
      if (!ya) throw new SinReintento('Instagram dice que ya salió, pero no encontré el post. Revísalo antes de volver a programarlo.')
      r.instagram = { ...ya, en: new Date(e.ahora()).toISOString() }
      await e.guardar(p.id, { resultado: r })
      return
    }
    if (estado === 'ERROR' || estado === 'EXPIRED') delete r.contenedor // si sigue procesándose, se espera
  }
  if (!r.contenedor) {
    r.contenedor = { id: await e.crearContenedor(p), creado: e.ahora() }
    await e.guardar(p.id, { resultado: r })
  }
  await esperar(r.contenedor.id, p, e)
  r.instagram = { ...(await e.publicarContenedor(r.contenedor.id)), en: new Date(e.ahora()).toISOString() }
  await e.guardar(p.id, { resultado: r })
}

export async function publicarFila(p: Publicacion, e: Efectos): Promise<string> {
  const r: Resultado = structuredClone(p.resultado ?? {})
  const invalida = validar(p)
  if (invalida) {
    await e.guardar(p.id, { estado: 'error', ultimo_error: invalida })
    await e.avisar(avisoError(p.titulo, null, invalida))
    return `error: ${invalida}`
  }

  try {
    await instagram(p, r, e)
  } catch (err) {
    const motivo = mensaje(err)
    if (err instanceof SinReintento) {
      await e.guardar(p.id, { estado: 'error', resultado: r, ultimo_error: motivo })
      await e.avisar(`❌ ${p.titulo}: ${motivo}`)
      return `error: ${motivo}`
    }
    const final = p.intentos >= MAX_INTENTOS
    await e.guardar(p.id, { estado: final ? 'error' : 'programado', resultado: r, ultimo_error: motivo })
    if (final) await e.avisar(avisoError(p.titulo, p.intentos, motivo))
    return `${final ? 'error' : 'se reintenta'}: ${motivo}`
  }
  const ig = r.instagram!

  if (p.comenta && !(r.comentaIg && 'id' in r.comentaIg)) {
    try {
      r.comentaIg = { id: await e.crearComenta('ig', ig.id, p) }
    } catch (err) {
      r.comentaIg = { error: mensaje(err) }
    }
    await e.guardar(p.id, { resultado: r })
  }

  if (p.facebook && (!r.facebook || r.facebook.error)) {
    try {
      r.facebook = { ...(await e.publicarFacebook(p)) }
    } catch (err) {
      r.facebook = { postId: null, url: null, error: mensaje(err) }
    }
    await e.guardar(p.id, { resultado: r })
  }
  if (p.facebook && p.comenta && r.facebook?.postId && !r.facebook.automatizacion) {
    try {
      r.facebook.automatizacion = await e.crearComenta('fb', r.facebook.postId, p)
      delete r.facebook.errorComenta
    } catch (err) {
      r.facebook.errorComenta = mensaje(err)
    }
    await e.guardar(p.id, { resultado: r })
  }

  if (p.colaborador && r.collab !== 'aceptada') {
    await e.dormir(ESPERA_MS) // Instagram tarda un momento en crear la invitación
    try {
      await e.aceptarCollab(ig.id)
      r.collab = 'aceptada'
    } catch (err) {
      r.collab = `pendiente: ${mensaje(err)}`
    }
    await e.guardar(p.id, { resultado: r })
  }

  r.historias ??= []
  for (const [i, url] of p.historias.entries()) {
    if (r.historias[i] && !r.historias[i].startsWith('error')) continue
    try {
      r.historias[i] = await e.publicarHistoria(url)
    } catch (err) {
      r.historias[i] = `error: ${mensaje(err)}`
    }
    await e.guardar(p.id, { resultado: r })
  }

  await e.guardar(p.id, { estado: 'publicado', resultado: r, ultimo_error: null })
  await e.avisar(avisoListo(p, r))
  return `publicado: ${ig.permalink ?? ig.id}`
}

// Arma y procesa el contenedor sin publicar ni tocar la fila: para revisar claves, medios y texto
export async function probarFila(p: Publicacion, e: Efectos): Promise<string> {
  const invalida = validar(p)
  if (invalida) return `no se puede publicar: ${invalida}`
  const id = await e.crearContenedor(p)
  await esperar(id, p, e)
  return `contenedor listo (${id}): Instagram lo aceptó, no se publicó nada`
}
