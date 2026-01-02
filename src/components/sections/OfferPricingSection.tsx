'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';
import { AnimatedCTAButton } from '@/components/ui/AnimatedCTAButton';
import Image from 'next/image';

export function OfferPricingSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const features = [
    "Entrenamiento completo 'AI Agent en 48hrs'",
    "Agentes de Inteligencia Artificial",
    "CRM y gestión de contactos",
    "Constructor de sitios web y funnels IA",
    "Calendario y sistema de reservas",
    "Campañas de Email y WhatsApp",
    "Mensajería bidireccional (SMS, WhatsApp y Email)",
    "+1000 plantillas personalizables",
    "Gestión de reputación con reseñas automatizadas",
    "Seguimiento de oportunidades (pipelines)",
    "Facebook Messenger, Instagram y Google Messaging",
    "Enlaces de pago | Gestión de pagos y facturas",
    "Y muchas más herramientas."
  ];

  const avatars = [
    { id: 1, image: 'https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6957643fedb8a20fc93618ae.png' },
    { id: 2, image: 'https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6957643f7483034b1697e13d.png' },
    { id: 3, image: 'https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6957643fedb8a2dac13618ad.png' },
    { id: 4, image: 'https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6957643f748303211797e13c.png' },
  ];

  return (
    <section 
      id="precios"
      ref={sectionRef}
      className="relative py-24 px-6 overflow-hidden bg-gradient-to-b from-black via-[#0D0D0D] to-black"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan/5 rounded-full blur-[150px]" />

      <div className="relative max-w-7xl mx-auto">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center text-xs font-bold text-electric mb-3 tracking-widest uppercase"
        >
          SOLO EN ESTA VENTANA
        </motion.p>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl md:text-5xl font-bold text-white text-center mb-4 leading-tight"
        >
          ESTO ES LO QUE OBTIENE
        </motion.h2>

        {/* Urgency note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center text-sm text-white/70 mb-16"
        >
          Oferta disponible por tiempo limitado
        </motion.p>

        {/* Main offer card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#0D0D0D]/90 to-[#0D0D0D]/90 backdrop-blur-xl overflow-hidden hover:border-cyan/30 transition-all duration-500 group"
        >
          {/* Subtle glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative grid lg:grid-cols-2 gap-8 p-8 md:p-12">
            {/* Left media column */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400-500/20 via-[#0D0D0D] to-[#0D0D0D] p-8 border border-white/10-500/20">
                {/* Stacked visuals placeholder */}
                <div className="space-y-6">
                  {/* Laptop mockup */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="aspect-video rounded-lg overflow-hidden group-hover:translate-y-[-2px] transition-transform duration-500"
                  >
                    <img 
                      src="https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/69575d8a035c3a43af4096af.png"
                      alt="Dashboard Principal"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>

                  {/* UI preview grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden group-hover:translate-y-[-2px] transition-transform duration-500">
                      <img 
                        src="https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/69575d89edb8a20ef9356c47.png"
                        alt="Funnels"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="aspect-square rounded-lg overflow-hidden group-hover:translate-y-[-2px] transition-transform duration-500 delay-75">
                      <img 
                        src="https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/69575d8974830308e2973ae9.png"
                        alt="Analytics"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>

                  {/* Metrics snapshot */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="h-24 rounded-lg overflow-hidden group-hover:translate-y-[-2px] transition-transform duration-500"
                  >
                    <img 
                      src="https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/69575d8a05b511b83c8d6ea6.png"
                      alt="Pipeline / Métricas"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Right content column */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col justify-between"
            >
              {/* Plan name and pricing */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">Essentials</h3>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-baseline gap-3">
                    <p className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">
                      $87
                    </p>
                    <span className="text-gray-400 text-lg">/ Mes</span>
                  </div>
                  <p className="text-gray-500 line-through text-sm">$297 / Mes</p>
                  <p className="text-lg font-semibold text-green-400">Hoy paga $0</p>
                </div>

                {/* Features checklist */}
                <div className="space-y-3 mb-6">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.6 + index * 0.03 }}
                      className="flex items-start gap-3"
                    >
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-black" strokeWidth={3} />
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {feature}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Footer note */}
                <p className="text-xs text-gray-500 italic mb-8">
                  Sin contratos, cancela en cualquier momento.
                </p>

                {/* CTA inside card */}
                <div className="text-center space-y-4 pt-6 border-t border-white/8">
                  <AnimatedCTAButton
                    href="https://checkout.bralto.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    size="lg"
                    className="w-full px-16 py-6 text-xl"
                  >
                    ACCEDER AHORA
                  </AnimatedCTAButton>

                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-green-400">
                      HOY PAGA $0
                    </p>
                    <p className="text-sm text-gray-500 line-through">
                      Precio original $297 / Mes
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Social proof - outside of card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex flex-col items-center gap-4 mt-12"
        >
          {/* Avatars */}
          <div className="flex -space-x-3">
            {avatars.map((avatar, index) => (
              <motion.div
                key={avatar.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 1.1 + index * 0.05 }}
                className="w-12 h-12 rounded-full border-2 border-black overflow-hidden"
              >
                <img 
                  src={avatar.image} 
                  alt={`User ${avatar.id}`}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>

          <p className="text-sm text-gray-400 max-w-2xl text-center">
            Únase a más de <span className="text-white font-semibold">4,600 personas</span> y acelere el crecimiento de su negocio mientras ahorra tiempo y genera más ventas.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
