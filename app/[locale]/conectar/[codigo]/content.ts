import type { Fallo } from '@/lib/meta/conectar'

// «Conectar cuentas»: lo que ve el cliente al abrir su enlace. En inglés también, porque la revisan en Meta.

export type TextoConectar = {
  titulo: string
  paraCliente: (cliente: string) => string
  queHace: { titulo: string; lista: string[] }
  queNoHace: { titulo: string; texto: string }
  boton: string
  otraCuenta: string
  ayuda: string
  listo: string
  conectadas: string
  sinInstagram: string
  fallos: Record<Fallo, string>
  legal: { antes: string; privacidad: string; terminos: string; eliminar: string; y: string }
  vencido: { titulo: string; texto: string }
}

export const CONECTAR: Record<'es' | 'en', TextoConectar> = {
  es: {
    titulo: 'Conecta tus cuentas',
    paraCliente: (cliente) => `Para ${cliente}. Toma menos de un minuto.`,
    queHace: {
      titulo: 'Qué va a poder hacer Bralto',
      lista: [
        'Leer y contestar los comentarios de tus publicaciones en Instagram y Facebook.',
        'Mandarle un mensaje privado a quien comente la palabra que tú escojas.',
        'Leer y contestar los mensajes que te escriban.',
      ],
    },
    queNoHace: {
      titulo: 'Qué no va a hacer',
      texto: 'No le escribe a nadie que no te haya contactado primero, no ve tus mensajes personales y no le pasa tus datos a nadie.',
    },
    boton: 'Conectar con Facebook',
    otraCuenta: 'Conectar otra cuenta',
    ayuda: 'Se abre Facebook, escoges tu página y tu cuenta de Instagram, y aceptas. Vas a volver aquí.',
    listo: '¡Listo! Tus cuentas quedaron conectadas.',
    conectadas: 'Cuentas conectadas',
    sinInstagram: 'Esta página no tiene Instagram conectado',
    fallos: {
      cancelado: 'No se conectó nada porque se canceló en Facebook. Puedes intentarlo otra vez.',
      sin_cuentas: 'Facebook no nos mostró ninguna página. Revisa que seas administrador y que la hayas escogido al conectar.',
      fallo: 'Algo salió mal al conectar. Inténtalo otra vez en un rato. Si sigue pasando, escríbenos.',
    },
    legal: { antes: 'Puedes quitar el acceso cuando quieras desde tu Facebook. Lee la', privacidad: 'política de privacidad', y: ', los', terminos: 'términos', eliminar: 'cómo borrar tus datos' },
    vencido: { titulo: 'Este enlace ya no sirve', texto: 'Pídele a Bralto un enlace nuevo y lo conectamos en un momento.' },
  },
  en: {
    titulo: 'Connect your accounts',
    paraCliente: (cliente) => `For ${cliente}. It takes less than a minute.`,
    queHace: {
      titulo: 'What Bralto will be able to do',
      lista: [
        'Read and reply to comments on your Instagram and Facebook posts.',
        'Send one private message to people who comment the keyword you choose.',
        'Read and reply to the messages people send you.',
      ],
    },
    queNoHace: {
      titulo: 'What it will not do',
      texto: 'It never messages anyone who has not contacted you first, it cannot see your personal messages, and it never shares your data.',
    },
    boton: 'Connect with Facebook',
    otraCuenta: 'Connect another account',
    ayuda: 'Facebook opens, you choose your Page and your Instagram account, and you accept. Then you come back here.',
    listo: 'All set! Your accounts are connected.',
    conectadas: 'Connected accounts',
    sinInstagram: 'This Page has no Instagram account linked',
    fallos: {
      cancelado: 'Nothing was connected because it was cancelled on Facebook. You can try again.',
      sin_cuentas: 'Facebook did not show us any Page. Make sure you are an admin and that you selected it when connecting.',
      fallo: 'Something went wrong while connecting. Please try again in a while. If it keeps happening, write to us.',
    },
    legal: { antes: 'You can remove access at any time from your Facebook settings. Read the', privacidad: 'privacy policy', y: ', the', terminos: 'terms', eliminar: 'how to delete your data' },
    vencido: { titulo: 'This link is no longer valid', texto: 'Ask Bralto for a new link and we will connect it right away.' },
  },
}
