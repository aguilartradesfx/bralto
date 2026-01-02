'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Mail, MessageSquare, Phone, Linkedin, CheckCircle } from 'lucide-react';

export function SolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [activeChannel, setActiveChannel] = useState(0);

  const channels = [
    { icon: Mail, label: 'Email', count: 24, color: 'text-white' },
    { icon: MessageSquare, label: 'Chat', count: 12, color: 'text-electric' },
    { icon: Phone, label: 'WhatsApp', count: 8, color: 'text-green-400' },
    { icon: Linkedin, label: 'LinkedIn', count: 6, color: 'text-blue-400' }
  ];

  const messages = [
    { channel: 'Email', from: 'Juan García', message: '¿Cuánto cuesta?', time: 'Ahora', status: 'processing' },
    { channel: 'Chat', from: 'María López', message: 'Necesito una demo', time: '2 min', status: 'responded' },
    { channel: 'WhatsApp', from: 'Carlos Ruiz', message: 'Información sobre planes', time: '5 min', status: 'responded' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveChannel((prev) => (prev + 1) % channels.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [channels.length]);

  return (
    <section ref={ref} className="relative py-32 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-noise" />
      
      {/* Gradient accents */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-white/3 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-cyan/10 rounded-full blur-[120px]" />

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
            Un inbox unificado con{' '}
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              IA que nunca duerme
            </span>
          </h2>
          <p className="text-xl text-gray-400">
            Todos tus canales en un solo lugar. IA que responde, califica y
            agenda automáticamente. 24/7, en tu idioma.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Dashboard mockup */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#0D0D0D]/90 to-[#0D0D0D]/90 backdrop-blur-xl shadow-2xl">
              {/* Dashboard header */}
              <div className="border-b border-white/10 p-6 bg-[#0D0D0D]/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Centro de Comando IA</h3>
                    <p className="text-sm text-gray-400">Todos los canales, una plataforma</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="w-2 h-2 bg-green-500 rounded-full " />
                    <span className="text-green-400 text-sm font-medium">50 agentes activos</span>
                  </div>
                </div>
              </div>

              {/* Channel tabs */}
              <div className="border-b border-white/8 bg-[#0D0D0D]/30 p-4">
                <div className="flex gap-2">
                  {channels.map((channel, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setActiveChannel(index)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                        activeChannel === index
                          ? 'bg-white/3 border border-white/10'
                          : 'bg-[#0D0D0D]/50 border border-transparent hover:border-cyan/10'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <channel.icon className={`w-5 h-5 ${activeChannel === index ? channel.color : 'text-gray-500'}`} />
                      <span className={`font-medium ${activeChannel === index ? 'text-white' : 'text-gray-400'}`}>
                        {channel.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono-data ${
                        activeChannel === index 
                          ? 'bg-white/5 text-white' 
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        {channel.count}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Messages list */}
              <div className="p-6 space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-transparent rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                    
                    <div className="relative flex items-start gap-4 p-4 rounded-xl bg-[#0D0D0D]/50 border border-white/8 hover:border-cyan/30 transition-all duration-300">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/5 to-amber-500/20 flex items-center justify-center">
                        <span className="text-lg font-semibold text-white">
                          {message.from.charAt(0)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-white">{message.from}</h4>
                          <span className="text-xs text-gray-500 font-mono-data">{message.time}</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{message.message}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded bg-white/3 text-white border border-white/10">
                            {message.channel}
                          </span>
                          {message.status === 'responded' && (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              IA respondió
                            </span>
                          )}
                          {message.status === 'processing' && (
                            <span className="flex items-center gap-1 text-xs text-yellow-400">
                              <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                              Procesando...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Glow effect */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
              </div>
            </div>

            {/* Floating stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="absolute -left-4 top-1/4 hidden lg:block"
            >
              <div className="p-4 rounded-xl bg-[#0D0D0D]/90 border border-white/10 backdrop-blur-xl shadow-xl">
                <div className="text-3xl font-bold font-mono-data text-white mb-1">
                  &lt;5s
                </div>
                <div className="text-xs text-gray-400">Tiempo respuesta</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 1 }}
              className="absolute -right-4 bottom-1/4 hidden lg:block"
            >
              <div className="p-4 rounded-xl bg-[#0D0D0D]/90 border border-cyan/30 backdrop-blur-xl shadow-xl">
                <div className="text-3xl font-bold font-mono-data text-electric mb-1">
                  98%
                </div>
                <div className="text-xs text-gray-400">Satisfacción</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
