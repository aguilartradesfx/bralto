// Los pasos de la carga de la noche y de una subida, con la base y Storage inyectados: servidor.ts les pone los de
// verdad y las pruebas unos en memoria. Así quedan fijadas las garantías: la carga nunca pisa el estado, los videos, las
// pendientes ni las horas; la ruta se revisa antes de tocar Storage; un video no se anota dos veces; lo que no sirve se
// borra; y dos escrituras a la vez no se pisan (condicional sobre actualizado_en: si otro escribió, se vuelve a leer).
import { noRecibeVideos, puedeSubir, quitarPendiente, sumarPendiente, sumarVideo } from './reglas.ts'
import { esRutaDe, nombreDeRuta, revisarSubido, rutaSubida, type PedidoSubida } from './subida.ts'
import type { EstadoGuion, Guion, GuionFila, VideoGuion } from './tipos.ts'

const INTENTOS = 5
export const NO_EXISTE = 'Ese guion ya no existe'
export const CAMBIO = 'El guion cambió mientras tanto. Mira cómo quedó y prueba de nuevo.'
export const NO_ESTA = 'Todavía no veo el video completo en el servidor. Toca «Reintentar».'
const AJENO = 'Ese video no es de este guion'

// `codigo: 'no_esta'`: el archivo no llegó a Storage (la página, al reintentar, entonces lo vuelve a subir)
export type Resultado<T extends object = object> = ({ ok: true } & T) | { ok: false; status: number; error: string; codigo?: 'no_esta' }
const falla = (status: number, error: string) => ({ ok: false as const, status, error })

// ---------- La carga de la noche ----------

// Lo único que escribe la carga: lo que trae el guion, el día y la carpeta. Si el guion ya existía (mismo día y título),
// el upsert solo pone estas columnas: el estado, los videos, las pendientes, el detalle y las horas quedan como estaban.
export const COLUMNAS_CARGA = ['dia', 'titulo', 'tema', 'comenta', 'guia', 'duracion_s', 'lineas', 'ganchos', 'carpeta'] as const
export type FilaCarga = Guion & { dia: string; carpeta: string | null }

export function filaParaCargar(g: Guion, o: { dia: string; carpeta: string | null }): FilaCarga {
  return {
    dia: o.dia,
    titulo: g.titulo,
    tema: g.tema,
    comenta: g.comenta,
    guia: g.guia,
    duracion_s: g.duracion_s,
    lineas: g.lineas,
    ganchos: g.ganchos,
    carpeta: o.carpeta,
  }
}

// ---------- Las subidas ----------

export type FilaSubida = Pick<GuionFila, 'estado' | 'videos' | 'pendientes' | 'grabado_en' | 'actualizado_en'>

export type Base = {
  leer(id: string): Promise<FilaSubida | null>
  // Escribe solo si actualizado_en sigue igual; null si otro escribió antes (o el guion ya no existe)
  escribir(id: string, cambios: Record<string, unknown>, actualizado_en: string): Promise<FilaSubida | null>
}

export type Almacen = {
  firmar(ruta: string): Promise<string>
  buscar(ruta: string): Promise<{ bytes: number | null; tipo: string | null } | null>
  borrar(ruta: string): Promise<void>
}

type Decision<T extends object> = { escribir: Record<string, unknown>; luego: (f: FilaSubida) => Resultado<T> } | { listo: Resultado<T> }

// Lee, decide y escribe con la condición; si otro escribió en el medio, vuelve a leer y a decidir
async function cambiar<T extends object>(base: Base, id: string, decidir: (f: FilaSubida) => Decision<T>): Promise<Resultado<T>> {
  for (let i = 0; i < INTENTOS; i++) {
    const f = await base.leer(id)
    if (!f) return falla(404, NO_EXISTE)
    const d = decidir(f)
    if ('listo' in d) return d.listo
    const nueva = await base.escribir(id, d.escribir, f.actualizado_en)
    if (nueva) return d.luego(nueva)
  }
  return falla(409, CAMBIO)
}

