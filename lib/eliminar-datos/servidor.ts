// SERVER-ONLY — conexiones reales de las solicitudes para borrar datos: Supabase (service role; la tabla
// no tiene políticas para anon), Upstash para el límite de intentos del formulario y Telegram para
// avisarle a Alejandro. La lógica está en solicitud.ts, con pruebas.
import { createHash } from 'node:crypto'
import { Redis } from '@upstash/redis'
import { createServiceClient } from '@/lib/supabase/service'
import { avisarPorTelegram } from '@/lib/telegram'
import { generarCodigo, textoAviso, type Solicitud } from './solicitud'

const TABLA = 'solicitudes_eliminacion'
export const MAX_SOLICITUDES_POR_HORA = 10

export type Estado = { codigo: string; estado: 'recibida' | 'completada'; creada_en: string; completada_en: string | null }

// Guarda la solicitud con un código nuevo y le avisa a Alejandro. Si el código ya existía (casi imposible), prueba otro.
// avisarDespues: `after` de next/server, para que Meta y la persona no esperen al aviso de Telegram.
export async function registrarSolicitud(
  s: Omit<Solicitud, 'codigo'>,
  avisarDespues: (tarea: () => Promise<void>) => void,
): Promise<string> {
  const db = createServiceClient()
  for (let intento = 0; intento < 3; intento++) {
    const codigo = generarCodigo()
    const { error } = await db.from(TABLA).insert({
      codigo,
      origen: s.origen,
      nombre: s.nombre ?? null,
      contacto: s.contacto ?? null,
      cuenta: s.cuenta ?? null,
      detalle: s.detalle ?? null,
      meta_usuario: s.metaUsuario ?? null,
    })
    if (!error) {
      avisarDespues(async () => {
        await avisarPorTelegram(textoAviso({ ...s, codigo }), 'eliminar-datos')
      })
      return codigo
    }
    if (error.code !== '23505') throw new Error(`${TABLA}: ${error.message}`)
  }
  throw new Error(`${TABLA}: no se pudo generar un código único`)
}

export async function estadoDeSolicitud(codigo: string): Promise<Estado | null> {
  const { data, error } = await createServiceClient()
    .from(TABLA)
    .select('codigo, estado, creada_en, completada_en')
    .eq('codigo', codigo)
    .maybeSingle()
  if (error) throw new Error(`${TABLA}: ${error.message}`)
  return (data as Estado | null) ?? null
}

// La IP no se guarda: solo su huella, para contar intentos. Ventana fija de una hora.
export async function dentroDelLimite(ip: string | null): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return true // sin Redis no hay límite (igual que las guías)
  try {
    const huella = createHash('sha256').update(`eliminar-datos:${ip ?? 'sin-ip'}`).digest('hex').slice(0, 32)
    const k = `bralto:eliminar-datos:intentos:${huella}`
    const [n] = await new Redis({ url, token }).multi().incr(k).expire(k, 3600, 'NX').exec<[number, number]>()
    return n <= MAX_SOLICITUDES_POR_HORA
  } catch {
    return true
  }
}
