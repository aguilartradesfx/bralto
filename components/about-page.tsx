'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button'

const PHOTO_1 = 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69ffbef9728556272106b8ac.jpg'
const PHOTO_2 = 'https://assets.cdn.filesafe.space/hdVpvshZP3RGJQbxx8GA/media/69ffc4a9a7b9e0385a428428.jpg'

const ITALIC_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-instrument-serif)',
  fontStyle: 'italic',
  fontWeight: 400,
}

const ITALIC_ORANGE: React.CSSProperties = {
  ...ITALIC_STYLE,
  color: 'rgba(255,168,69,0.85)',
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-5">
      {children}
    </p>
  )
}

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { delay, duration: 0.6, ease: 'easeOut' as const },
  }
}

// ─── 1. Hero ─────────────────────────────────────────────────────────────────

function HeroSection() {
  const t = useTranslations('AboutPage.hero')
  return (
    <section className="relative pt-40 pb-28 overflow-hidden">
      {/* Ambient cyan glow */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div
          style={{
            width: 700,
            height: 700,
            background:
              'radial-gradient(ellipse at center, rgba(91,182,255,0.07) 0%, transparent 68%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.div {...fadeUp(0)}>
          <Eyebrow>{t('eyebrow')}</Eyebrow>
        </motion.div>

        <motion.h1
          {...fadeUp(0.08)}
          className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.06] text-white mb-6"
        >
          {t('headline')}{' '}
          <em style={ITALIC_ORANGE}>{t('headlineItalic')}</em>
        </motion.h1>

        <motion.p
          {...fadeUp(0.16)}
          className="text-lg md:text-xl text-white/38 max-w-2xl mx-auto leading-relaxed"
        >
          {t('sub')}
        </motion.p>
      </div>
    </section>
  )
}

// ─── 2. Origin Story ──────────────────────────────────────────────────────────

function OriginSection() {
  const t = useTranslations('AboutPage.origin')
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* Photo */}
          <motion.div {...fadeUp(0)} className="relative">
            {/* Cyan glow behind photo */}
            <div
              className="pointer-events-none absolute -inset-6 rounded-3xl"
              aria-hidden
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(91,182,255,0.14) 0%, transparent 70%)',
              }}
            />
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.07]">
              <Image
                src={PHOTO_1}
                alt="Alejandro Aguilar — fundador de Bralto"
                width={640}
                height={800}
                className="w-full object-cover"
                priority
              />
            </div>
          </motion.div>

          {/* Text */}
          <div className="flex flex-col justify-center lg:pt-8">
            <motion.div {...fadeUp(0.06)}>
              <Eyebrow>{t('eyebrow')}</Eyebrow>
            </motion.div>

            <motion.h2
              {...fadeUp(0.12)}
              className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.08] text-white mb-8"
            >
              {t('headline')}{' '}
              <em style={ITALIC_ORANGE}>{t('headlineItalic')}</em>
            </motion.h2>

            <motion.div {...fadeUp(0.18)} className="space-y-5">
              <p className="text-base text-white/48 leading-relaxed">{t('p1')}</p>
              <p className="text-base text-white/48 leading-relaxed">{t('p2')}</p>
              <p className="text-base text-white/48 leading-relaxed">{t('p3')}</p>
            </motion.div>

            {/* Stat block */}
            <motion.div
              {...fadeUp(0.26)}
              className="mt-10 pt-8 border-t border-white/[0.06] flex items-center gap-5"
            >
              <span
                className="text-5xl font-bold shrink-0"
                style={{
                  color: '#5bb6ff',
                  textShadow: '0 0 40px rgba(91,182,255,0.55)',
                }}
              >
                {t('statValue')}
              </span>
              <span className="text-sm text-white/38 leading-snug">{t('statLabel')}</span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 3. Mission + Vision ─────────────────────────────────────────────────────