// Pedir la subida: la URL firmada y la subida anotada como pendiente (el editor no toma el guion mientras esté).
// `reemplaza`: la ruta de un intento que no llegó; se suelta en la misma escritura (si es de este guion).
export async function pedir(
  base: Base,
  almacen: Almacen,
  id: string,
  p: PedidoSubida,
  o: { unico: string; ahora: Date; reemplaza?: string | null },
): Promise<Resultado<{ ruta: string; url: string }>> {
  const f = await base.leer(id)
  if (!f) return falla(404, NO_EXISTE)
  if (!puedeSubir(f.estado)) {
    const x = noRecibeVideos(f.estado)
    return falla(x.status, x.error)
  }
  const reemplaza = o.reemplaza && esRutaDe(id, o.reemplaza) ? o.reemplaza : null
  const ruta = rutaSubida(id, p.nombre, p.tipo, o.unico)
  const url = await almacen.firmar(ruta)
  return cambiar<{ ruta: string; url: string }>(base, id, (fila) => {
    const s = sumarPendiente(fila, ruta, o.ahora, reemplaza)
    if ('error' in s) return { listo: falla(s.status, s.error) }
    return { escribir: s.cambios, luego: () => ({ ok: true, ruta, url }) }
  })
}

// El video terminó de subir: la ruta se revisa antes de tocar Storage; el archivo tiene que estar y servir (si no
// sirve, se borra y sale de pendientes); se anota una sola vez con el tamaño que dice Storage.
export async function registrar(
  base: Base,
  almacen: Almacen,
  id: string,
  ruta: string,
  ahora: Date,
): Promise<Resultado<{ estado: EstadoGuion; videos: number }>> {
  if (!esRutaDe(id, ruta)) return falla(400, AJENO)
  const archivo = await almacen.buscar(ruta)
  if (!archivo) return { ...falla(409, NO_ESTA), codigo: 'no_esta' }
  const revisado = revisarSubido(archivo)
  if (!revisado.ok) {
    if (revisado.borrar) {
      await almacen.borrar(ruta)
      await cambiar(base, id, (f) => {
        const q = quitarPendiente(f, ruta, ahora)
        return q ? { escribir: q.cambios, luego: () => ({ ok: true }) } : { listo: { ok: true } }
      })
    }
    return falla(revisado.status, revisado.error)
  }
  const video: VideoGuion = { ruta, nombre: nombreDeRuta(ruta), bytes: revisado.bytes, subido_en: ahora.toISOString() }
  const fin = (g: FilaSubida) => ({ ok: true as const, estado: g.estado, videos: g.videos.length })
  return cambiar<{ estado: EstadoGuion; videos: number }>(base, id, (f) => {
    const s = sumarVideo(f, video, ahora)
    if ('error' in s) return { listo: falla(s.status, s.error) }
    if ('repetido' in s) return s.cambios ? { escribir: s.cambios, luego: fin } : { listo: fin(f) }
    return { escribir: s.cambios, luego: fin }
  })
}

// «Cancelar» o «Quitar» una subida: sale de pendientes y, si el archivo alcanzó a llegar sin anotarse, se borra.
// Un video ya anotado nunca se borra.
export async function soltar(base: Base, almacen: Almacen, id: string, ruta: string, ahora: Date): Promise<Resultado> {
  if (!esRutaDe(id, ruta)) return falla(400, AJENO)
  const r = await cambiar<{ anotado: boolean }>(base, id, (f) => {
    const anotado = f.videos.some((v) => v.ruta === ruta)
    const q = quitarPendiente(f, ruta, ahora)
    return q ? { escribir: q.cambios, luego: () => ({ ok: true, anotado }) } : { listo: { ok: true, anotado } }
  })
  if (!r.ok) return r
  if (!r.anotado && (await almacen.buscar(ruta))) await almacen.borrar(ruta)
  return { ok: true }
}
