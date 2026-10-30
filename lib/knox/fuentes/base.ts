import { createServiceClient } from '@/lib/supabase/service'
import { diaCr, horaCorta, inicioDelDia, sumarDias } from '../fechas'
import type { ContenidoDelDia, Lead } from '../tipos'

// Leads que entraron por el sitio: las guías del «Comenta», las solicitudes de propuesta y la agenda
export async function leads(desde: Date): Promise<Lead[]> {
  const db = createServiceClient()
  const iso = desde.toISOString()
  const [contactos, guias, propuestas, citas] = await Promise.all([
    db.from('guias_contactos').select('nombre, guia, creado_en').gte('creado_en', iso),
    db.from('guias').select('slug, palabra'),
    db.from('proposal_requests').select('client_name, client_company, created_at').gte('created_at', iso),
    db.from('bookings').select('nombre, apellido, created_at').gte('created_at', iso),
  ])
  const error = contactos.error ?? guias.error ?? propuestas.error ?? citas.error
  if (error) throw new Error(error.message)

  const palabra = new Map<string, string>((guias.data ?? []).map((g) => [g.slug, g.palabra]))
  const lista: Lead[] = [
    ...(contactos.data ?? []).map((c) => ({ nombre: c.nombre, origen: `la guía ${palabra.get(c.guia) ?? c.guia}`, en: c.creado_en })),
    ...(propuestas.data ?? []).map((p) => ({
      nombre: p.client_company ? `${p.client_name} (${p.client_company})` : p.client_name,
      origen: 'una solicitud de propuesta',
      en: p.created_at,
    })),
    ...(citas.data ?? []).map((c) => ({ nombre: [c.nombre, c.apellido].filter(Boolean).join(' '), origen: 'la agenda del sitio', en: c.created_at })),
  ]
  return lista.sort((a, b) => b.en.localeCompare(a.en))
}

// Lo que sale hoy en redes y cuánto hay programado para mañana
export async function contenido(ahora: Date): Promise<ContenidoDelDia> {
  const hoy = diaCr(ahora)
  const manana = inicioDelDia(sumarDias(hoy, 1))
  const { data, error } = await createServiceClient()
    .from('redes_publicaciones')
    .select('titulo, tipo, estado, publicar_en')
    .gte('publicar_en', inicioDelDia(hoy).toISOString())
    .lt('publicar_en', inicioDelDia(sumarDias(hoy, 2)).toISOString())
    .neq('estado', 'cancelado')
    .order('publicar_en')
  if (error) throw new Error(error.message)
  const filas = data ?? []
  return {
    hoy: filas
      .filter((p) => new Date(p.publicar_en) < manana)
      .map((p) => ({
        titulo: p.titulo,
        tipo: p.tipo,
        en: new Date(p.publicar_en).toISOString(),
        hora: horaCorta(new Date(p.publicar_en)),
        estado: p.estado,
      })),
    manana: filas.filter((p) => new Date(p.publicar_en) >= manana).length,
  }
}
