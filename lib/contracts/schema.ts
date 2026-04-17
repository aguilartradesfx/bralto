import { z } from 'zod'

export const clienteSchema = z.object({
  empresa_nombre: z.string().min(1, 'Nombre de empresa requerido'),
  tipo_sociedad: z.enum(['Sociedad Anónima', 'S.R.L.', 'LLC', 'E.I.R.L.', 'Persona Física', 'Otra']),
  cedula_juridica: z.string().min(1, 'Cédula jurídica requerida'),
  domicilio_legal: z.string().min(1, 'Domicilio legal requerido'),
  jurisdiccion: z.string().min(1),
  giro_comercial: z.string().min(1, 'Giro comercial requerido'),
  representante_nombre: z.string().min(1, 'Nombre del representante requerido'),
  representante_profesion: z.string().min(1, 'Profesión requerida'),
  representante_estado_civil: z.enum(['soltero(a)', 'casado(a)', 'divorciado(a)', 'viudo(a)', 'unión libre']),
  representante_direccion: z.string().min(1, 'Dirección requerida'),
  representante_documento: z.string().min(1, 'Documento de identidad requerido'),
  representante_cargo: z.string().min(1),
  correo_facturacion: z.string().email('Correo de facturación inválido'),
  correo_notificaciones: z.string().email('Correo de notificaciones inválido'),
})

export const proyectoSchema = z.object({
  nombre_paquete: z.string().min(1, 'Nombre del paquete requerido'),
  vigencia_numero: z.string().min(1),
  vigencia_texto: z.string().min(1),
  tiene_referencias_visuales: z.boolean(),
  descripcion_adicional: z.string().optional(),
})

export const pagoSchema = z
  .object({
    monto_inicial: z.number().positive('El monto debe ser mayor a 0'),
    monto_inicial_letras: z.string().min(1, 'Monto en letras requerido'),
    tiene_mensualidad: z.boolean(),
    monto_mensual: z.number().positive().nullable().optional(),
    monto_mensual_letras: z.string().nullable().optional(),
  })
  .refine(
    (d) => !d.tiene_mensualidad || (d.monto_mensual != null && d.monto_mensual > 0),
    { message: 'Monto mensual requerido cuando tiene mensualidad', path: ['monto_mensual'] },
  )

export const serviciosSchema = z
  .object({
    ads: z.boolean(),
    sistema_llamadas_ia: z.boolean(),
    agente_whatsapp: z.boolean(),
    sitio_web: z.boolean(),
    crm_plataforma: z.boolean(),
    automatizaciones: z.boolean(),
    produccion_contenido: z.boolean(),
    gestion_redes: z.boolean(),
    seo: z.boolean(),
    tracking: z.boolean(),
    email_marketing: z.boolean(),
    agente_servicio_cliente: z.boolean(),
    activaciones_tienda: z.boolean(),
    otros: z.boolean(),
    otros_descripcion: z.string().nullable().optional(),
    requiere_consumo_ia: z.boolean().optional(),
    servicios_no_incluye_contenido: z.boolean().optional(),
  })
  .refine(
    (d) =>
      [
        d.ads, d.sistema_llamadas_ia, d.agente_whatsapp, d.sitio_web,
        d.crm_plataforma, d.automatizaciones, d.produccion_contenido,
        d.gestion_redes, d.seo, d.tracking, d.email_marketing,
        d.agente_servicio_cliente, d.activaciones_tienda, d.otros,
      ].some(Boolean),
    { message: 'Al menos un servicio debe estar activado' },
  )
  .refine(
    (d) => !d.otros || (d.otros_descripcion?.trim().length ?? 0) > 0,
    { message: 'Descripción requerida para "Otros servicios"', path: ['otros_descripcion'] },
  )

export const entregableSchema = z.object({
  servicio: z.string(),
  descripcion: z.string(),
  cantidad: z.union([z.number(), z.string(), z.null()]).optional(),
  unidad: z.string().nullable().optional(),
})

export const firmaSchema = z.object({
  dia: z.string().nullable().optional(),
  mes: z.string().nullable().optional(),
  anio: z.string().nullable().optional(),
  cliente_canvas: z.string().nullable().optional(),
  cliente_timestamp: z.string().nullable().optional(),
  cliente_ip: z.string().nullable().optional(),
  cliente_user_agent: z.string().nullable().optional(),
  cliente_aceptacion_terminos: z.boolean(),
  bralto_canvas: z.string().nullable().optional(),
  bralto_timestamp: z.string().nullable().optional(),
})

export const contractDataSchema = z.object({
  cliente: clienteSchema,
  proyecto: proyectoSchema,
  pago: pagoSchema,
  servicios: serviciosSchema,
  entregables: z.array(entregableSchema).optional(),
  firma: firmaSchema.optional(),
})

export type ContractDataInput = z.infer<typeof contractDataSchema>
export type ClienteInput = z.infer<typeof clienteSchema>
export type ServiciosInput = z.infer<typeof serviciosSchema>
export type PagoInput = z.infer<typeof pagoSchema>
