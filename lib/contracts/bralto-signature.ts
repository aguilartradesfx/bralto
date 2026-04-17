// SERVER-ONLY
import { readFileSync } from 'fs'
import { join } from 'path'

let _cached: string | null = null

export function getBraltoSignatureDataUrl(): string {
  if (_cached) return _cached
  const png = readFileSync(join(process.cwd(), 'lib', 'contracts', 'firma-bralto.png'))
  _cached = `data:image/png;base64,${png.toString('base64')}`
  return _cached
}

export function getBraltoSignatureTimestamp(): string {
  return new Date().toISOString()
}
