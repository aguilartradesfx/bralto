import { ArrowRight, TrendingUp } from 'lucide-react'

const FUNNEL_URL = 'https://funnellabs.bralto.io'

const bullets = [
  'Predecí cuántos leads y ventas vas a generar antes de gastar',
  'Identificá el cuello de botella que mata tus conversiones',
  'Compará escenarios: ¿webinar o VSL? ¿Meta o Google?',
  'Análisis con IA incluido — te dice exactamente dónde mejorar',
]

export function FunnelLabSection() {
  return (
    <section
      className="relative py-32 overflow-hidden"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_70%_50%,rgba(249,115,22,0.06),transparent)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <div>
            {/* Badges */}
            <div className="flex items-center gap-2.5 mb-8">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ background: '#F97316' }}
              >
                Nuevo
              </span>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/60"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Herramienta gratuita
              </span>
            </div>

            <h2
              className="font-bold tracking-tight leading-[0.92] text-white mb-6"
              style={{ fontSize: 'clamp(2.8rem, 5vw, 5rem)' }}
            >
              FunnelLab
              <br />
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>by Bralto.</span>
            </h2>

            <p className="text-lg text-white/50 leading-relaxed mb-10 max-w-lg">
              Simulá tu embudo de ventas completo y predecí el resultado
              de tu estrategia — antes de gastar un peso en publicidad.
            </p>

            <ul className="space-y-3 mb-12">
              {bullets.map(b => (
                <li key={b} className="flex items-start gap-3 text-sm text-white/50">
                  <span
                    className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ background: '#F97316' }}
                  />
                  {b}
                </li>
              ))}
            </ul>

            <a
              href={FUNNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#ea6c0c] text-white font-semibold text-sm transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] active:scale-[0.98]"
            >
              Probar FunnelLab gratis
              <ArrowRight size={15} />
            </a>
          </div>

          {/* Right: visual card */}
          <div className="relative">
            {/* Outer glow */}
            <div
              className="absolute -inset-px rounded-2xl opacity-60"
              style={{
                background: 'linear-gradient(135deg, rgba(249,115,22,0.4), rgba(249,115,22,0.05) 60%, transparent)',
              }}
            />

            <div
              className="relative rounded-2xl p-8 overflow-hidden"
              style={{
                background: 'rgba(10,10,10,0.9)',
                border: '1px solid rgba(249,115,22,0.15)',
              }}
            >
              {/* Mock funnel visualizer */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316]/10 border border-[#F97316]/20">
                  <TrendingUp size={16} className="text-[#F97316]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Simulación activa</p>
                  <p className="text-xs text-white/35">Funnel de ventas — Google Ads</p>
                </div>
              </div>

              {/* Funnel stages */}
              {[
                { label: 'Visitas',       value: '10,000', pct: 100, color: 'rgba(255,255,255,0.12)' },
                { label: 'Leads',         value: '850',    pct: 55,  color: 'rgba(249,115,22,0.35)' },
                { label: 'Prospectos',    value: '190',    pct: 35,  color: 'rgba(249,115,22,0.55)' },
                { label: 'Clientes',      value: '38',     pct: 18,  color: '#F97316' },
              ].map(stage => (
                <div key={stage.label} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/40">{stage.label}</span>
                    <span className="text-xs font-bold text-white">{stage.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${stage.pct}%`, background: stage.color }}
                    />
                  </div>
                </div>
              ))}

              {/* ROI summary */}
              <div
                className="mt-8 flex items-center justify-between rounded-xl px-5 py-4"
                style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)' }}
              >
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">ROI proyectado</p>
                  <p className="text-2xl font-bold text-white">340%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Costo por cliente</p>
                  <p className="text-2xl font-bold text-[#F97316]">$26</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
