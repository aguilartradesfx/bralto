import type { Metadata } from 'next'
import Link from 'next/link'
import { Arrow } from '@/components/home/icons'
import { StatusCard } from '@/components/home/status-card'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ c?: string; from?: string }>
}

const COPY = {
  es: {
    title: 'Listo',
    eyebrow: '¡Todo listo!',
    heading: 'Proceso completado',
    body: 'Hemos registrado su firma y recibirá un correo de confirmación con el documento en los próximos minutos.',
    contract: 'Ver contrato firmado',
    questions: '¿Tiene dudas?',
    write: 'Escríbanos',
  },
  en: {
    title: 'Done',
    eyebrow: 'All set!',
    heading: 'Process completed',
    body: "We've recorded your signature. You'll receive a confirmation email with the document in the next few minutes.",
    contract: 'View signed contract',
    questions: 'Questions?',
    write: 'Email us',
  },
}

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

// Página transaccional (después de firmar un contrato): fuera del índice
export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  return { title: COPY[toLocale((await params).locale)].title, robots: { index: false, follow: false } }
}

export default async function ListoPage({ params, searchParams }: Props) {
  const t = COPY[toLocale((await params).locale)]
  const { c } = await searchParams
  const contractUrl = c ? `/c/${c}` : null

  return (
    <StatusCard
      tone="ok"
      eyebrow={t.eyebrow}
      title={t.heading}
      actions={
        contractUrl && (
          <Link href={contractUrl} className="hm-btn hm-btn--glass hm-glass">
            {t.contract}
            <Arrow />
          </Link>
        )
      }
    >
      <p>{t.body}</p>
      <p className="st__hint">
        {t.questions} <a href="mailto:hola@bralto.io">{t.write}</a>
      </p>
    </StatusCard>
  )
}
