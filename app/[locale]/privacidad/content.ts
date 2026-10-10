import type { LegalDoc } from '@/components/home/legal-page'

// BORRADOR pendiente de revisión legal. Lo que va entre corchetes falta completar o confirmar.
// Describe lo que hace hoy el sitio: agenda y cobro del diagnóstico, firma de contratos y
// propuestas, y las cookies de medición que carga GTM según el consentimiento (lib/consent.ts).
export const PRIVACY: LegalDoc = {
  title: 'Política de privacidad',
  intro:
    'En Bralto cuidamos los datos que usted nos confía. Esta política explica qué datos recopilamos en bralto.io, para qué los usamos, con quién los compartimos y cómo puede ejercer sus derechos.',
  sections: [
    {
      heading: 'Quién es responsable de sus datos',
      body: [
        'El responsable es [razón social de Bralto], con [cédula jurídica o física], domicilio en [dirección en Costa Rica].',
        'Para cualquier consulta sobre privacidad puede escribirnos a cs@bralto.io.',
      ],
    },
    {
      heading: 'Qué datos recopilamos',
      body: [
        [
          'Al agendar un diagnóstico: nombre, apellido, teléfono, correo electrónico, sus respuestas sobre el negocio (tamaño del equipo, ingreso mensual aproximado, principal desafío, industria y plazo) y la fecha y hora que elige.',
          'Al pagar: el pago lo procesa Tilopay. Los datos de su tarjeta van directo a Tilopay y no pasan por nuestros servidores; nosotros recibimos el resultado del pago y su referencia.',
          'Al firmar un contrato o aceptar una propuesta en línea: los datos del documento, su nombre, su firma y la fecha.',
          'Al navegar: datos técnicos del navegador y, solo si usted lo permite o según su región (vea «Cookies»), datos de uso para medir las visitas y los anuncios.',
        ],
      ],
    },
    {
      heading: 'Para qué los usamos',
      body: [
        [
          'Preparar y realizar el diagnóstico, confirmarle la cita y enviarle recordatorios.',
          'Cobrar el diagnóstico y, si decide avanzar con un proyecto, descontarlo de su precio.',
          'Dar seguimiento a su solicitud y preparar propuestas y contratos.',
          'Medir y mejorar el sitio y nuestros anuncios, solo con las cookies que usted acepta.',
          'Cumplir obligaciones legales, contables y fiscales.',
        ],
        'Los usamos con su consentimiento, para prestarle el servicio que nos pide y para cumplir la ley. [Confirmar las bases legales con el abogado.]',
      ],
    },
    {
      heading: 'Con quién los compartimos',
      body: [
        'No vendemos sus datos. Los compartimos solo con los proveedores que necesitamos para prestar el servicio, que los tratan por cuenta nuestra:',
        [
          'Tilopay (Costa Rica): procesamiento de pagos.',
          'Nuestra plataforma de CRM y agenda (proveedor en Estados Unidos): contactos, citas y seguimiento. [Confirmar si se nombra al proveedor.]',
          'Supabase y Upstash (Estados Unidos): base de datos y reservas temporales de horarios.',
          'Resend (Estados Unidos): envío de correos de contratos y propuestas.',
          'Vercel (Estados Unidos): alojamiento del sitio.',
          'Google (Google Tag Manager y Google Analytics), Meta (píxel de Meta) y Adsmurai: medición de visitas y anuncios, solo con su consentimiento o según su región.',
        ],
        'Algunos de estos proveedores están fuera de Costa Rica, así que sus datos pueden transferirse a otros países. [Confirmar con el abogado las garantías para estas transferencias.]',
      ],
    },
    {
      heading: 'Cuánto tiempo los guardamos',
      body: [
        '[Pendiente de definir: plazo de conservación de los datos de contacto, de las citas, de los pagos (según la obligación contable) y de los contratos.]',
      ],
    },
    {
      heading: 'Sus derechos',
      body: [
        'Usted puede pedirnos acceso a sus datos, rectificarlos, suprimirlos u oponerse a su uso, según la Ley 8968 de Protección de la Persona frente al Tratamiento de sus Datos Personales de Costa Rica.',
        'Si visita el sitio desde la Unión Europea, el Espacio Económico Europeo o el Reino Unido, también tiene los derechos del Reglamento General de Protección de Datos (RGPD): portabilidad, limitación del tratamiento y presentar un reclamo ante su autoridad de protección de datos.',
        'Para ejercerlos, escríbanos a [correo de privacidad]. Le respondemos en un plazo de [plazo de respuesta].',
      ],
    },
    {
      heading: 'Cookies',
      body: [
        'Usamos dos tipos de cookies y de almacenamiento del navegador:',
        [
          'Esenciales, que el sitio necesita para funcionar: su elección de cookies, el tema claro u oscuro, la sesión mientras agenda y una cookie que indica si su visita viene de la Unión Europea, el Espacio Económico Europeo o el Reino Unido. No requieren consentimiento.',
          'De medición y publicidad: Google Tag Manager, Google Analytics, el píxel de Meta y Adsmurai. En visitas desde la Unión Europea, el Espacio Económico Europeo o el Reino Unido solo se activan si usted elige «Aceptar todo». En el resto de los países se activan al entrar y se desactivan si usted elige «Solo esenciales».',
        ],
        'Puede cambiar su elección cuando quiera desde «Preferencias de cookies», al pie de cada página.',
      ],
    },
    {
      heading: 'Seguridad',
      body: [
        'Protegemos sus datos con conexiones cifradas (HTTPS) y acceso restringido a nuestro equipo. [Completar con el abogado.]',
      ],
    },
    {
      heading: 'Cambios a esta política',
      body: ['Si cambiamos esta política, publicaremos la nueva versión en esta página con su fecha.'],
    },
  ],
}
