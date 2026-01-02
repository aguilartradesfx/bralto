'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Facebook, Instagram, Globe, Zap, Users, UserCheck, Calendar, TrendingUp, CheckCircle, Repeat } from 'lucide-react';

const LEAD_SOURCES = [
  { name: 'WhatsApp', icon: MessageCircle },
  { name: 'Messenger', icon: MessageCircle },
  { name: 'Instagram', icon: Instagram },
  { name: 'Meta', icon: Facebook },
  { name: 'Google Ads', icon: Globe },
];

const ROADMAP_STEPS = [
  {
    id: 'nuevo_lead',
    title: 'Nuevo lead',
    shortLabel: 'Lead entra al sistema',
    text: 'Los leads llegan a la plataforma luego de interesarse en sus anuncios.',
    icon: Zap,
  },
  {
    id: 'primer_contacto',
    title: 'Primer contacto',
    shortLabel: 'IA responde en minutos',
    text: 'Un agente de inteligencia artificial contacta al lead en menos de 2 minutos después de dejar su información, ya sea por llamada o por WhatsApp.',
    icon: Users,
  },
  {
    id: 'filtra_y_cualifica',
    title: 'Filtra y cualifica',
    shortLabel: 'Detecta interés real',
    text: 'En base a sus instrucciones, el agente hará preguntas estratégicas para filtrar y cualificar a sus leads. Esto puede ser por audios y textos, detectando la experiencia del lead y su nivel de interés.',
    icon: UserCheck,
  },
  {
    id: 'seguimiento',
    title: 'Seguimiento',
    shortLabel: 'No se pierden leads',
    text: 'En caso de que un lead no responda, el agente hará un seguimiento los 7 días con mensajes y llamadas para intentar recuperarlo.',
    icon: Repeat,
  },
  {
    id: 'agendamiento',
    title: 'Agendamiento',
    shortLabel: 'Agenda se llena sola',
    text: 'Ya sea una reunión por Zoom o una visita a una clínica, el agente se encargará de llenar su agenda con prospectos interesados listos para ser atendidos.',
    icon: Calendar,
  },
  {
    id: 'cierre_venta',
    title: 'Cierre / Venta',
    shortLabel: 'Usted solo cierra',
    text: 'Una vez el agente ha agendado todo por usted, usted solamente se encarga de la venta.',
    icon: TrendingUp,
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % ROADMAP_STEPS.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section id="como-funciona" className="relative py-24 pb-40 overflow-hidden bg-gradient-to-b from-black via-[#0D0D0D] to-black">
      <div className="absolute inset-0 bg-noise opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            ¿Cómo funciona?
          </h2>
        </motion.div>

        {/* Lead Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="text-center mb-6">
            <h3 className="text-sm text-white/80 font-medium tracking-wide">
              De aquí vienen sus leads
            </h3>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {LEAD_SOURCES.map((source, index) => {
              const Icon = source.icon;
              return (
                <motion.div
                  key={source.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="relative"
                >
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-[#0D0D0D]/80 to-[#0D0D0D]/80 border border-white/10 backdrop-blur-sm">
                    <Icon className="w-4 h-4 text-white" />
                    <span className="text-xs text-gray-300 font-medium">{source.name}</span>
                  </div>

                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Connected Roadmap - Desktop */}
        <div className="hidden lg:block max-w-6xl mx-auto">
          <div 
            className="relative"
          >
            {/* Animated backbone */}
            <div className="absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
            <motion.div
              className="absolute top-20 left-0 h-0.5 bg-gradient-to-r from-orange-400/60 via-orange-500 to-amber-500/60"
              initial={{ width: '0%' }}
              animate={{ width: `${(activeStep + 1) * (100 / ROADMAP_STEPS.length)}%` }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />

            {/* Steps */}
            <div className="grid grid-cols-6 gap-4">
              {ROADMAP_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === activeStep;
                const isCompleted = index < activeStep;
                const isHovered = hoveredStep === index;
                const showDetails = isHovered || isActive;

                return (
                  <motion.div
                    key={step.id}
                    className="relative flex flex-col items-center"
                    onMouseEnter={() => setHoveredStep(index)}
                    onMouseLeave={() => setHoveredStep(null)}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    {/* Node */}
                    <motion.div
                      className={`relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                        isActive || isHovered
                          ? 'bg-white/5/30 border-2 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                          : isCompleted
                          ? 'bg-white/5 border-2 border-white/10/50'
                          : 'bg-[#0D0D0D]/80 border-2 border-white/10'
                      }`}
                      animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className={`w-7 h-7 ${isActive || isHovered ? 'text-white' : isCompleted ? 'text-white/70' : 'text-white/40'}`} />
                      {isCompleted && !isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-white/5 rounded-full flex items-center justify-center"
                        >
                          <CheckCircle className="w-3 h-3 text-black" />
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Title - Always visible */}
                    <div className="mt-6 text-center">
                      <h4 className={`text-sm font-bold mb-1 transition-colors ${
                        isActive || isHovered ? 'text-white' : 'text-gray-400'
                      }`}>
                        {step.title}
                      </h4>
                      <p className={`text-xs transition-colors ${
                        isActive || isHovered ? 'text-white' : 'text-gray-500'
                      }`}>
                        {step.shortLabel}
                      </p>
                    </div>

                    {/* Expandable details */}
                    <AnimatePresence>
                      {showDetails && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute top-full mt-4 w-48 z-20"
                        >
                          <div className="p-4 rounded-xl bg-gradient-to-br from-[#0D0D0D]/95 to-[#0D0D0D]/95 border border-white/10 backdrop-blur-md shadow-xl">
                            <p className="text-xs text-gray-300 leading-relaxed">
                              {step.text}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>


                  </motion.div>
                );
              })}
            </div>

            {/* Progress indicator */}
            <div className="flex justify-center gap-2 mt-40">
              {ROADMAP_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === activeStep ? 'w-8 bg-white/5' : 'w-1.5 bg-white/5/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Timeline */}
        <div className="lg:hidden space-y-6 max-w-lg mx-auto">
          {ROADMAP_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="flex gap-4">
                  {/* Node */}
                  <div className="relative flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 border-2 border-white/10/40 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {index < ROADMAP_STEPS.length - 1 && (
                      <div className="w-0.5 h-full bg-gradient-to-b from-orange-400/40 to-white/3 mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <h4 className="text-base font-bold text-white mb-1">{step.title}</h4>
                    <p className="text-sm text-white mb-2">{step.shortLabel}</p>
                    <p className="text-sm text-gray-400 leading-relaxed">{step.text}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
