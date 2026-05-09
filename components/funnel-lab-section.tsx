import { ArrowRight, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'

const FUNNEL_URL = 'https://funnellabs.bralto.io'

export function FunnelLabSection() {
  const t = useTranslations('FunnelLabSection')
  const bullets = t.raw('bullets') as string[]
  const stages  = t.raw('stages') as string[]

  return (
    <section className="relative py-32 overflow-hidden">

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-black bg-[#ffa845]">
                {t('badge1')}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/45 border border-white/[0.08] bg-white/[0.04]">
                {t('badge2')}
              </span>
            </div>

            <h2
              className="font-semibold tracking-tight leading-[0.92] text-white mb-6"
              style={{ fontSize: 'clamp(2.8rem, 5vw, 5rem)' }}
            >
              {t('title')}
              <br />
              <em style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,168,69,0.55)' }}>
                {t('titleItalic')}
              </em>
            </h2>

            <p className="text-lg text-white/42 leading-relaxed mb-10 max-w-lg">
              {t('desc')}
            </p>

            <ul className="space-y-3 mb-12">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/42">
                  <span className="mt-1.5 h-1 w-1 rounded-full shrink-0 bg-[#ffa845]" />
                  {b}
                </li>
              ))}
            </ul>

            <a
              href={FUNNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#ffa845] hover:bg-[#f59e0b] text-black font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(255,168,69,0.35)] active:scale-[0.98] uppercase tracking-wide"
            >
              {t('cta')}
              <ArrowRight size={15} />
            </a>
          </div>

          {/* Right: visual card */}
          <div className="relative">
            <div
              className="absolute -inset-px rounded-card opacity-50"
              style={{ background: 'linear-gradient(135deg, rgba(255,168,69,0.35), rgba(255,168,69,0.05) 60%, transparent)' }}
            />

            <div
              className="relative rounded-card p-8 overflow-hidden border"
              style={{ background: '#0e0d0a', borderColor: 'rgba(255,168,69,0.12)' }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ffa845]/35 to-transparent" />

              {/* Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffa845]/10 border border-[#ffa845]/20">
                  <TrendingUp size={16} className="text-[#ffa845]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t('cardTitle')}</p>
                  <p className="text-xs text-white/30">{t('cardSub')}</p>
                </div>
              </div>

              {/* Funnel stages */}
              {[
                { value: '10,000', pct: 100, color: 'rgba(255,255,255,0.1)' },
                { value: '850',    pct: 55,  color: 'rgba(255,168,69,0.3)' },
                { value: '190',    pct: 35,  color: 'rgba(255,168,69,0.55)' },
                { value: '38',     pct: 18,  color: '#ffa845' },
              ].map((stage, i) => (
                <div key={i} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/35">{stages[i]}</span>
                    <span className="text-xs font-bold text-white">{stage.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.04]">
                    <div className="h-full rounded-full transition-all" style={{ width: `${stage.pct}%`, background: stage.color }} />
                  </div>
                </div>
              ))}

              {/* ROI summary */}
              <div
                className="mt-8 flex items-center justify-between rounded-xl px-5 py-4"
                style={{ background: 'rgba(255,168,69,0.05)', border: '1px solid rgba(255,168,69,0.1)' }}
              >
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/25 mb-0.5">{t('roiLabel')}</p>
                  <p className="text-2xl font-bold text-white">340%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-white/25 mb-0.5">{t('cpaLabel')}</p>
                  <p className="text-2xl font-bold text-[#ffa845]">$26</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
