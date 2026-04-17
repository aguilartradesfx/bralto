// SERVER-ONLY — never import this file from client components
import Handlebars from 'handlebars'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { ContractData } from '@/types/contracts'

// Renders a signature data URL as an <img>, or a blank signature line if absent
Handlebars.registerHelper('sigImg', (dataUrl: string | null | undefined) => {
  if (dataUrl) {
    return new Handlebars.SafeString(
      `<img src="${dataUrl}" alt="Firma" style="max-height:100px;max-width:320px;display:block;margin:8px 0;object-fit:contain;" />`
    )
  }
  return new Handlebars.SafeString(
    `<div style="border-bottom:2px solid #374151;width:200px;height:64px;margin:8px 0;"></div>`
  )
})

// Formats an ISO timestamp to a readable Spanish date/time
Handlebars.registerHelper('formatTS', (iso: string | null | undefined) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-CR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Costa_Rica',
    })
  } catch {
    return iso
  }
})

function applyDerivedFlags(data: ContractData): ContractData {
  const s = data.servicios
  return {
    ...data,
    servicios: {
      ...s,
      requiere_consumo_ia:
        s.sistema_llamadas_ia || s.agente_whatsapp || s.agente_servicio_cliente || s.automatizaciones,
      servicios_no_incluye_contenido:
        !s.produccion_contenido && !s.gestion_redes,
    },
  }
}

export function loadTemplate(version: string): string {
  return readFileSync(join(process.cwd(), 'templates', 'contract', `${version}.md`), 'utf-8')
}

export function renderContractMarkdown(data: ContractData, templateString: string): string {
  const withFlags = applyDerivedFlags(data)
  const compiled = Handlebars.compile(templateString)
  return compiled(withFlags)
}
