import type { LegalDoc } from '@/components/home/legal-page'

// Revisados por el abogado (octubre de 2026). Los reembolsos se explican como garantía de
// resultados, en palabras de Alejandro: en lugar de devolver el pago, seguimos trabajando sin
// costo hasta lograr el resultado. El copy visible nunca dice «no reembolsable».
export const TERMS: LegalDoc = {
  title: 'Términos y condiciones',
  intro:
    'Estos términos regulan el uso de bralto.io y la contratación del diagnóstico de 30 minutos. Al usar el sitio o agendar un diagnóstico, usted los acepta.',
  sections: [
    {
      heading: 'Quiénes somos',
      body: ['Bralto diseña e implementa sistemas de automatización e inteligencia artificial para negocios, desde Costa Rica. Contacto: cs@bralto.io.'],
    },
    {
      heading: 'Uso del sitio',
      body: [
        'El contenido del sitio es informativo. Las cifras, los paneles y los ejemplos marcados como ilustrativos o de ejemplo muestran cómo podría funcionar un sistema; no son resultados garantizados.',
        'Los casos muestran proyectos reales de nuestros clientes.',
      ],
    },
    {
      heading: 'Diagnóstico de 30 minutos',
      body: [
        'El diagnóstico es una videollamada de 30 minutos para entender su negocio y decirle por dónde empezar. Cuesta $97 USD y se paga por adelantado con tarjeta a través de Tilopay.',
        'La cita queda confirmada cuando el pago se aprueba. Los horarios se muestran en hora de Costa Rica (GMT-6).',
        'Si no puede asistir, escríbanos a cs@bralto.io antes de la hora de la cita y le damos un nuevo horario.',
        'Si decide avanzar con un proyecto, le descontamos los $97 completos del precio del proyecto.',
      ],
    },
    {
      heading: 'Proyectos, precios y pagos',
      body: [
        'Cada proyecto se rige por la propuesta y el contrato que firmamos con usted, donde constan el alcance, los plazos, el precio y las condiciones de pago. Los montos del sitio, como «Proyectos desde $3,500 USD», son referenciales.',
      ],
    },
    {
      heading: 'Reembolsos y garantía de resultados',
      body: [
        'En lugar de devolver pagos, respondemos con trabajo: si usted sigue al pie de la letra el proceso que acordamos y el sistema no da el resultado comprometido, seguimos trabajando sin costo hasta lograrlo.',
        'El resultado que nos comprometemos a lograr, sus plazos y lo que le corresponde hacer a usted constan en la propuesta o el contrato de cada proyecto.',
        'En el diagnóstico, los $97 cubren la llamada y su preparación, y se le descuentan completos si decide avanzar con un proyecto.',
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
        'Hacemos lo posible para que el sitio funcione sin interrupciones y para que la información sea correcta, pero no podemos garantizarlo en todo momento.',
      ],
    },
    {
      heading: 'Privacidad',
      body: ['El uso de sus datos se explica en nuestra Política de privacidad, en bralto.io/es/privacidad.'],
    },
    {
      heading: 'Ley aplicable',
      body: ['Estos términos se rigen por las leyes de la República de Costa Rica.'],
    },
    {
      heading: 'Cambios',
      body: ['Podemos actualizar estos términos; la versión vigente es la publicada en esta página con su fecha.'],
    },
  ],
}