function MissionSection() {
  const t = useTranslations('AboutPage.mission')

  const cards = [
    { label: t('card1Label'), body: t('card1Body') },
    { label: t('card2Label'), body: t('card2Body') },
  ]

  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div {...fadeUp(0)} className="text-center mb-12">
          <Eyebrow>{t('eyebrow')}</Eyebrow>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              {...fadeUp(i * 0.1)}
              className="relative rounded-2xl p-8 overflow-hidden"
              style={{
                background: '#1a140a',
                border: '1px solid rgba(255,168,69,0.22)',
              }}
            >
              {/* Top edge glow */}
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,168,69,0.35), transparent)',
                }}
              />
              <p
                className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] mb-4"
                style={{ color: 'rgba(255,168,69,0.55)' }}
              >
                {card.label}
              </p>
              <p className="text-lg text-white/65 leading-relaxed">{card.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 4. Principles ───────────────────────────────────────────────────────────

function PrinciplesSection() {
  const t = useTranslations('AboutPage.principles')
  const items = t.raw('items') as { number: string; title: string; body: string }[]

  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <motion.div {...fadeUp(0)}>
            <Eyebrow>{t('eyebrow')}</Eyebrow>
          </motion.div>
          <motion.h2
            {...fadeUp(0.08)}
            className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.08] text-white"
          >
            {t('headline')}{' '}
            <em style={ITALIC_ORANGE}>{t('headlineItalic')}</em>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {items.map((item, i) => (
            <motion.div
              key={item.number}
              {...fadeUp(i * 0.08)}
              className="relative rounded-2xl border border-white/[0.06] bg-[#131316] p-8 overflow-hidden group hover:border-white/[0.12] transition-colors duration-300"
            >
              {/* Top edge */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Ghost number */}
              <span
                className="absolute -top-3 -right-1 text-[5.5rem] font-black leading-none select-none pointer-events-none"
                style={{ color: 'rgba(255,168,69,0.06)', fontVariantNumeric: 'tabular-nums' }}
              >
                {item.number}
              </span>

              {/* Orange marker */}
              <div
                className="mb-6 inline-flex items-center justify-center h-8 w-10 rounded-lg text-xs font-mono font-bold tracking-widest"
                style={{
                  background: 'rgba(255,168,69,0.08)',
                  border: '1px solid rgba(255,168,69,0.25)',
                  color: 'rgba(255,168,69,0.75)',
                  textShadow: '0 0 12px rgba(255,168,69,0.4)',
                }}
              >
                {item.number}
              </div>

              <h3 className="text-base font-semibold text-white mb-2.5 leading-snug">
                {item.title}
              </h3>
              <p className="text-sm text-white/40 leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 5. Personal Close ───────────────────────────────────────────────────────

function CloseSection() {
  const t      = useTranslations('AboutPage.close')
  const locale = useLocale()

  return (
    <section className="py-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Text */}
          <div>
            <motion.h2
              {...fadeUp(0)}
              className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.08] text-white mb-7"
            >
              {t('headline')}{' '}
              <em style={ITALIC_ORANGE}>{t('headlineItalic')}</em>
            </motion.h2>

            <motion.p {...fadeUp(0.1)} className="text-base text-white/48 leading-relaxed mb-8">
              {t('body')}
            </motion.p>

            <motion.p {...fadeUp(0.15)} className="text-sm text-white/35 mb-10 italic">
              {t('signature')}
            </motion.p>

            <motion.div {...fadeUp(0.2)}>
              <LiquidMetalButton href={`/${locale}/agendar`} size="lg">
                {t('cta')}
              </LiquidMetalButton>
            </motion.div>
          </div>

          {/* Photo */}
          <motion.div {...fadeUp(0.08)} className="relative order-first lg:order-last">
            {/* Cyan glow */}
            <div
              className="pointer-events-none absolute -inset-6 rounded-3xl"
              aria-hidden
              style={{
                background:
                  'radial-gradient(ellipse at 60% 40%, rgba(91,182,255,0.13) 0%, transparent 70%)',
              }}
            />
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] max-w-md mx-auto lg:mx-0">
              <Image
                src={PHOTO_2}
                alt="Alejandro Aguilar"
                width={480}
                height={560}
                className="w-full object-cover"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function SectionDivider() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AboutPage() {
  return (
    <div className="bg-[#060607] min-h-screen">
      <HeroSection />
      <SectionDivider />
      <OriginSection />
      <SectionDivider />
      <MissionSection />
      <SectionDivider />
      <PrinciplesSection />
      <SectionDivider />
      <CloseSection />
    </div>
  )
}
