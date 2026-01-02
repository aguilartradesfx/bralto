'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Database, ArrowRightLeft, Zap } from 'lucide-react';

export function IntegrationsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const integrations = [
    { name: 'Salesforce', category: 'CRM' },
    { name: 'HubSpot', category: 'CRM' },
    { name: 'Pipedrive', category: 'CRM' },
    { name: 'Google Calendar', category: 'Calendar' },
    { name: 'Outlook', category: 'Calendar' },
    { name: 'Zoom', category: 'Meetings' },
    { name: 'Slack', category: 'Communication' },
    { name: 'WhatsApp', category: 'Messaging' }
  ];

  return (
    <section ref={ref} className="relative py-32 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-noise" />
      
      {/* Gradient mesh */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-20" />

      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-20"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-white/3 border border-white/10 text-white text-sm font-medium mb-6">
            Integración Perfecta
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Se conecta con{' '}
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              tu stack actual
            </span>
          </h2>
          <p className="text-xl text-gray-400">
            Sincronización bidireccional en tiempo real con tus herramientas favoritas
          </p>
        </motion.div>

        {/* Integration flow diagram */}
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Center - AI Agent */}
            <div className="flex justify-center mb-16">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/30 to-amber-500/30 rounded-2xl blur-2xl " />
                <div className="relative px-12 py-8 rounded-2xl bg-gradient-to-br from-[#0D0D0D] to-[#0D0D0D] border-2 border-white/10 shadow-2xl">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                    <Zap className="w-10 h-10 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold text-white text-center mb-2">
                    Agente IA
                  </h3>
                  <p className="text-gray-400 text-sm text-center">
                    Centro de operaciones
                  </p>
                </div>
              </div>
            </div>

            {/* Connection lines */}
            <div className="absolute top-32 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-orange-400 to-transparent" />

            {/* Integrations grid */}
            <div className="grid md:grid-cols-4 gap-6">
              {integrations.map((integration, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="relative group"
                >
                  {/* Static data flow indicator */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-b from-orange-400/40 to-transparent" />

                  <div className="relative h-full p-6 rounded-xl bg-gradient-to-br from-[#0D0D0D]/80 to-[#0D0D0D]/80 border border-white/5 backdrop-blur-sm hover:border-cyan/30 transition-all duration-300 group-hover:scale-105">
                    <div className="w-12 h-12 mb-4 rounded-lg bg-gradient-to-br from-white/5 to-white/3 flex items-center justify-center">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-white mb-1">
                      {integration.name}
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                      {integration.category}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-white">
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>Sync bidireccional</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="mt-16 grid md:grid-cols-3 gap-6 max-w-3xl mx-auto"
            >
              <div className="text-center p-6 rounded-xl bg-[#0D0D0D]/50 border border-white/8">
                <div className="text-3xl font-bold font-mono-data text-white mb-2">
                  &lt;1s
                </div>
                <div className="text-sm text-gray-400">Latencia de sync</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-[#0D0D0D]/50 border border-green-400/10">
                <div className="text-3xl font-bold font-mono-data text-green-400 mb-2">
                  99.9%
                </div>
                <div className="text-sm text-gray-400">Uptime garantizado</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-[#0D0D0D]/50 border border-cyan/10">
                <div className="text-3xl font-bold font-mono-data text-electric mb-2">
                  50+
                </div>
                <div className="text-sm text-gray-400">Integraciones</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
