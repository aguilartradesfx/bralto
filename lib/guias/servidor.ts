import { createHash } from 'node:crypto'
import { Redis } from '@upstash/redis'
import { createServiceClient } from '@/lib/supabase/service'
import { filaAGuia, type Guia } from './contenido'
import type { Deps } from './registro'

// Conexiones reales de las guías: Supabase (con la service role: las tablas no tienen políticas
// para anon), Upstash para el límite de intentos y Telegram para avisarle a Alejandro.
// La lógica vive en contenido.ts y registro.ts, con pruebas.

const GUIAS = 'guias'
const CONTACTOS = 'guias_contactos'
const MAX_POR_HORA = 8 // registros o ingresos por IP; alcanza para una familia detrás del mismo router

export async function obtenerGuia(slug: string): Promise<Guia | null> {
  const { data, error } = await createServiceClient().from(GUIAS).select('*').eq('slug', slug).eq('publicada', true).maybeSingle()
  if (error) throw new Error(`guias: ${error.message}`)
  return data ? filaAGuia(data) : null
}

export async function listarPublicadas(): Promise<{ slug: string; actualizada_en: string }[]> {
  const { data, error } = await createServiceClient().from(GUIAS).select('slug, actualizada_en').eq('publicada', true)
  if (error) throw new Error(`guias: ${error.message}`)
  return data ?? []
}

// La IP no se guarda: solo su huella, para contar intentos
export function claveDeIp(ip: string | null): string {
  return createHash('sha256').update(`guias:${ip ?? 'sin-ip'}`).digest('hex').slice(0, 32)
}

function redis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? new Redis({ url, token }) : null
}

// avisarDespues: `after` de next/server, para que el aviso salga sin hacer esperar a la persona
export function depsReales(avisarDespues: (tarea: () => Promise<void>) => void): Deps {
  const db = createServiceClient()
  return {
    async limite(clave) {
      const r = redis()
      if (!r) return true // sin Redis no hay límite (igual que la agenda)
      try {
        const k = `bralto:guias:intentos:${clave}`
        const n = await r.incr(k)
        if (n === 1) await r.expire(k, 3600)
        return n <= MAX_POR_HORA
      } catch {
        return true
      }
    },

    async buscar(correo) {
      const { data, error } = await db.from(CONTACTOS).select('id').eq('correo', correo).order('creado_en').limit(1)
      if (error) throw new Error(`guias_contactos: ${error.message}`)
      return data?.[0]?.id ?? null
    },

    // Una fila por correo y guía: si ya existía, se reusa y no cuenta como nuevo
    async guardar(d) {
      const { data: nuevos, error } = await db
        .from(CONTACTOS)
        .upsert(
          { nombre: d.nombre, correo: d.correo, whatsapp: d.whatsapp, guia: d.guia, origen: d.origen, acepta: true },
          { onConflict: 'correo,guia', ignoreDuplicates: true },
        )
        .select('id')
      if (error) throw new Error(`guias_contactos: ${error.message}`)
      if (nuevos?.length) return { id: nuevos[0].id, nuevo: true }
      const { data: viejo, error: e2 } = await db.from(CONTACTOS).select('id').eq('correo', d.correo).eq('guia', d.guia).single()
      if (e2 || !viejo) throw new Error(`guias_contactos: ${e2?.message ?? 'sin fila'}`)
      return { id: viejo.id, nuevo: false }
    },

    async avisar(texto) {
      const token = process.env.TELEGRAM_BOT_TOKEN
      const chat = process.env.TELEGRAM_CHAT_ID
      if (!token || !chat) return
      avisarDespues(async () => {
        try {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chat, text: texto, disable_web_page_preview: true }),
          })
        } catch (err) {
          console.error('guias: no salió el aviso a Telegram', err)
        }
      })
    },
  }
}
