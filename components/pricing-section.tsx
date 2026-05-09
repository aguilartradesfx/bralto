'use client'

import { motion } from 'framer-motion'
import { BarChart2, Sparkles, Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

export function PricingSection() {
  const t  = useTranslations('PricingSection')
  const locale = useLocale()

  const foundationFeatures = t.raw('foundation.features') as string[]
  const primeFeatures      = t.raw('prime.features') as string[]

  return (
    <section id="inversion" className="relative overflow-hidden py-28">

      <div className="relative z-10 mx-auto max-w-[1240px] px-8">

        {/* ── Header ── */}
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" style={{ boxShadow: '0 0 8px #5bb6ff' }} />
            <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/45">
              {t('label')}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="mb-4 font-serif text-[clamp(44px,5.5vw,64px)] font-normal leading-[1.05] tracking-[-0.02em] text-white"
          >
            {t('headline')}{' '}
            <em className="italic text-amber/75">{t('headlineItalic')}</em>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.14 }}
            className="mx-auto max-w-[520px] text-base text-white/35"
          >
            {t('desc')}
          </motion.p>
        </div>

        {/* ── Cards Stage ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-[580px] flex-col items-center justify-center gap-6 py-10 md:flex-row md:gap-0"
          style={{ perspective: '1800px' }}
        >

          {/* ── Foundation Card (cyan) ── */}
          <motion.div
            initial={{ rotateY: 15, rotateZ: -6, zIndex: 2 }}
            whileHover={{ rotateY: 0, rotateZ: 0, y: -8, zIndex: 5 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            className="relative flex w-full shrink-0 flex-col overflow-hidden rounded-card md:w-[340px]"
            style={{
              background: 'linear-gradient(180deg, #18181c 0%, #0d0d10 100%)',
              border: '1px solid rgba(91,182,255,0.15)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(91,182,255,0.5), transparent)' }} />
            <div className="pointer-events-none absolute inset-0"
              style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(91,182,255,0.06), transparent)' }} />

            <div className="relative z-10 flex flex-1 flex-col p-7">
              <div className="mb-[60px] flex items-start justify-between">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[11px]"
                  style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <BarChart2 size={20} color="#5bb6ff" strokeWidth={2} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium tracking-[0.04em] text-cyan">{t('foundation.tier')}</p>
                  <p className="mt-1 text-[10.5px] uppercase tracking-[0.18em] text-white/35">{t('foundation.sub')}</p>
                </div>
              </div>

              <div className="mb-3 flex items-baseline gap-1.5">
                <span className="text-[56px] font-light leading-none tracking-[-0.04em] text-cyan">{t('foundation.price')}</span>
                <span className="text-xs uppercase tracking-[0.12em] text-white/35">{t('foundation.period')}</span>
              </div>
              <p className="mb-1 text-sm font-medium text-white/80">{t('foundation.name')}</p>
              <p className="mb-5 text-xs text-white/28">{t('foundation.trialNote')}</p>

              <div className="mb-5 h-px w-full"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(91,182,255,0.15), transparent)' }} />

              <p className="mb-8 text-sm leading-relaxed text-white/40">{t('foundation.desc')}</p>

              <ul className="mb-8 flex flex-1 flex-col gap-3.5">
                {foundationFeatures.map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-sm text-white/55">
                    <Check size={16} color="#5bb6ff" strokeWidth={2.5} className="shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <a
                href="https://buy.stripe.com/7sY7sK4ZBcuE61487P5EY0t"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[13px] font-medium uppercase tracking-[0.14em] text-white/65 transition-all duration-200 hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white"
              >
                {t('foundation.cta')}
                <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>

          {/* ── Prime Card (amber) ── */}
          <motion.div
            initial={{ rotateY: -15, rotateZ: 8, zIndex: 1 }}
            whileHover={{ rotateY: 0, rotateZ: 0, y: -8, zIndex: 5 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            className="relative flex w-full shrink-0 flex-col overflow-hidden rounded-card md:-ml-[60px] md:w-[340px]"
            style={{
              background: 'linear-gradient(180deg, #1a150b 0%, #0d0a06 100%)',
              border: '1px solid rgba(255,168,69,0.2)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(255,168,69,0.06), inset 0 1px 0 rgba(255,255,255,0.06)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="pointer-events-none absolute left-6 right-6 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, #ffa845, transparent)', boxShadow: '0 0 8px rgba(255,168,69,0.6)' }} />
            <div className="pointer-events-none absolute inset-0"
              style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(255,168,69,0.08), transparent)' }} />

            <div className="relative z-10 flex flex-1 flex-col p-7">
              <div className="mb-[60px] flex items-start justify-between">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[11px]"
                  style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Sparkles size={20} color="#ffa845" strokeWidth={2} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium tracking-[0.04em] text-amber">{t('prime.tier')}</p>
                  <p className="mt-1 text-[10.5px] uppercase tracking-[0.18em] text-white/35">{t('prime.sub')}</p>
                </div>
              </div>

              <div className="mb-3 flex items-baseline gap-2">
                <span className="self-start pt-2 text-xs uppercase tracking-[0.1em] text-white/35">{t('prime.from')}</span>
                <span className="text-[56px] font-light leading-none tracking-[-0.04em] text-amber">{t('prime.price')}</span>
              </div>
              <p className="mb-1 text-sm font-medium text-white/80">{t('prime.name')}</p>
              <p className="mb-5 text-xs text-white/28">{t('prime.priceNote')}</p>

              <div className="mb-5 h-px w-full"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,168,69,0.2), transparent)' }} />

              <p className="mb-8 text-sm leading-relaxed text-white/40">{t('prime.desc')}</p>

              <ul className="mb-8 flex flex-1 flex-col gap-3.5">
                {primeFeatures.map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-sm text-white/55">
                    <Check size={16} color="#ffa845" strokeWidth={2.5} className="shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <Link
                href={`/${locale}/agendar`}
                className="flex w-full items-center justify-between rounded-xl bg-[#ffa845] px-4 py-3.5 text-[13px] font-medium uppercase tracking-[0.14em] text-black transition-all duration-200 hover:bg-[#f59e0b]"
              >
                {t('prime.cta')}
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>

        </motion.div>

        {/* ── Bottom note ── */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
          className="mt-4 text-center text-sm text-white/25"
        >
          {t('bottomNote')}{' '}
          <a
            href="#contacto"
            className="text-white/40 underline underline-offset-4 transition-colors duration-200 hover:text-white/65"
          >
            {t('bottomLink')}
          </a>{' '}
          {t('bottomNote2')}
        </motion.p>

      </div>
    </section>
  )
}
