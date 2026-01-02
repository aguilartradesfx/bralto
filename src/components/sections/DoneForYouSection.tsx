'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { AnimatedCTAButton } from '@/components/ui/AnimatedCTAButton';
import Image from 'next/image';

export function DoneForYouSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const valuePoints = [
    'Creación de un agente adaptado a su negocio.',
    'Implementación de un sistema de seguimiento completo.',
    'Plataforma configurada 100% a su medida.'
  ];

  return (
    <section 
      id="done-for-you"
      ref={sectionRef}
      className="relative py-24 px-6 overflow-hidden bg-gradient-to-b from-black via-[#0D0D0D] to-black"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent_50%)]" />
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-white/3 rounded-full blur-[120px]" />

      <div className="relative max-w-6xl mx-auto">
        {/* Headline compacto */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-xs font-bold text-white tracking-widest uppercase">NO STRESS...</span>
          <h2 className="text-xl md:text-2xl text-gray-400 mt-2">
            ¿Sin tiempo para configurar todo?
          </h2>
          <h3 className="text-2xl md:text-4xl font-bold text-white mt-1">
            Nosotros <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">lo hacemos por usted.</span>
          </h3>
        </motion.div>

        {/* Main content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] max-w-md mx-auto">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-amber-500/20 blur-3xl -z-10 scale-110" />
              
              {/* Image */}
              <img 
                src="https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/693a4b44b263275af7b49c7e.png"
                alt="Experto"
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-8"
          >
            {/* Main paragraph */}
            <div className="space-y-4">
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
                Por <span className="text-2xl md:text-3xl font-bold text-white">$47</span> se libera del estrés de crear el sistema por su cuenta,
              </p>
              <p className="text-lg md:text-xl text-white font-semibold leading-relaxed">
                nosotros montamos todo por usted y se lo entregamos funcionando en menos de <span className="text-white">72 horas.</span>
              </p>
            </div>

            {/* Value points */}
            <div className="space-y-4">
              {valuePoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-3 group"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-black" strokeWidth={3} />
                  </div>
                  <p className="text-gray-300 text-base md:text-lg leading-relaxed">
                    {point}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="space-y-4"
            >
              <AnimatedCTAButton 
                href="https://checkout.bralto.io"
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                className="px-12 py-6 text-lg"
              >
                ¡ME INTERESA!
              </AnimatedCTAButton>
              <p className="text-sm text-gray-400 italic">
                Pruebe el sistema primero, si no le funciona, no paga.
              </p>
            </motion.div>

            {/* Trust reinforcement */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="text-xs text-white/70 text-center lg:text-left"
            >
              Configurado por expertos. Sin riesgo. Sin estrés.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
