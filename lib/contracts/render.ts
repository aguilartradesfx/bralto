// SERVER-ONLY — never import this file from client components
import Handlebars from 'handlebars'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { ContractData } from '@/types/contracts'

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
