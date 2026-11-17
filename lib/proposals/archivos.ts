import { randomBytes } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { BUCKET_PROPUESTAS, esUuid, etiquetaDe, nombreSeguro, type PedidoPdf } from '@/lib/proposals/archivos-reglas'

// Los PDF de cada propuesta, en el bucket privado «propuestas». El navegador sube directo a Storage con una URL
// firmada (el archivo no pasa por este servidor) y después avisa que llegó. Quien llama ya revisó los permisos.

export type ArchivoPropuesta = { id: string; proposal_id: string; name: string; label: string; bytes: number | null; created_at: string }

type Resultado<T> = ({ ok: true } & T) | { ok: false; status: number; error: string }

const db = () => createServiceClient()
const almacen = () => db().storage.from(BUCKET_PROPUESTAS)
const unico = () => `${Date.now().toString(36)}${randomBytes(4).toString('hex')}`

async function existePropuesta(id: string): Promise<boolean> {
  const { data, error } = await db().from('generated_proposals').select('id').eq('id', id).maybeSingle()
  if (error) throw new Error(`generated_proposals: ${error.message}`)
  return !!data
}

// La URL firmada para subir un PDF a la carpeta de la propuesta
export async function pedirSubidaPdf(propuestaId: string, p: PedidoPdf): Promise<Resultado<{ ruta: string; url: string }>> {
  if (!esUuid(propuestaId) || !(await existePropuesta(propuestaId))) return { ok: false, status: 404, error: 'Esa propuesta ya no existe.' }
  const ruta = `${propuestaId}/${unico()}-${nombreSeguro(p.nombre)}`
  const { data, error } = await almacen().createSignedUploadUrl(ruta)
  if (error || !data) throw new Error(`${BUCKET_PROPUESTAS}: ${error?.message ?? 'sin URL firmada'}`)
  return { ok: true, ruta, url: data.signedUrl }
}

// El PDF ya subió: se revisa que esté en el bucket y se anota
export async function registrarPdf(propuestaId: string, ruta: string, nombre: string, etiqueta?: string): Promise<Resultado<{ archivo: ArchivoPropuesta }>> {
  if (!esUuid(propuestaId)) return { ok: false, status: 404, error: 'Esa propuesta ya no existe.' }
  const [carpeta, archivo, ...resto] = ruta.split('/')
  if (carpeta !== propuestaId || !archivo || resto.length) return { ok: false, status: 400, error: 'Ese archivo no es de esta propuesta.' }

  const { data: lista, error: e1 } = await almacen().list(carpeta, { limit: 100, search: archivo })
  if (e1) throw new Error(`${BUCKET_PROPUESTAS}: ${e1.message}`)
  const o = (lista ?? []).find((x) => x.name === archivo && x.id)
  if (!o) return { ok: false, status: 409, error: 'El PDF no llegó. Prueba subirlo de nuevo.' }
  const size = (o.metadata as { size?: unknown } | null)?.size

  const { data, error } = await db()
    .from('proposal_files')
    .upsert(
      { proposal_id: propuestaId, name: nombre.slice(0, 200), label: etiqueta ?? etiquetaDe(nombre), path: ruta, bytes: typeof size === 'number' ? size : null },
      { onConflict: 'path' },
    )
    .select('id, proposal_id, name, label, bytes, created_at')
    .single()
  if (error) throw new Error(`proposal_files: ${error.message}`)
  return { ok: true, archivo: data as ArchivoPropuesta }
}

// Un enlace que dura 5 minutos y baja el PDF con su nombre
export async function enlaceDescarga(archivoId: string): Promise<string | null> {
  if (!esUuid(archivoId)) return null
  const { data, error } = await db().from('proposal_files').select('path, name').eq('id', archivoId).maybeSingle()
  if (error) throw new Error(`proposal_files: ${error.message}`)
  if (!data) return null
  const firmado = await almacen().createSignedUrl(data.path as string, 300, { download: data.name as string })
  if (firmado.error) throw new Error(`${BUCKET_PROPUESTAS}: ${firmado.error.message}`)
  return firmado.data.signedUrl
}

// Para la página pública de una propuesta que es solo PDF: el de ese idioma (?lang=es) o el primero
export async function enlacePdfPublico(propuestaId: string, idioma: string | null): Promise<string | null> {
  const { data, error } = await db().from('proposal_files').select('path, label').eq('proposal_id', propuestaId).order('created_at')
  if (error) throw new Error(`proposal_files: ${error.message}`)
  const archivos = (data ?? []) as { path: string; label: string }[]
  const elegido = (idioma && archivos.find((a) => a.label.toLowerCase().endsWith(idioma.toLowerCase()))) || archivos[0]
  if (!elegido) return null
  const firmado = await almacen().createSignedUrl(elegido.path, 600)
  if (firmado.error) throw new Error(`${BUCKET_PROPUESTAS}: ${firmado.error.message}`)
  return firmado.data.signedUrl
}

export async function borrarPdf(archivoId: string): Promise<void> {
  if (!esUuid(archivoId)) return
  const { data, error } = await db().from('proposal_files').select('path').eq('id', archivoId).maybeSingle()
  if (error) throw new Error(`proposal_files: ${error.message}`)
  if (!data) return
  const r = await almacen().remove([data.path as string])
  if (r.error) throw new Error(`${BUCKET_PROPUESTAS}: ${r.error.message}`)
  const { error: e2 } = await db().from('proposal_files').delete().eq('id', archivoId)
  if (e2) throw new Error(`proposal_files: ${e2.message}`)
}

// Antes de borrar una propuesta: sus PDF del bucket (las filas se van solas con la propuesta)
export async function borrarPdfsDe(propuestaId: string): Promise<void> {
  const { data, error } = await db().from('proposal_files').select('path').eq('proposal_id', propuestaId)
  if (error) throw new Error(`proposal_files: ${error.message}`)
  const rutas = (data ?? []).map((x) => x.path as string)
  if (!rutas.length) return
  const r = await almacen().remove(rutas)
  if (r.error) throw new Error(`${BUCKET_PROPUESTAS}: ${r.error.message}`)
}
