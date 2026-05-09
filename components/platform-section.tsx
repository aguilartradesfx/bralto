'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button'
import { useTranslations, useLocale } from 'next-intl'

const TAB_IDS = ['organizacion', 'sitios', 'multicanal'] as const

export function PlatformSection() {
  const t = useTranslations('PlatformSection')
  const locale = useLocale()
  const period = locale === 'en' ? '/mo' : '/mes'

  const replaced = [
    { tool: 'HubSpot',               price: `$800+${period}` },
    { tool: 'ClickFunnels',          price: `$297${period}` },
    { tool: 'Wix',                   price: `$39${period}` },
    { tool: 'Typeform',              price: `$59${period}` },
    { tool: 'Mailchimp',             price: `$350${period}` },
    { tool: 'Calendly',              price: `$16${period}` },
    { tool: 'Twilio / SMS',          price: `$200+${period}` },
    { tool: 'ManyChat',              price: `$145${period}` },
    { tool: 'Kajabi',                price: `$149${period}` },
    { tool: 'Stripe + integrations', price: `$120+${period}` },
  ]

  const [activeTab, setActiveTab] = useState<typeof TAB_IDS[number]>('organizacion')

  const tabs = TAB_IDS.map((id) => ({
    id,
    label: t(`tabs.${id}.label`),
    features: t.raw(`tabs.${id}.features`) as string[],
  }))

  const TAB_ICONS: Record<string, string> = { organizacion: '◈', sitios: '◉', multicanal: '◎' }
  const active = tabs.find((tb) => tb.id === activeTab)!

  return (
    <section id="plataforma" className="relative py-28">

      <div className="relative z-10 mx-auto max-w-6xl px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28 mb-4"
          >
            {t('label')}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-4 leading-[1.08]"
          >
            {t('headline')}
            <br />
            <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.32)' }}>
              {t('headlineItalic')}
            </em>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18 }}
            className="text-base text-white/38 max-w-xl mx-auto"
          >
            {t('desc')}
          </motion.p>
        </div>

        {/* Tabs + features */}
        <div className="rounded-card border border-white/[0.06] bg-[#131316] overflow-hidden mb-5">
          <div className="flex border-b border-white/[0.06]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-[#ff6d28] bg-white/[0.02]'
                    : 'text-white/35 hover:text-white/65 border-b-2 border-transparent'
                }`}
              >
                <span style={{ color: activeTab === tab.id ? '#ff6d28' : 'rgba(255,255,255,0.3)' }}>
                  {TAB_ICONS[tab.id]}
                </span>
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0"
            >
              {active.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 px-6 py-4 border-b border-r border-white/[0.04] last:border-r-0"
                >
                  <Check size={13} className="shrink-0" style={{ color: '#ff6d28', filter: 'drop-shadow(0 0 4px rgba(255,109,40,0.5))' }} />
                  <span className="text-sm text-white/60">{feature}</span>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Comparison table */}
        <div className="rounded-card border border-white/[0.06] bg-[#131316] overflow-hidden">
          <div className="px-8 py-6 border-b border-white/[0.06]">
            <h3 className="text-lg font-semibold text-white">{t('replacesHeadline')}</h3>
            <p className="text-sm text-white/35 mt-1">{t('replacesDesc')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Tools list */}
            <div className="border-r border-white/[0.05]">
              <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">{t('toolHeader')}</span>
                <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">{t('costHeader')}</span>
              </div>
              {replaced.map((item) => (
                <div
                  key={item.tool}
                  className="px-6 py-3.5 border-b border-white/[0.03] flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <X size={12} className="text-red-400/50" />
                    <span className="text-sm text-white/50">{item.tool}</span>
                  </div>
                  <span className="text-sm font-mono text-white/28">{item.price}</span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="flex flex-col justify-center items-center p-10 text-center">
              <p className="text-[10px] text-white/28 uppercase tracking-widest mb-6">{t('withoutLabel')}</p>
              <div className="mb-2">
                <span className="text-5xl font-bold text-white/18 line-through" style={{ textDecorationColor: 'rgba(239,68,68,0.35)' }}>
                  $6,000+
                </span>
                <span className="text-xl text-white/25 ml-1">{period}</span>
              </div>
              <div className="my-8 h-px w-16 bg-white/[0.08]" />
              <p className="text-[10px] text-white/28 uppercase tracking-widest mb-3">{t('withLabel')}</p>
              <div className="mb-2">
                <span className="text-6xl font-bold" style={{ color: '#ff6d28', textShadow: '0 0 30px rgba(255,109,40,0.35)' }}>
                  $87
                </span>
                <span className="text-xl text-white/40 ml-1">{period}</span>
              </div>
              <p className="text-xs text-white/28 mt-4 max-w-xs">{t('allToolsNote')}</p>

              <div className="mt-8 w-full">
                <p className="text-xs text-white/42 mb-4 leading-relaxed max-w-xs mx-auto">
                  {t('platformIncluded')}
                </p>
                <LiquidMetalButton href="https://buy.stripe.com/7sY7sK4ZBcuE61487P5EY0t" size="md">
                  {t('cta')}
                </LiquidMetalButton>
                <p className="text-xs text-white/25 mt-3">{t('ctaNote')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
