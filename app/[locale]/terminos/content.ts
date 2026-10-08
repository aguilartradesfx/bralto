import type { LegalDoc } from '@/components/home/legal-page'

// BORRADOR pendiente de revisión legal. Lo que va entre corchetes falta completar o confirmar.
// La política de reprogramación, cancelación y reembolsos del diagnóstico se define con
// Alejandro antes de la revisión (el copy visible nunca dice «no reembolsable»).
export const TERMS: LegalDoc = {
  title: 'Términos y condiciones',
  intro:
    'Estos términos regulan el uso de bralto.io y la contratación del diagnóstico de 30 minutos. Al usar el sitio o agendar un diagnóstico, usted los acepta.',
  sections: [
    {
      heading: 'Quiénes somos',
      body: ['Bralto es [razón social], con [cédula jurídica o física], domicilio en [dirección]. Contacto: cs@bralto.io.'],
    },
    {
      heading: 'Uso del sitio',
      body: [
        'El contenido del sitio es informativo. Las cifras, los paneles y los ejemplos marcados como ilustrativos o de ejemplo muestran cómo podría funcionar un sistema; no son resultados garantizados.',
        'Los casos muestran proyectos reales de nuestros clientes. [Confirmar que hay autorización de cada cliente.]',
      ],
    },
    {
      heading: 'Diagnóstico de 30 minutos',
      body: [
        'El diagnóstico es una videollamada de 30 minutos para entender su negocio y decirle por dónde empezar. Cuesta $97 USD y se paga por adelantado con tarjeta a través de Tilopay.',
        'La cita queda confirmada cuando el pago se aprueba. Los horarios se muestran en hora de Costa Rica (GMT-6).',
        'Si decide avanzar con un proyecto, le descontamos los $97 completos del precio del proyecto.',
        '[Pendiente: reprogramación, cancelación y reembolsos. Definir la política con Alejandro antes de la revisión legal.]',
      ],
    },
    {
      heading: 'Proyectos, precios y pagos',
      body: [
        'Cada proyecto se rige por la propuesta y el contrato que firmamos con usted, donde constan el alcance, los plazos, el precio y las condiciones de pago. Los montos del sitio, como «Proyectos desde $3,500 USD», son referenciales.',
        'Las garantías comerciales que ofrecemos se detallan en cada propuesta o contrato.',
      ],
    },
    {
      heading: 'Propiedad intelectual',
      body: [
        'Los textos, el diseño, las marcas y el código del sitio son de Bralto o de sus clientes. No puede copiarlos ni usarlos sin autorización.',
      ],
    },
    {
      heading: 'Responsabilidad',
      body: [
        'Hacemos lo posible para que el sitio funcione sin interrupciones y para que la información sea correcta, pero no podemos garantizarlo en todo momento. [Completar la limitación de responsabilidad con el abogado.]',
      ],
    },
    {
      heading: 'Privacidad',
      body: ['El uso de sus datos se explica en nuestra Política de privacidad, en bralto.io/es/privacidad.'],
    },
    {
      heading: 'Ley aplicable',
      body: ['Estos términos se rigen por las leyes de la República de Costa Rica. [Confirmar la jurisdicción con el abogado.]'],
    },
    {
      heading: 'Cambios',
      body: ['Podemos actualizar estos términos; la versión vigente es la publicada en esta página con su fecha.'],
    },
  ],
}
