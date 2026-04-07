import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowUpRight, Check } from 'lucide-react'
import { clients } from '../clients'

export function generateStaticParams() {
  return clients.map(c => ({ slug: c.id }))
}

export default async function ClientPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const client = clients.find(c => c.id === slug)
  if (!client) notFound()

  const mid = Math.ceil(client.deliverables.length / 2)
  const firstHalf  = client.deliverables.slice(0, mid)
  const secondHalf = client.deliverables.slice(mid)
  // Extra images beyond the two used in alternating sections
  const extraImages = client.images.slice(2)

  return (
    <div className="min-h-screen bg-[#080808] text-white antialiased">

      {/* ══════════════════════════════════════════
          HERO — cover image bg, name large
      ══════════════════════════════════════════ */}
      <section className="relative min-h-[65vh] flex flex-col justify-end overflow-hidden">

        {/* Cover image */}
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
        {/* Overlays */}
        <div className="absolute inset-0 bg-[#080808]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/30 to-transparent" />

        {/* Back nav */}
        <Link
          href="/servicios/sitios-web"
          className="absolute top-8 left-6 md:left-12 z-10 inline-flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-sm"
        >
          <ArrowLeft size={13} />
          Sitios web
        </Link>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 pb-20 pt-32">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#F97316] mb-5">
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
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#F97316] hover:text-[#fb923c] transition-colors"
            >
              Ver sitio en vivo
              <ArrowUpRight size={15} />
            </a>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECCIÓN 1 — story + first half | image[0]
      ══════════════════════════════════════════ */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* Text left */}
            <div className="px-6 md:px-12 py-20 lg:py-28 flex flex-col justify-center" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-8">El proyecto</p>
              <p className="text-base text-white/55 leading-relaxed mb-10 max-w-lg">
                {client.story}
              </p>
              <ul className="space-y-4">
                {firstHalf.map(d => (
                  <li key={d} className="flex items-start gap-3 text-sm text-white/60 leading-relaxed">
                    <Check size={13} className="text-[#F97316] shrink-0 mt-0.5" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            {/* Image right */}
            {client.images[0] && (
              <div className="relative bg-[#080808] overflow-hidden" style={{ minHeight: '480px' }}>
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

      {/* ══════════════════════════════════════════
          SECCIÓN 2 — image[1] | second half
      ══════════════════════════════════════════ */}
      {client.images[1] && secondHalf.length > 0 && (
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a' }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2">

              {/* Image left */}
              <div className="relative bg-[#0a0a0a] overflow-hidden order-2 lg:order-1" style={{ minHeight: '480px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <Image
                  src={client.images[1]}
                  alt={`${client.name} — vista 2`}
                  fill
                  className="object-contain p-8 md:p-12"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              {/* Text right */}
              <div className="order-1 lg:order-2 px-6 md:px-12 py-20 lg:py-28 flex flex-col justify-center">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-8">Lo que construimos</p>
                <ul className="space-y-4">
                  {secondHalf.map(d => (
                    <li key={d} className="flex items-start gap-3 text-sm text-white/60 leading-relaxed">
                      <Check size={13} className="text-[#F97316] shrink-0 mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          IMÁGENES ADICIONALES — full-width on desktop
      ══════════════════════════════════════════ */}
      {extraImages.length > 0 && (
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {extraImages.map((img, i) => {
            const isEven = i % 2 === 0
            return (
              <div
                key={img}
                className="grid grid-cols-1 lg:grid-cols-[4fr_1fr]"
                style={{ borderBottom: i < extraImages.length - 1 ? '1px solid rgba(255,255,255,0.06)' : undefined }}
              >
                {/* Image — takes ~80% on desktop, alternates side */}
                <div
                  className={`relative bg-[#080808] overflow-hidden ${isEven ? 'order-1' : 'order-1 lg:order-2'}`}
                  style={{
                    minHeight: '560px',
                    ...(isEven
                      ? { borderRight: '1px solid rgba(255,255,255,0.06)' }
                      : { borderLeft: '1px solid rgba(255,255,255,0.06)' }),
                  }}
                >
                  <Image
                    src={img}
                    alt={`${client.name} — vista ${i + 3}`}
                    fill
                    className="object-contain p-8 lg:p-16"
                    sizes="(max-width: 1024px) 100vw, 80vw"
                  />
                </div>

                {/* Ghost number — narrow column */}
                <div
                  className={`hidden lg:flex items-end px-8 py-16 ${isEven ? 'order-2' : 'order-2 lg:order-1'}`}
                >
                  <p
                    className="font-bold text-white/5 leading-none select-none"
                    style={{ fontSize: 'clamp(4rem, 8vw, 8rem)' }}
                  >
                    {String(i + 3).padStart(2, '0')}
                  </p>
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* ══════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════ */}
      <section
        className="py-28 text-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a' }}
      >
        <div className="max-w-2xl mx-auto px-6 md:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F97316] mb-6">¿Querés algo así?</p>
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
              href="/agendar"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.4)]"
            >
              Agendar llamada gratis
              <ArrowUpRight size={15} />
            </Link>
            <Link
              href="/servicios/sitios-web"
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
