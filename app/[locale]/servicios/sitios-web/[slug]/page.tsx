import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowUpRight, Check } from 'lucide-react'
import { clients } from '@/app/servicios/sitios-web/clients'

export function generateStaticParams() {
  return ['es', 'en'].flatMap(locale =>
    clients.map(c => ({ locale, slug: c.id }))
  )
}

export default async function ClientPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const client = clients.find(c => c.id === slug)
  if (!client) notFound()

  const mid = Math.ceil(client.deliverables.length / 2)
  const firstHalf  = client.deliverables.slice(0, mid)
  const secondHalf = client.deliverables.slice(mid)
  const extraImages = client.images.slice(2)

  return (
    <div className="min-h-screen bg-[#080808] text-white antialiased">

      {/* HERO */}
      <section className="relative min-h-[65vh] flex flex-col justify-end overflow-hidden">

        <div className="absolute inset-0">
          <Image
            src={client.coverImage}
            alt={client.name}
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-[#080808]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/30 to-transparent" />

        <Link
          href={`/${locale}/servicios/sitios-web`}
          className="absolute top-8 left-6 md:left-12 z-10 inline-flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-sm"
        >
          <ArrowLeft size={13} />
          Sitios web
        </Link>

        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 pb-20 pt-32">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5bb6ff] mb-5">
            {client.industry}
          </p>
          <h1
            className="font-bold tracking-tight leading-[0.88] text-white mb-6"
            style={{ fontSize: 'clamp(3.5rem, 9vw, 9rem)' }}
          >
            {client.name}
          </h1>
          <p className="text-base md:text-lg text-white/50 max-w-xl leading-relaxed mb-8">
            {client.tagline}
          </p>
          {client.url && (
            <a
              href={client.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#5bb6ff] hover:text-[#fb923c] transition-colors"
            >
              Ver sitio en vivo
              <ArrowUpRight size={15} />
            </a>
          )}
        </div>
      </section>

      {/* SECTION 1 */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2">

            <div className="px-6 md:px-12 py-20 lg:py-28 flex flex-col justify-center" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#5bb6ff] mb-8">El proyecto</p>
              <p className="text-base text-white/55 leading-relaxed mb-10 max-w-lg">
                {client.story}
              </p>
              <ul className="space-y-4">
                {firstHalf.map(d => (
                  <li key={d} className="flex items-start gap-3 text-sm text-white/60 leading-relaxed">
                    <Check size={13} className="text-[#5bb6ff] shrink-0 mt-0.5" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            {client.images[0] && (
              <div className="relative overflow-hidden" style={{ minHeight: '480px' }}>
                <Image
                  src={client.images[0]}
                  alt={`${client.name} — vista 1`}
                  fill
                  className="object-contain p-8 md:p-12"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 2 */}
      {client.images[1] && secondHalf.length > 0 && (
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#060607' }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2">

              <div className="relative overflow-hidden order-2 lg:order-1" style={{ minHeight: '480px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <Image
                  src={client.images[1]}
                  alt={`${client.name} — vista 2`}
                  fill
                  className="object-contain p-8 md:p-12"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              <div className="order-1 lg:order-2 px-6 md:px-12 py-20 lg:py-28 flex flex-col justify-center">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#5bb6ff] mb-8">Lo que construimos</p>
                <ul className="space-y-4">
                  {secondHalf.map(d => (
                    <li key={d} className="flex items-start gap-3 text-sm text-white/60 leading-relaxed">
                      <Check size={13} className="text-[#5bb6ff] shrink-0 mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* EXTRA IMAGES */}
      {extraImages.length > 0 && (
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {extraImages.map((img, i) => {
            const deliverable = client.deliverables[i % client.deliverables.length]
            const borderBottom = i < extraImages.length - 1
              ? '1px solid rgba(255,255,255,0.06)'
              : undefined

            if (i % 2 === 0) {
              return (
                <div key={img} style={{ borderBottom }}>
                  <div className="max-w-7xl mx-auto">
                    <div className="relative w-full h-[56vw] lg:h-[68vh]">
                      <Image
                        src={img}
                        alt={`${client.name} — vista ${i + 3}`}
                        fill
                        className="object-contain p-4 lg:p-8"
                        sizes="(max-width: 1280px) 100vw, 1280px"
                      />
                    </div>
                    <div
                      className="px-6 md:px-12 py-10 text-center"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <p className="font-mono text-[10px] text-[#5bb6ff]/50 tracking-[0.3em] uppercase mb-5">
                        {String(i + 3).padStart(2, '0')}
                      </p>
                      <p className="text-xl md:text-2xl font-semibold text-white/65 leading-snug max-w-2xl mx-auto">
                        {deliverable}
                      </p>
                    </div>
                  </div>
                </div>
              )
            }

            const imageLeft = Math.floor(i / 2) % 2 === 0
            return (
              <div key={img} style={{ borderBottom }}>
                <div className="max-w-7xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div
                      className={`relative overflow-hidden h-[56vw] lg:h-[580px] ${imageLeft ? 'order-1' : 'order-1 lg:order-2'}`}
                      style={imageLeft
                        ? { borderRight: '1px solid rgba(255,255,255,0.06)' }
                        : { borderLeft: '1px solid rgba(255,255,255,0.06)' }
                      }
                    >
                      <Image
                        src={img}
                        alt={`${client.name} — vista ${i + 3}`}
                        fill
                        className="object-contain p-4 lg:p-6"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>
                    <div
                      className={`flex flex-col justify-center px-8 md:px-12 py-16 lg:py-20 ${imageLeft ? 'order-2' : 'order-2 lg:order-1'}`}
                    >
                      <p className="font-mono text-[10px] text-[#5bb6ff]/50 tracking-[0.3em] uppercase mb-6">
                        {String(i + 3).padStart(2, '0')}
                      </p>
                      <p
                        className="font-bold text-white leading-tight mb-6"
                        style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)' }}
                      >
                        {deliverable}
                      </p>
                      <div className="w-10 h-px" style={{ background: 'rgba(91,182,255,0.12)' }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* CTA FINAL */}
      <section
        className="py-28 text-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#060607' }}
      >
        <div className="max-w-2xl mx-auto px-6 md:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#5bb6ff] mb-6">¿Querés algo así?</p>
          <h2
            className="font-bold tracking-tight leading-[0.92] text-white mb-8"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
          >
            Tu proyecto,<br />
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>el próximo.</span>
          </h2>
          <p className="text-sm text-white/40 leading-relaxed mb-12 max-w-sm mx-auto">
            Construimos sitios que trabajan solos. Conversemos 30 minutos y te mostramos cómo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/${locale}/agendar`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#5bb6ff] hover:bg-[#7cc5ff] text-white font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(91,182,255,0.12)]"
            >
              Agendar llamada gratis
              <ArrowUpRight size={15} />
            </Link>
            <Link
              href={`/${locale}/servicios/sitios-web`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-sm text-white/45 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <ArrowLeft size={15} />
              Ver más proyectos
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
