// Las secciones que vienen: qué va a hacer cada una, en palabras simples. /pronto/<slug> las muestra.
export interface SeccionPronto {
  titulo: string
  resumen: string
  incluye: string[]
}

export const PRONTO: Record<string, SeccionPronto> = {
  agenda: {
    titulo: 'Agenda y citas',
    resumen: 'Tus llamadas y reuniones con clientes en un solo lugar, conectadas con tu calendario de Google.',
    incluye: ['Las citas de hoy y de la semana', 'Agendar desde la ficha de cada contacto', 'Recordatorio automático al cliente', 'Quién llegó y quién no'],
  },
  facturas: {
    titulo: 'Facturas',
    resumen: 'Crear, mandar y cobrar facturas sin salir del panel.',
    incluye: ['Factura desde un contrato o una propuesta aceptada', 'Envío por correo con enlace de pago', 'Facturas pendientes y vencidas', 'Recordatorios de cobro'],
  },
  pagos: {
    titulo: 'Pagos',
    resumen: 'Todo lo que te han pagado, venga de Tilopay, transferencia o SINPE.',
    incluye: ['Cada pago con su cliente y su factura', 'Pagos del diagnóstico', 'Lo que falta por cobrar', 'Exportar para la contabilidad'],
  },
  campanas: {
    titulo: 'Campañas',
    resumen: 'Tus anuncios de Meta y Google con lo que gastas y lo que te trae cada uno.',
    incluye: ['Gasto, clientes nuevos y costo por cliente', 'Qué anuncio funciona mejor', 'Los contactos que llegaron por cada campaña', 'Avisos cuando algo se dispara'],
  },
  secuencias: {
    titulo: 'Secuencias de correo',
    resumen: 'Correos que salen solos, uno detrás del otro, para darle seguimiento a cada contacto.',
    incluye: ['Pasos con espera entre correo y correo', 'Se detiene cuando la persona contesta', 'Quién abrió y quién hizo clic', 'Desde send.bralto.io'],
  },
  plantillas: {
    titulo: 'Plantillas',
    resumen: 'Los mensajes que más mandas, listos para usar en WhatsApp, Instagram y correo.',
    incluye: ['Respuestas guardadas por canal', 'Campos que se llenan solos (nombre, empresa)', 'Las que usa Knox al contestar', 'Cuáles funcionan mejor'],
  },
  formularios: {
    titulo: 'Formularios',
    resumen: 'Formularios para tu sitio o tus anuncios que mandan cada respuesta directo al CRM.',
    incluye: ['Arrastrar y soltar campos', 'Cada respuesta crea o actualiza un contacto', 'Aviso a Knox para contestar rápido', 'Cuántos lo llenan'],
  },
  finanzas: {
    titulo: 'Finanzas',
    resumen: 'Cómo va el negocio en plata: lo que entra, lo que sale y lo que queda.',
    incluye: ['Ingresos del mes contra el anterior', 'Ingreso mensual recurrente', 'Margen y gastos fijos', 'Proyección de los próximos meses'],
  },
  ingresos: {
    titulo: 'Ingresos',
    resumen: 'Cada colón y cada dólar que entra, por cliente y por servicio.',
    incluye: ['Por cliente, servicio y mes', 'Cobros recurrentes', 'Lo que viene de propuestas aceptadas', 'Gráfica del año'],
  },
  gastos: {
    titulo: 'Gastos',
    resumen: 'Herramientas, anuncios y todo lo que pagas, ordenado para saber dónde se va la plata.',
    incluye: ['Suscripciones (Vercel, Supabase, Zernio…)', 'Gasto en anuncios', 'Gasto en IA e imágenes', 'Alertas cuando algo sube de más'],
  },
  'flujo-de-caja': {
    titulo: 'Flujo de caja',
    resumen: 'Cuánta plata vas a tener cada semana, con lo que te deben y lo que tienes que pagar.',
    incluye: ['Semana a semana', 'Cobros esperados contra pagos', 'Escenarios: si se cierra o no un cliente', 'Aviso si viene una semana justa'],
  },
  documentos: {
    titulo: 'Documentos',
    resumen: 'Contratos firmados, propuestas, facturas y archivos de cada cliente, todo junto.',
    incluye: ['Carpeta por cliente', 'Buscar dentro de los documentos', 'Compartir con un enlace', 'Lo que el cliente ya vio'],
  },
  rendimiento: {
    titulo: 'Rendimiento del negocio',
    resumen: 'El resumen de cómo vas: clientes, ventas, redes y el sitio en una sola pantalla.',
    incluye: ['Clientes nuevos por semana', 'Ventas ganadas y perdidas', 'Visitas del sitio (GA4)', 'Comparación con el mes anterior'],
  },
  'analiticas-redes': {
    titulo: 'Analíticas de redes',
    resumen: 'Cómo le va a cada publicación en Instagram y Facebook.',
    incluye: ['Alcance, guardados y compartidos', 'Seguidores nuevos por día', 'Los mejores posts del mes', 'A qué hora publicar'],
  },
  'analiticas-ventas': {
    titulo: 'Analíticas de ventas',
    resumen: 'Dónde se quedan los clientes en el camino a la venta y cuánto tardan en decidir.',
    incluye: ['De contacto a cliente, paso a paso', 'Tiempo promedio en cada etapa', 'Por qué se pierden', 'Qué canal trae mejores clientes'],
  },
  reportes: {
    titulo: 'Reportes a la medida',
    resumen: 'Tus propios reportes: escoges los datos y te llegan solos cada semana.',
    incluye: ['Escoger qué datos ver', 'Envío automático por correo', 'Descargar en PDF o Excel', 'Compartir con tu equipo'],
  },
  ayuda: {
    titulo: 'Ayuda',
    resumen: 'Guías cortas de cómo usar cada parte del panel y un lugar para pedir cambios.',
    incluye: ['Cómo hacer cada cosa, paso a paso', 'Atajos de teclado', 'Pedir una mejora', 'Qué hay de nuevo'],
  },
  notificaciones: {
    titulo: 'Notificaciones',
    resumen: 'Escoger qué te avisa el panel y por dónde: correo, Telegram o el teléfono.',
    incluye: ['Cliente nuevo y mensajes sin contestar', 'Propuesta vista o aceptada', 'Contrato firmado', 'Resumen diario'],
  },
  facturacion: {
    titulo: 'Plan y facturación',
    resumen: 'Lo que pagas por las herramientas del panel y tus datos de facturación.',
    incluye: ['Herramientas conectadas y su costo', 'Datos fiscales de Bralto', 'Historial de pagos', 'Avisos de vencimiento'],
  },
}
