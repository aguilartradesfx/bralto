'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { MessageSquare, UserCheck, Calendar, Database, ArrowRight } from 'lucide-react';

export function AutomationFlowSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: MessageSquare,
      title: 'Cliente hace contacto',
      description: 'IA detecta consulta en cualquier canal',
      detail: 'WhatsApp, Email, Chat, LinkedIn...',
      color: 'from-white/5 to-blue-500/20',
      iconColor: 'text-white',
      borderColor: 'border-white/10'
    },
    {
      icon: UserCheck,
      title: 'IA califica el lead',
      description: 'Analiza intención y potencial de compra',
      detail: 'Budget, timeline, fit con ICP',
      color: 'from-blue-500/20 to-amber-500-500/20',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-400/30'
    },
    {
      icon: Calendar,
      title: 'Agenda reunión',
      description: 'Sincroniza calendario automáticamente',
      detail: 'Google Calendar, Outlook integrados',
      color: 'from-orange-500/20 to-amber-500/20',
      iconColor: 'text-orange-400',
      borderColor: 'border-orange-400/30'
    },
    {
      icon: Database,
      title: 'Actualiza CRM',
      description: 'Toda la info al equipo en tiempo real',
      detail: 'Salesforce, HubSpot, Pipedrive',
      color: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-400/30'
    }
  ];

  useEffect(() => {
    if (!isInView) return;
    
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isInView, steps.length]);

  return (
    <section ref={ref} className="relative py-32 bg-[#0D0D0D] overflow-hidden">
      <div className="absolute inset-0 bg-noise" />
      
      {/* Gradient accents */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-white/3 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-orange-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-20"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-white/3 border border-white/10 text-white text-sm font-medium mb-6">
            Automatización Completa
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            De la consulta al{' '}
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              meeting confirmado
            </span>
            {' '}en segundos
          </h2>
          <p className="text-xl text-gray-400">
            Tu IA trabaja 24/7: responde, califica, agenda y sincroniza.
            Todo automático, todo en tiempo real.
          </p>
        </motion.div>

        {/* Flow visualization */}
        <div className="max-w-6xl mx-auto">
          {/* Desktop view */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Connection lines - behind cards */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 -translate-y-1/2 -z-10" />
              
              <div className="relative grid grid-cols-4 gap-8 z-10">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: index * 0.2 }}
                    className="relative"
                  >
                    {/* Animated connector */}
                    {index < steps.length - 1 && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={activeStep >= index ? { scaleX: 1 } : { scaleX: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute top-1/2 left-full w-full h-1 bg-gradient-to-r from-orange-400 to-amber-500-400 origin-left -translate-y-1/2 -z-10"
                        style={{ width: '100%' }}
                      />
                    )}

                    <div className={`relative group ${activeStep === index ? 'scale-105' : ''} transition-transform duration-500`}>
                      {/* Glow effect for active step */}
                      {activeStep === index && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-2xl blur-xl `} />
                      )}

                      <div className={`relative p-6 rounded-2xl bg-[#0D0D0D]/80 border-2 ${
                        activeStep === index ? step.borderColor : 'border-gray-800'
                      } backdrop-blur-sm transition-all duration-500`}>
                        {/* Icon */}
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 mx-auto ${
                          activeStep === index ? 'scale-110' : ''
                        } transition-transform duration-500`}>
                          <step.icon className={`w-8 h-8 ${activeStep === index ? step.iconColor : 'text-gray-500'}`} />
                        </div>

                        {/* Step number */}
                        <div className="text-center mb-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono-data ${
                            activeStep === index 
                              ? 'bg-white/5 text-white border border-white/10' 
                              : 'bg-gray-800 text-gray-500'
                          }`}>
                            Paso {index + 1}
                          </span>
                        </div>

                        {/* Content */}
                        <h3 className={`text-lg font-bold mb-2 text-center ${
                          activeStep === index ? 'text-white' : 'text-gray-400'
                        }`}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-500 text-center mb-3">
                          {step.description}
                        </p>
                        <p className={`text-xs text-center ${
                          activeStep === index ? 'text-white' : 'text-gray-600'
                        }`}>
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile view */}
          <div className="lg:hidden space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.15 }}
                className="relative"
              >
                <div className={`relative ${activeStep === index ? 'scale-105' : ''} transition-transform duration-500`}>
                  {activeStep === index && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-2xl blur-xl`} />
                  )}

                  <div className={`relative p-6 rounded-2xl bg-[#0D0D0D]/80 border-2 ${
                    activeStep === index ? step.borderColor : 'border-gray-800'
                  } backdrop-blur-sm`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0`}>
                        <step.icon className={`w-6 h-6 ${step.iconColor}`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded bg-white/3 text-white text-xs font-mono-data">
                            Paso {index + 1}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-2">
                          {step.description}
                        </p>
                        <p className="text-xs text-white">
                          {step.detail}
                        </p>
                      </div>

                      {index < steps.length - 1 && (
                        <ArrowRight className="w-5 h-5 text-gray-600 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Connector line for mobile */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-orange-400 to-amber-500-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-20 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {[
            { value: '100%', label: 'Automatizado' },
            { value: '0', label: 'Intervención humana' },
            { value: '24/7', label: 'Disponibilidad' }
          ].map((stat, index) => (
            <div key={index} className="text-center p-6 rounded-xl bg-[#0D0D0D]/50 border border-white/8">
              <div className="text-4xl font-bold font-mono-data bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
