// Cómo se reconoce en el CRM a quien escribe por la bandeja (tabla crm_identidades): WhatsApp por su número (E.164),
// Instagram por su id o su @ y Messenger por su id. Puro, con pruebas (asociar.test.ts).
import type { CanalKnox } from '../../knox/conversar/tipos.ts'
import type { Participante } from './zernio.ts'

// Un valor dentro de un filtro de PostgREST, entre comillas (los ids, @ y teléfonos no traen comillas ni barras)
export const comillas = (v: string) => `"${v.replace(/["\\]/g, '')}"`

// Las condiciones (para .or() de PostgREST) que buscan a la persona en crm_identidades. Vacío: no hay con qué buscar
export function condicionesIdentidad(canal: CanalKnox, p: Pick<Participante, 'id' | 'usuario' | 'telefono'>): string[] {
  const c: string[] = []
  if (canal === 'whatsapp' && p.telefono) c.push(`and(canal.in.(whatsapp,telefono),valor.eq.${comillas(p.telefono)})`)
  if (canal === 'instagram' && p.id) c.push(`and(canal.eq.instagram,valor.eq.${comillas(p.id)})`)
  if (canal === 'instagram' && p.usuario) {
    const u = p.usuario.toLowerCase()
    c.push(`and(canal.eq.instagram,alias.in.(${comillas(`@${u}`)},${comillas(u)}))`)
  }
  if (canal === 'messenger' && p.id) c.push(`and(canal.eq.messenger,valor.eq.${comillas(p.id)})`)
  return c
}

export type IdentidadNueva = { contacto_id: string; canal: 'whatsapp' | 'telefono' | 'instagram' | 'messenger'; valor: string; alias?: string | null }

// Las identidades de un contacto nuevo que salió de la bandeja, para reconocerlo la próxima vez
export function identidadesNuevas(contactoId: string, canal: CanalKnox, p: Pick<Participante, 'id' | 'usuario' | 'telefono'>): IdentidadNueva[] {
  if (canal === 'whatsapp') {
    return p.telefono
      ? [
          { contacto_id: contactoId, canal: 'whatsapp', valor: p.telefono },
          { contacto_id: contactoId, canal: 'telefono', valor: p.telefono },
        ]
      : []
  }
  if (!p.id) return []
  if (canal === 'instagram') return [{ contacto_id: contactoId, canal: 'instagram', valor: p.id, alias: p.usuario ? `@${p.usuario.toLowerCase()}` : null }]
  return [{ contacto_id: contactoId, canal: 'messenger', valor: p.id }]
}

// El nombre del contacto nuevo: el de la red, el que contó la persona o su @
export function nombreDeContacto(p: Pick<Participante, 'nombre' | 'usuario'>, contado: string | null | undefined): string {
  return (p.nombre?.trim() || contado?.trim() || (p.usuario ? `@${p.usuario}` : '')).slice(0, 80)
}
