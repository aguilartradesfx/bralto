import { createHash } from 'node:crypto'

// Ids fijos para lo que viene de GoHighLevel (UUID v5 del tipo y el id de GHL): cada importación le da a la misma
// cosa el mismo id, así se puede volver a correr y las filas se enlazan entre sí sin consultar la base.
const ESPACIO = 'a3c1d6f2-4b7e-5d90-8e21-6f4b2c9d1e07'

export type TipoId =
  | 'contacto'
  | 'nota'
  | 'tarea'
  | 'pipeline'
  | 'etapa'
  | 'oportunidad'
  | 'conversacion'
  | 'mensaje'
  | 'cita'
  | 'adjunto'

export function uuidV5(nombre: string, espacio = ESPACIO): string {
  const bytesEspacio = Buffer.from(espacio.replace(/-/g, ''), 'hex')
  const hash = createHash('sha1').update(bytesEspacio).update(nombre, 'utf8').digest()
  const b = hash.subarray(0, 16)
  b[6] = (b[6] & 0x0f) | 0x50 // versión 5
  b[8] = (b[8] & 0x3f) | 0x80 // variante RFC 4122
  const hex = b.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export const idDe = (tipo: TipoId, ghlId: string) => uuidV5(`ghl:${tipo}:${ghlId}`)
