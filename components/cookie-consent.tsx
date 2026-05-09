'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X } from 'lucide-react'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('bralto_cookie_consent')
    if (!consent) {
      const t = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(t)
    }
  }, [])

  function accept(type: 'all' | 'essential') {
    localStorage.setItem('bralto_cookie_consent', type)
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl"
        >
          <div className="relative rounded-2xl border border-white/[0.08] bg-[#111]/90 backdrop-blur-xl px-5 py-4 shadow-2xl">
            {/* Close */}
            <button
              onClick={() => accept('essential')}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-white/30 hover:text-white/60 transition-colors"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5bb6ff]/10 border border-[#5bb6ff]/20">
                  <Cookie size={15} className="text-[#5bb6ff]" />
                </div>
                <span className="text-sm font-semibold text-white">Cookies</span>
              </div>

              <p className="text-xs text-white/40 leading-relaxed flex-1 pr-6">
                Usamos cookies para mejorar su experiencia. Puede elegir aceptarlas todas o solo las esenciales para el funcionamiento del sitio.
              </p>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => accept('essential')}
                  className="rounded-lg border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/70 hover:border-white/20 transition-all duration-150"
                >
                  Solo esenciales
                </button>
                <button
                  onClick={() => accept('all')}
                  className="rounded-lg bg-[#5bb6ff] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#7cc5ff] transition-colors duration-150"
                >
                  Aceptar todo
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
