"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCTAButton } from "@/components/ui/AnimatedCTAButton";
import { ArrowRight, X } from "lucide-react";
import { useMobileDetect } from "@/hooks/use-mobile-detect";

export function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const isMobile = useMobileDetect();

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          const shouldShow = scrollPosition > window.innerHeight && !isDismissed;
          setIsVisible(shouldShow);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (isMobile) {
    // Simpler version for mobile
    return isVisible ? (
      <div className="fixed bottom-4 right-4 left-4 z-50 transition-all duration-300">
        <div className="relative p-4 rounded-xl backdrop-blur-sm" style={{ background: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-lg bg-white/5 hover:bg-white/10"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>

          <div className="pr-8">
            <h3 className="text-base font-bold text-white mb-2">
              ¿Listo/a para iniciar?
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              Hoy no tiene que pagar nada.
            </p>

            <a
              href="https://checkout.bralto.io"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2.5 px-4 text-center font-semibold text-white rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 transition-all"
            >
              INICIAR PRUEBA GRATUITA
            </a>
          </div>
        </div>
      </div>
    ) : null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl blur-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />

            <div className="relative p-4 rounded-2xl backdrop-blur-xl" style={{ background: 'rgba(20,20,20,0.8)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>

              <div className="pr-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full " />
                  <span className="text-sm font-medium text-green-400">
                    14 personas iniciaron hoy
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  ¿Listo/a para iniciar?
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Hoy no tiene que pagar nada.
                </p>

                <AnimatedCTAButton
                  href="https://checkout.bralto.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  className="w-full"
                >
                  <span className="flex items-center justify-center gap-2">
                    INICIAR PRUEBA GRATUITA
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </AnimatedCTAButton>
              </div>

              {/* Top accent line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
