'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from './AnimatedBackground';
import { AnimatedCTAButton } from '@/components/ui/AnimatedCTAButton';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-noise">
      <AnimatedBackground />
      
      <div className="absolute inset-0 bg-mesh-gradient z-[1]" />
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-5xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-block mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }} />
              Potenciado por IA de última generación
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight"
          >
            <span className="bg-gradient-to-r from-white via-orange-400 to-amber-500 bg-clip-text text-transparent">
              Agentes de IA que
            </span>
            <br />
            <span className="text-white">transforman tu negocio</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Respuesta instantánea 24/7, calificación automática de leads y
            conversión que nunca duerme. Tu equipo potenciado con inteligencia
            artificial enterprise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <AnimatedCTAButton
              href="https://checkout.bralto.io"
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              className="px-8 py-6 text-lg"
            >
              <span className="flex items-center gap-2">
                Reservar Demo Gratuita
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </AnimatedCTAButton>

            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg font-semibold backdrop-blur-sm transition-all duration-300"
              style={{ border: '1px solid rgba(255, 255, 255, 0.15)', color: 'white' }}
            >
              Ver en acción
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-gray-400"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <span>Setup en 5 minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <span>Soporte en español</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="w-6 h-10 rounded-full flex items-start justify-center p-2" style={{ border: '2px solid rgba(255, 255, 255, 0.15)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
      </motion.div>
    </section>
  );
}
