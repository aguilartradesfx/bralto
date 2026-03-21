'use client'
import { motion } from 'framer-motion'

export function FounderSection() {
  return (
    <section className="relative py-28 bg-[#080808]">
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <div className="rounded-2xl border border-white/[0.07] bg-[#0e0e0e] overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Photo placeholder */}
            {/* TODO: Reemplazar con foto real */}
            <div className="lg:w-72 shrink-0 bg-gradient-to-br from-[#111111] to-[#0a0a0a] flex items-center justify-center p-12 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-4"
              >
                <div
                  className="h-28 w-28 rounded-full flex items-center justify-center text-3xl font-bold text-white border border-[#F97316]/30"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, rgba(249,115,22,0.2), rgba(249,115,22,0.05))',
                  }}
                >
                  AA
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Alejandro Aguilar</p>
                  <p className="text-xs text-white/35 mt-0.5">Fundador, Bralto</p>
                </div>
              </motion.div>
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="flex-1 p-10 lg:p-12"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-4">
                Sobre el Fundador
              </p>
              <h2 className="text-3xl font-bold text-white mb-6">Hola, soy Alejandro Aguilar.</h2>
              <p className="text-base text-white/55 leading-relaxed mb-6">
                Fundé Bralto porque vi el mismo problema en demasiados negocios: buenos productos,
                buenos equipos, pero operaciones que dependían completamente de personas para cada
                paso. Una venta perdida porque nadie contestó a tiempo. Un lead frío porque el
                seguimiento llegó tarde.
              </p>
              <p className="text-base text-white/55 leading-relaxed mb-8">
                Bralto nació para resolver eso. Hoy combinamos una plataforma todo en uno con
                implementaciones hechas a medida — para que restaurantes, clínicas, inmobiliarias,
                hoteles y docenas de industrias más puedan operar con la eficiencia de una empresa
                grande, sin el costo de serlo.
              </p>

              {/* Credential */}
              <div className="flex items-center gap-3 pt-6 border-t border-white/[0.06]">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-[#F97316] text-xs font-bold">
                  8+
                </div>
                <p className="text-sm text-white/45">
                  Años diseñando sistemas de adquisición automatizados
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
