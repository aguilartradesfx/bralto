import type { Locale } from '@/components/home/primitives'

// Eliminación de datos (bralto.io/eliminar-datos): la dirección que se le da a Meta para la app. Explica qué
// datos podemos tener de Instagram, Facebook y WhatsApp y cómo pedir que se borren. De usted, como la política
// de privacidad. En inglés también, porque la pueden revisar en Meta.

export type Seccion = { titulo: string; parrafos: (string | string[])[] }

export type TextoEliminar = {
  titulo: string
  actualizado: string
  intro: string
  secciones: Seccion[]
  privacidad: { antes: string; enlace: string; despues: string }
  formulario: {
    titulo: string
    ayuda: string
    nombre: string
    contacto: string
    contactoAyuda: string
    cuenta: string
    cuentaAyuda: string
    detalle: string
    detalleAyuda: string
    enviar: string
    enviando: string
    listoTitulo: string
    listoTexto: string
    verEstado: string
    errorGeneral: string
    demasiados: string
    sinConexion: string
  }
  estado: {
    titulo: string
    ayuda: string
    campo: string
    consultar: string
    noExiste: string
    recibida: (fecha: string) => string
    completada: (fecha: string) => string
  }
  errores: { nombre: string; contacto: string; detalle: string }
}

export const ELIMINAR: Record<Locale, TextoEliminar> = {
  es: {
    titulo: 'Eliminación de datos',
    actualizado: 'Actualizado el 5 de noviembre de 2026',
    intro:
      'Si usted nos escribió o comentó en Instagram, Facebook o WhatsApp, o pidió una de nuestras guías, puede pedirnos que borremos sus datos. Es gratis y no tiene que explicarnos por qué.',
    secciones: [
      {
        titulo: 'Qué datos podemos tener',
        parrafos: [
          [
            'Su nombre y usuario públicos de Instagram o Facebook.',
            'Los mensajes y comentarios que nos envió por Instagram, Facebook o WhatsApp, y su número de WhatsApp.',
            'Si pidió una guía: su nombre, correo y WhatsApp.',
            'El número que Meta le asigna a su cuenta dentro de nuestra aplicación, si conectó su cuenta con nosotros.',
          ],
          'No vendemos sus datos ni los usamos para otra cosa que contestarle y enviarle lo que nos pidió.',
        ],
      },
      {
        titulo: 'Cómo pedir que los borremos',
        parrafos: [
          [
            'Con el formulario de esta página: le damos un código para que vea cómo va su solicitud.',
            'Por correo, a cs@bralto.io, con el asunto «Eliminar mis datos» y su usuario o número para encontrarlos.',
            'Desde Facebook, si conectó su cuenta con nosotros: en Configuración y privacidad → Configuración → Apps y sitios web, quite nuestra aplicación. Meta nos avisa y borramos lo de esa cuenta.',
          ],
        ],
      },
      {
        titulo: 'Qué pasa después',
        parrafos: [
          'Borramos sus datos en un plazo máximo de 30 días y le confirmamos cuando esté listo. Solo guardamos lo que la ley nos obligue a conservar (por ejemplo, una factura), y se lo decimos.',
          'Este derecho es parte de la Ley 8968 de Protección de la Persona frente al Tratamiento de sus Datos Personales de Costa Rica.',
        ],
      },
    ],
    privacidad: { antes: 'Para saber más sobre cómo cuidamos sus datos, lea la ', enlace: 'política de privacidad', despues: '.' },
    formulario: {
      titulo: 'Pedir que borren mis datos',
      ayuda: 'Con estos datos encontramos lo que tenemos de usted. Solo los usamos para esta solicitud.',
      nombre: 'Su nombre',
      contacto: 'Correo o WhatsApp',
      contactoAyuda: 'Para avisarle cuando esté listo. El WhatsApp, con el código de país.',
      cuenta: 'Usuario de Instagram o Facebook (opcional)',
      cuentaAyuda: 'Si nos escribió por ahí, así lo encontramos más rápido.',
      detalle: 'Algo más que debamos saber (opcional)',
      detalleAyuda: 'Por ejemplo, desde qué cuenta o número nos escribió.',
      enviar: 'Pedir que borren mis datos',
      enviando: 'Enviando…',
      listoTitulo: 'Recibimos su solicitud',
      listoTexto: 'Guarde este código: con él puede ver cómo va en esta misma página. La atendemos en 30 días como máximo.',
      verEstado: 'Ver cómo va',
      errorGeneral: 'No pudimos registrar su solicitud en este momento. Intente de nuevo en un minuto o escríbanos a cs@bralto.io.',
      demasiados: 'Hubo demasiados intentos seguidos. Espere unos minutos o escríbanos a cs@bralto.io.',
      sinConexion: 'No pudimos enviar la solicitud. Revise su conexión e intente de nuevo.',
    },
    estado: {
      titulo: '¿Ya tiene un código?',
      ayuda: 'Escríbalo para ver cómo va su solicitud.',
      campo: 'Código de la solicitud',
      consultar: 'Consultar',
      noExiste: 'No encontramos una solicitud con ese código. Revise que esté completo (por ejemplo, BR-ABCD2345).',
      recibida: (fecha) => `Recibimos su solicitud el ${fecha}. La estamos atendiendo: le avisamos cuando sus datos estén borrados.`,
      completada: (fecha) => `Listo: borramos sus datos el ${fecha}.`,
    },
    errores: {
      nombre: 'Escriba su nombre.',
      contacto: 'Escriba un correo o un WhatsApp con el código de país (por ejemplo, +506 8888 8888).',
      detalle: 'El detalle es muy largo: resúmalo en menos de 1,000 letras.',
    },
  },
  en: {
    titulo: 'Data deletion',
    actualizado: 'Updated November 5, 2026',
    intro:
      'If you messaged or commented to us on Instagram, Facebook or WhatsApp, or requested one of our guides, you can ask us to delete your data. It is free and you do not need to tell us why.',
    secciones: [
      {
        titulo: 'What data we may have',
        parrafos: [
          [
            'Your public Instagram or Facebook name and username.',
            'The messages and comments you sent us on Instagram, Facebook or WhatsApp, and your WhatsApp number.',
            'If you requested a guide: your name, email and WhatsApp.',
            'The ID Meta assigns to your account within our app, if you connected your account with us.',
          ],
          'We do not sell your data or use it for anything other than replying to you and sending you what you asked for.',
        ],
      },
      {
        titulo: 'How to ask us to delete it',
        parrafos: [
          [
            'With the form on this page: we give you a code so you can check the status of your request.',
            'By email, to cs@bralto.io, with the subject “Delete my data” and your username or number so we can find it.',
            'From Facebook, if you connected your account with us: under Settings & privacy → Settings → Apps and websites, remove our app. Meta notifies us and we delete the data for that account.',
          ],
        ],
      },
      {
        titulo: 'What happens next',
        parrafos: [
          'We delete your data within 30 days at most and confirm when it is done. We only keep what the law requires us to keep (for example, an invoice), and we tell you.',
          'This right is part of Costa Rica’s Law 8968 on the Protection of Individuals regarding the Processing of their Personal Data.',
        ],
      },
    ],
    privacidad: { antes: 'To learn more about how we protect your data, read the ', enlace: 'privacy policy', despues: ' (in Spanish).' },
    formulario: {
      titulo: 'Ask us to delete my data',
      ayuda: 'We use these details only to find your data and handle this request.',
      nombre: 'Your name',
      contacto: 'Email or WhatsApp',
      contactoAyuda: 'So we can tell you when it is done. WhatsApp with the country code.',
      cuenta: 'Instagram or Facebook username (optional)',
      cuentaAyuda: 'If you messaged us there, this helps us find it faster.',
      detalle: 'Anything else we should know (optional)',
      detalleAyuda: 'For example, which account or number you messaged us from.',
      enviar: 'Ask us to delete my data',
      enviando: 'Sending…',
      listoTitulo: 'We received your request',
      listoTexto: 'Keep this code: you can use it on this page to check the status. We handle it within 30 days at most.',
      verEstado: 'Check status',
      errorGeneral: 'We could not register your request right now. Please try again in a minute or email us at cs@bralto.io.',
      demasiados: 'Too many attempts in a row. Please wait a few minutes or email us at cs@bralto.io.',
      sinConexion: 'We could not send the request. Check your connection and try again.',
    },
    estado: {
      titulo: 'Already have a code?',
      ayuda: 'Enter it to check the status of your request.',
      campo: 'Request code',
      consultar: 'Check',
      noExiste: 'We could not find a request with that code. Make sure it is complete (for example, BR-ABCD2345).',
      recibida: (fecha) => `We received your request on ${fecha}. We are working on it and will let you know when your data is deleted.`,
      completada: (fecha) => `Done: we deleted your data on ${fecha}.`,
    },
    errores: {
      nombre: 'Enter your name.',
      contacto: 'Enter an email or a WhatsApp number with the country code (for example, +506 8888 8888).',
      detalle: 'That is too long: please keep it under 1,000 characters.',
    },
  },
}
