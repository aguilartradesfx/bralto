import { Arrow } from '@/components/home/icons'
import { StatusCard } from '@/components/home/status-card'

export type ConfirmationState = 'none' | 'confirmed' | 'already' | 'conflict' | 'unpaid' | 'invalid' | 'error'

type Copy = { eyebrow: string; title: string; body: string; note?: string; retry?: boolean }

const COPY: Record<'es' | 'en', Record<ConfirmationState, Copy> & { tz: string; retry: string; home: string; spam: string }> = {
  es: {
    tz: '(hora de Costa Rica)',
    retry: 'Volver a agendar',
    home: 'Ir al inicio',
    spam: 'Revise su carpeta de spam si no lo encuentra.',
    none: {
      eyebrow: '¡Solicitud recibida!',
      title: 'Su llamada está agendada.',
      body: 'Le enviaremos la confirmación y el enlace de la llamada a su correo electrónico en los próximos minutos.',
    },
    confirmed: {
      eyebrow: 'Pago recibido',
      title: 'Su diagnóstico está agendado.',
      body: 'Le enviaremos la confirmación y el enlace de la llamada a su correo electrónico en los próximos minutos.',
      note: 'Si contrata el servicio, los $97 se descuentan del proyecto.',
    },
    already: {
      eyebrow: 'Pago recibido',
      title: 'Su diagnóstico está agendado.',
      body: 'Le enviaremos la confirmación y el enlace de la llamada a su correo electrónico en los próximos minutos.',
      note: 'Si contrata el servicio, los $97 se descuentan del proyecto.',
    },
    conflict: {
      eyebrow: 'Pago recibido',
      title: 'Ese horario se ocupó mientras pagaba.',
      body: 'Su pago quedó registrado. Le escribiremos a su correo para coordinar otro horario.',
    },
    unpaid: {
      eyebrow: 'Pago no completado',
      title: 'El pago no se completó.',
      body: 'No se hizo ningún cobro. Puede volver a intentarlo cuando quiera.',
      retry: true,
    },
    invalid: {
      eyebrow: 'Enlace no válido',
      title: 'No encontramos ese pago.',
      body: 'Si quiere agendar su diagnóstico, puede hacerlo desde aquí.',
      retry: true,
    },
    error: {
      eyebrow: 'Verificando su pago',
      title: 'Estamos confirmando su pago.',
      body: 'Si el pago se completó, recibirá la confirmación por correo en los próximos minutos.',
    },
  },
  en: {
    tz: '(Costa Rica time)',
    retry: 'Book again',
    home: 'Go to the homepage',
    spam: "Check your spam folder if you can't find it.",
    none: {
      eyebrow: 'Request received!',
      title: 'Your call is booked.',
      body: "We'll email you the confirmation and the call link in the next few minutes.",
    },
    confirmed: {
      eyebrow: 'Payment received',
      title: 'Your diagnostic call is booked.',
      body: "We'll email you the confirmation and the call link in the next few minutes.",
      note: 'If you hire us, the $97 is deducted from the project.',
    },
    already: {
      eyebrow: 'Payment received',
      title: 'Your diagnostic call is booked.',
      body: "We'll email you the confirmation and the call link in the next few minutes.",
      note: 'If you hire us, the $97 is deducted from the project.',
    },
    conflict: {
      eyebrow: 'Payment received',
      title: 'That time slot was taken while you were paying.',
      body: "Your payment is recorded. We'll email you to arrange another time.",
    },
    unpaid: {
      eyebrow: 'Payment not completed',
      title: "The payment didn't go through.",
      body: 'You were not charged. You can try again whenever you like.',
      retry: true,
    },
    invalid: {
      eyebrow: 'Invalid link',
      title: "We couldn't find that payment.",
      body: 'If you want to book your diagnostic call, you can do it here.',
      retry: true,
    },
    error: {
      eyebrow: 'Checking your payment',
      title: "We're confirming your payment.",
      body: "If the payment went through, you'll receive the confirmation by email in the next few minutes.",
    },
  },
}

export default function ConfirmacionView({
  locale,
  state,
  when,
}: {
  locale: 'es' | 'en'
  state: ConfirmationState
  when: string | null
}) {
  const t = COPY[locale]
  const c = t[state]
  const ok = state === 'none' || state === 'confirmed' || state === 'already'

  return (
    <StatusCard
      tone={ok ? 'ok' : 'notice'}
      eyebrow={c.eyebrow}
      title={c.title}
      actions={
        <>
          {c.retry && (
            <a href={`/${locale}/agendar`} className="hm-btn hm-btn--solid">
              {t.retry}
              <Arrow />
            </a>
          )}
          <a href={`/${locale}`} className="hm-btn hm-btn--glass hm-glass">
            {t.home}
          </a>
        </>
      }
    >
      {when && ok && (
        <p className="st-when">
          {when} <span>{t.tz}</span>
        </p>
      )}
      <p>{c.body}</p>
      {ok && <p className="st__hint">{t.spam}</p>}
      {c.note && <p>{c.note}</p>}
    </StatusCard>
  )
}
