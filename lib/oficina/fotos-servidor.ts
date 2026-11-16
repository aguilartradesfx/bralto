// Las fotos de la Oficina con Supabase Storage (bucket privado `oficina`) y Gemini.
// Sin `server-only`: también lo cargan scripts de Node.
import { appendFile } from 'node:fs/promises'
import sharp from 'sharp'
import { createServiceClient } from '../supabase/service.ts'
import { generarImagen, MODELO_FOTO } from './gemini-foto.ts'
import { idEstado } from './servidor.ts'
import type { DepsFoto, EscenaFoto } from './fotos.ts'

const BUCKET = 'oficina'
const db = () => createServiceClient()

export async function achicar(img: Uint8Array): Promise<Uint8Array> {
  const salida = await sharp(img).resize({ width: 896, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer()
  return new Uint8Array(salida)
}

async function subir(ruta: string, img: Uint8Array): Promise<void> {
  const { error } = await db().storage.from(BUCKET).upload(ruta, img, { contentType: 'image/jpeg', upsert: true })
  if (error) throw new Error(`storage ${ruta}: ${error.message}`)
}

export async function subirRetrato(agente: string, img: Uint8Array): Promise<void> {
  const ruta = `retratos/${agente}.jpg`
  await subir(ruta, img)
  const { error } = await db().from('oficina_fotos')
    .upsert({ tipo: 'retrato', agentes: [agente], ruta, estado: 'lista' }, { onConflict: 'ruta' })
  if (error) throw new Error(`oficina_fotos: ${error.message}`)
}

export async function idsDelCatalogo(): Promise<string[]> {
  const { data, error } = await db().from('oficina_agentes').select('id').eq('activo', true)
  if (error) throw new Error(`oficina_agentes: ${error.message}`)
  return (data ?? []).map(f => f.id as string)
}

function falla(tabla: string, error: { message: string } | null) {
  if (error) throw new Error(`${tabla}: ${error.message}`)
}

// `gasto`: archivo .jsonl donde cada imagen pagada deja su línea.
export function depsFotoGrupo(apiKey: string, gasto?: string): DepsFoto {
  return {
    dormida: async () => {
      const { data, error } = await db().from('oficina_estado').select('dormida').eq('id', idEstado()).maybeSingle()
      falla('oficina_estado', error)
      return !!data?.dormida
    },
    // Cuenta los intentos (con o sin foto lograda): lo que se anotó antes de llamar a Gemini
    intentosDesde: async d => {
      const { count, error } = await db().from('oficina_fotos').select('id', { count: 'exact', head: true })
        .eq('tipo', 'grupo').gte('intentada_en', d.toISOString())
      falla('oficina_fotos', error)
      return count ?? 0
    },
    // Las de grupo que esperan su foto y ninguna corrida reservó, las más nuevas primero (la ronda de la tertulia
    // mira las mismas en leerDatosRonda); cuál toca lo decide escenaPendiente
    escenasEnEspera: async () => {
      const { data, error } = await db().from('oficina_fotos').select('id,agentes,escena,creada_en')
        .eq('tipo', 'grupo').eq('estado', 'pendiente').is('intentada_en', null).not('escena', 'is', null)
        .order('creada_en', { ascending: false }).limit(100)
      falla('oficina_fotos', error)
      return (data ?? []).map(f => ({ id: f.id as string, agentes: f.agentes as string[], escena: f.escena as EscenaFoto, creada_en: f.creada_en as string }))
    },
    // Sin reservarlas: si otra corrida ya tomó una, esa no se toca
    vencerEscenas: async ids => {
      const { error } = await db().from('oficina_fotos').update({ estado: 'falla', detalle: 'Se quedó vieja' })
        .in('id', ids).eq('estado', 'pendiente').is('intentada_en', null)
      falla('oficina_fotos', error)
    },
    retratos: async ids => {
      const fotos: Record<string, Uint8Array> = {}
      for (const id of ids) {
        const { data } = await db().storage.from(BUCKET).download(`retratos/${id}.jpg`)
        if (data) fotos[id] = new Uint8Array(await data.arrayBuffer())
      }
      return fotos
    },
    marcarIntento: async (id, cuando) => {
      const { data, error } = await db().from('oficina_fotos').update({ intentada_en: cuando.toISOString() })
        .eq('id', id).is('intentada_en', null).select('id')
      falla('oficina_fotos', error)
      return (data?.length ?? 0) > 0
    },
    soltarIntento: async id => {
      const { error } = await db().from('oficina_fotos').update({ intentada_en: null }).eq('id', id)
      falla('oficina_fotos', error)
    },
    generar: async (prompt, refs, id) => {
      const { imagen, tokens } = await generarImagen({ prompt, refs, apiKey })
      if (gasto) {
        // La imagen ya se pagó: si el archivo del gasto falla, se avisa y la foto sigue
        try {
          const linea = { cuando: new Date().toISOString(), que: 'foto de grupo (oficina)', modelo: MODELO_FOTO, tamano: '1K', imagenes: 1, tokens_salida: tokens, archivo: `grupo/${id}.jpg` }
          await appendFile(gasto, JSON.stringify(linea) + '\n')
        } catch (e) {
          console.error('[oficina] no se pudo anotar el gasto', e instanceof Error ? e.message : String(e))
        }
      }
      return imagen
    },
    guardarFoto: async (id, img) => {
      const c = db()
      const { data, error } = await c.from('oficina_fotos').select('escena').eq('id', id).single()
      falla('oficina_fotos', error)
      const escena = data!.escena as EscenaFoto
      const ruta = `grupo/${id}.jpg`
      await subir(ruta, await achicar(img))
      const { error: e1 } = await c.from('oficina_fotos').update({ ruta, estado: 'lista', detalle: null }).eq('id', id)
      falla('oficina_fotos', e1)
      const { error: e2 } = await c.from('oficina_posts').insert({
        de: escena.de, tipo: 'foto', titulo: escena.titulo, texto: escena.texto, foto_id: id, likes: escena.likes,
        mostrar_desde: new Date().toISOString(),
      })
      falla('oficina_posts', e2)
    },
    fallar: async (id, detalle) => {
      const { error } = await db().from('oficina_fotos').update({ estado: 'falla', detalle: detalle.slice(0, 200) }).eq('id', id)
      falla('oficina_fotos', error)
    },
  }
}
