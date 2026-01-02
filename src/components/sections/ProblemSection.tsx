'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

export function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const problems = [
    {
      icon: Clock,
      metric: '<30seg',
      label: 'Tiempo de respuesta con IA',
      description: 'Respuestas instantáneas 24/7 sin esperas',
      color: 'from-white/5 to-amber-500/20',
      iconColor: 'text-white'
    },
    {
      icon: TrendingUp,
      metric: '33%',
      label: 'Más leads convertidos',
      description: 'Capturamos leads mientras tu competencia duerme',
      color: 'from-electric/20 to-violet/20',
      iconColor: 'text-electric'
    },
    {
      icon: CheckCircle,
      metric: '+47%',
      label: 'Meetings confirmadas',
      description: 'Oportunidades capturadas y convertidas automáticamente',
      color: 'from-violet/20 to-amber-500/20',
      iconColor: 'text-violet'
    }
  ];

  return (
    <section ref={ref} className="relative py-32 bg-[#0D0D0D] overflow-hidden">
      <div className="absolute inset-0 bg-noise" />
      
      {/* Gradient accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-20"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-white/3 border border-white/10 text-white text-sm font-medium mb-6">
            La Solución
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Cada segundo cuenta para{' '}
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              capturar más leads
            </span>
          </h2>
          <p className="text-xl text-gray-400">
            Con IA disponible 24/7, nunca pierdes una oportunidad.
            Mientras tu competencia duerme, tú estás cerrando deals.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              <div className="group relative h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                
                <div className="relative h-full p-8 rounded-2xl bg-gradient-to-br from-[#0D0D0D]/80 to-[#0D0D0D]/80 border border-red-500/20 backdrop-blur-sm hover:border-red-500/40 transition-all duration-500">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${problem.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <problem.icon className={`w-8 h-8 ${problem.iconColor}`} />
                  </div>

                  <div className="mb-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ duration: 0.8, delay: index * 0.2 + 0.4 }}
                      className="font-mono-data text-5xl font-bold text-white mb-2"
                    >
                      {problem.metric}
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">
                      {problem.label}
                    </h3>
                  </div>

                  <p className="text-gray-400 leading-relaxed">
                    {problem.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-gray-300">
              <span className="font-semibold text-white">La realidad:</span> Un cliente
              esperando más de 5 minutos tiene 10x más probabilidad de abandonar
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
