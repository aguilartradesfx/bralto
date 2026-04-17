import type { EntregableItem, ServiciosData } from '@/types/contracts'

// Suggests default deliverable rows based on activated services
export function generateDefaultEntregables(servicios: ServiciosData): EntregableItem[] {
  const rows: EntregableItem[] = []

  if (servicios.ads) {
    rows.push({ servicio: 'ADS', descripcion: 'Campañas activas (Meta / Google / TikTok)', cantidad: null, unidad: 'campañas' })
    rows.push({ servicio: 'ADS', descripcion: 'Reporte mensual de resultados', cantidad: 1, unidad: '/ mes' })
  }
  if (servicios.sistema_llamadas_ia) {
    rows.push({ servicio: 'Sistema Llamadas IA', descripcion: 'Configuración del agente de voz', cantidad: 1, unidad: 'implementación' })
    rows.push({ servicio: 'Sistema Llamadas IA', descripcion: 'Minutos de voz mensuales', cantidad: null, unidad: 'minutos' })
  }
  if (servicios.agente_whatsapp) {
    rows.push({ servicio: 'Agente WhatsApp', descripcion: 'Configuración del agente conversacional', cantidad: 1, unidad: 'implementación' })
    rows.push({ servicio: 'Agente WhatsApp', descripcion: 'Flujos de conversación', cantidad: null, unidad: 'flujos' })
  }
  if (servicios.sitio_web) {
    rows.push({ servicio: 'Sitio Web', descripcion: 'Diseño y desarrollo del sitio', cantidad: 1, unidad: 'sitio' })
    rows.push({ servicio: 'Sitio Web', descripcion: 'Páginas internas', cantidad: null, unidad: 'páginas' })
  }
  if (servicios.crm_plataforma) {
    rows.push({ servicio: 'CRM Bralto', descripcion: 'Configuración de pipelines', cantidad: null, unidad: 'pipelines' })
    rows.push({ servicio: 'CRM Bralto', descripcion: 'Capacitación inicial', cantidad: 1, unidad: 'sesión' })
  }
  if (servicios.automatizaciones) {
    rows.push({ servicio: 'Automatizaciones', descripcion: 'Flujos automatizados', cantidad: null, unidad: 'flujos' })
  }
  if (servicios.produccion_contenido) {
    rows.push({ servicio: 'Producción de Contenido', descripcion: 'Reels', cantidad: null, unidad: '/ mes' })
    rows.push({ servicio: 'Producción de Contenido', descripcion: 'Flyers / gráficos', cantidad: null, unidad: '/ mes' })
    rows.push({ servicio: 'Producción de Contenido', descripcion: 'Stories', cantidad: null, unidad: '/ mes' })
  }
  if (servicios.gestion_redes) {
    rows.push({ servicio: 'Gestión de Redes', descripcion: 'Posts publicados', cantidad: null, unidad: '/ mes' })
    rows.push({ servicio: 'Gestión de Redes', descripcion: 'Redes sociales gestionadas', cantidad: null, unidad: 'redes' })
  }
  if (servicios.seo) {
    rows.push({ servicio: 'SEO', descripcion: 'Auditoría técnica inicial', cantidad: 1, unidad: 'auditoría' })
    rows.push({ servicio: 'SEO', descripcion: 'Palabras clave optimizadas', cantidad: null, unidad: 'keywords' })
  }
  if (servicios.tracking) {
    rows.push({ servicio: 'Tracking', descripcion: 'Configuración GTM + GA4 + Pixel', cantidad: 1, unidad: 'implementación' })
  }
  if (servicios.email_marketing) {
    rows.push({ servicio: 'Email Marketing', descripcion: 'Secuencias automatizadas', cantidad: null, unidad: 'secuencias' })
    rows.push({ servicio: 'Email Marketing', descripcion: 'Campañas mensuales', cantidad: null, unidad: '/ mes' })
  }
  if (servicios.agente_servicio_cliente) {
    rows.push({ servicio: 'Agente IA Servicio Cliente', descripcion: 'Configuración del agente conversacional', cantidad: 1, unidad: 'implementación' })
  }
  if (servicios.activaciones_tienda) {
    rows.push({ servicio: 'Activaciones en Tienda', descripcion: 'Activaciones / eventos', cantidad: null, unidad: 'activaciones' })
  }

  return rows
}
