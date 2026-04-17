// SERVER-ONLY
import { readFileSync } from 'fs'
import { join } from 'path'

let _cached: string | null = null

export function getBraltoSignatureDataUrl(): string {
  if (_cached) return _cached
  const svg = readFileSync(join(process.cwd(), 'lib', 'contracts', 'firma-bralto.svg'), 'utf-8')
  _cached = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  return _cached
}

export function getBraltoSignatureTimestamp(): string {
  return new Date().toISOString()
}
