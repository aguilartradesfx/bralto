"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export default function GuaranteeSection() {
  return (
    <section className="relative py-24 bg-[#000000] overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02]" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Card container */}
          <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-gradient-to-br from-[#0D0D0D]/50 to-[#0D0D0D]/50 backdrop-blur-sm">
            {/* Subtle glow effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-500/5 to-transparent blur-3xl" />

            <div className="relative grid md:grid-cols-[1fr,auto] gap-8 p-8 md:p-12 items-center">
              {/* Left: Text content */}
              <div className="space-y-4">
                {/* Eyebrow */}
                <div className="inline-block">
                  <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
                    GARANTÍA DE DEVOLUCIÓN DE DINERO
                  </span>
                </div>
                {/* Headline */}
                <h2 className="text-3xl md:text-4xl font-bold text-white font-['Space_Grotesk']">
                  Garantía por resultados
                </h2>
                {/* Body text */}
                <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-xl font-['Manrope']">
                  Si después de 12 semanas usted implementó el sistema y sus
                  números no cambian, puede solicitar un reembolso según los
                  términos y condiciones de la garantía.
                </p>
                {/* Optional terms link */}
              </div>

              {/* Right: Guarantee seal */}
              <div className="flex justify-center md:justify-end">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-full blur-2xl" />

                  {/* Shield seal */}
                  <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-full" />
                    <Shield
                      className="w-20 h-20 md:w-24 md:h-24 text-yellow-500/80"
                      strokeWidth={1.5}
                    />

                    {/* Badge text overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs md:text-sm font-bold text-yellow-500/90 font-['Space_Grotesk'] mt-2">
                        100%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
