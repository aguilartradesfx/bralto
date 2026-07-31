'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  LayoutDashboard,
  Globe,
  MessageSquare,
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { StartTrialButton } from '@/components/start-trial-button'

const NEON = '#ff6d28' // naranja neón de marca (mismo que PlatformSection)

// Feature catalog lives in the shared PlatformSection namespace (single source of truth).
const CATEGORIES = [
  { id: 'organizacion', icon: LayoutDashboard },
  { id: 'sitios', icon: Globe },
  { id: 'multicanal', icon: MessageSquare },
] as const

export default function PlataformaPage() {
  const t = useTranslations('PlataformaPage')
  const pt = useTranslations('PlatformSection')
  const locale = useLocale()
  const period = locale === 'en' ? '/mo' : '/mes'

  const categories = CATEGORIES.map(({ id, icon }) => ({
    id,
    icon,
    label: pt(`tabs.${id}.label`),
    features: pt.raw(`tabs.${id}.features`) as string[],
  }))

  const replaced = [
    { tool: 'HubSpot', price: `$800+${period}` },
    { tool: 'ClickFunnels', price: `$297${period}` },
    { tool: 'Wix', price: `$39${period}` },
    { tool: 'Typeform', price: `$59${period}` },
    { tool: 'Mailchimp', price: `$350${period}` },
    { tool: 'Calendly', price: `$16${period}` },
    { tool: 'Twilio / SMS', price: `$200+${period}` },
    { tool: 'ManyChat', price: `$145${period}` },
    { tool: 'Kajabi', price: `$149${period}` },
    { tool: 'Stripe + integrations', price: `$120+${period}` },
  ]

  const details = t.raw('details') as { title: string; desc: string }[]
  const faq = t.raw('faq') as { q: string; a: string }[]

  return (
    <div className="min-h-screen bg-[#060607] text-white antialiased">
      <Navbar />

      {/* ── HERO ── */}
      <section className="grid-bg relative overflow-hidden pt-40 pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,109,40,0.06),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#060607]" />

        <Link
          href={`/${locale}`}
          className="absolute top-20 left-6 md:left-12 z-10 inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white/70"
        >
          <ArrowLeft size={13} />
          {t('home')}
        </Link>

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center md:px-12">
          <div
            className="mb-8 inline-flex items-center gap-2.5 rounded-full px-4 py-2"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}
          >
            <span className="inline-flex items-center rounded-full bg-[#ff6d28] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              {t('badge')}
            </span>
            <span className="text-sm text-white/75">{t('badgeSub')}</span>
          </div>

          <h1
            className="mb-7 font-bold leading-[0.95] tracking-tight text-white"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)' }}
          >
            {t('headline')}
            <br />
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>
              {t('headlineItalic')}
            </em>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-white/50">
            {t('desc')}
          </p>

          {/* Price */}
          <div className="mb-2 flex items-baseline justify-center gap-2">
            <span className="text-sm uppercase tracking-[0.12em] text-white/35">{t('priceLabel')}</span>
            <span className="text-6xl font-bold tracking-[-0.03em]" style={{ color: NEON, textShadow: '0 0 30px rgba(255,109,40,0.3)' }}>
              {t('price')}
            </span>
            <span className="text-xl text-white/40">{t('period')}</span>
          </div>
          <p className="mb-10 text-sm text-white/40">{t('priceNote')}</p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <StartTrialButton label={t('ctaPrimary')} />
            <Link
              href={`/${locale}`}
              className="inline-flex items-center justify-center gap-2.5 rounded-full px-10 py-4 font-semibold text-white/45 transition-all hover:text-white"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              {t('ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section className="relative py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <div className="mb-16 text-center">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28">{t('includesLabel')}</p>
            <h2 className="mb-4 text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-5xl">
              {t('includesHeadline')}
              <br />
              <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.32)' }}>
                {t('includesHeadlineItalic')}
              </em>
            </h2>
            <p className="mx-auto max-w-xl text-base text-white/38">{t('includesDesc')}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {categories.map((cat) => (
              <div key={cat.id} className="rounded-card border border-white/[0.06] bg-[#131316] p-7">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6d28]/10 border border-[#ff6d28]/20">
                    <cat.icon size={17} style={{ color: NEON }} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{cat.label}</h3>
                </div>
                <ul className="flex flex-col gap-3.5">
                  {cat.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-white/60">
                      <Check size={15} className="shrink-0" style={{ color: NEON }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT IT REPLACES ── */}
      <section className="relative py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <div className="mb-12 text-center">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28">{t('replacesLabel')}</p>
            <h2 className="mb-4 text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-5xl">{t('replacesHeadline')}</h2>
            <p className="mx-auto max-w-xl text-base text-white/38">{t('replacesDesc')}</p>
          </div>

          <div className="overflow-hidden rounded-card border border-white/[0.06] bg-[#131316]">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Tools list */}
              <div className="border-b border-white/[0.05] lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-white/25">{t('toolHeader')}</span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-white/25">{t('costHeader')}</span>
                </div>
                {replaced.map((item) => (
                  <div
                    key={item.tool}
                    className="flex items-center justify-between border-b border-white/[0.03] px-6 py-3.5 transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-2.5">
                      <X size={12} className="text-red-400/50" />
                      <span className="text-sm text-white/50">{item.tool}</span>
                    </div>
                    <span className="font-mono text-sm text-white/28">{item.price}</span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <p className="mb-6 text-[10px] uppercase tracking-widest text-white/28">{t('withoutLabel')}</p>
                <div className="mb-2">
                  <span className="text-5xl font-bold text-white/18 line-through" style={{ textDecorationColor: 'rgba(239,68,68,0.35)' }}>
                    $6,000+
                  </span>
                  <span className="ml-1 text-xl text-white/25">{period}</span>
                </div>
                <div className="my-8 h-px w-16 bg-white/[0.08]" />
                <p className="mb-3 text-[10px] uppercase tracking-widest text-white/28">{t('withLabel')}</p>
                <div className="mb-2">
                  <span className="text-6xl font-bold" style={{ color: NEON, textShadow: '0 0 30px rgba(255,109,40,0.35)' }}>
                    $87
                  </span>
                  <span className="ml-1 text-xl text-white/40">{period}</span>
                </div>
                <p className="mt-4 max-w-xs text-xs text-white/28">{t('allToolsNote')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLAN DETAILS ── */}
      <section className="relative py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <div className="mb-14 text-center">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28">{t('detailsLabel')}</p>
            <h2 className="text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-5xl">{t('detailsHeadline')}</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {details.map((d) => (
              <div key={d.title} className="rounded-card border border-white/[0.06] bg-[#131316] p-7">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff6d28]/10 border border-[#ff6d28]/20">
                  <Check size={15} style={{ color: NEON }} />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{d.title}</h3>
                <p className="text-sm leading-relaxed text-white/40">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="mx-auto max-w-3xl px-6 md:px-12">
          <div className="mb-14 text-center">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28">{t('faqLabel')}</p>
            <h2 className="text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-5xl">{t('faqHeadline')}</h2>
          </div>

          <div className="flex flex-col gap-3">
            {faq.map((item) => (
              <div key={item.q} className="rounded-card border border-white/[0.06] bg-[#131316] p-6">
                <h3 className="mb-2 text-base font-semibold text-white">{item.q}</h3>
                <p className="text-sm leading-relaxed text-white/45">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative overflow-hidden py-40" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(255,109,40,0.06),transparent)]" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center md:px-12">
          <p className="mb-6 text-xs font-bold uppercase tracking-[0.22em]" style={{ color: NEON }}>{t('finalLabel')}</p>
          <h2 className="mb-8 font-bold leading-[0.95] tracking-tight text-white" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
            {t('finalHeadline')}
            <br />
            <span style={{ color: 'rgba(255,255,255,0.22)' }}>{t('finalHeadlineItalic')}</span>
          </h2>
          <p className="mx-auto mb-12 max-w-md text-base leading-relaxed text-white/40">{t('finalDesc')}</p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <StartTrialButton label={t('finalCtaPrimary')} />
            <Link
              href={`/${locale}`}
              className="inline-flex items-center justify-center gap-2.5 rounded-full px-10 py-4 font-semibold text-white/45 transition-all hover:text-white"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              {t('finalCtaSecondary')}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
