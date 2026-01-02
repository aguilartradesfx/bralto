'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { MessageSquare, User, Pause, Play, RotateCcw, CheckCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  content: string;
  delay: number;
}

export function ConversationSimulation() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);

  const conversationRef = useRef<Message[]>([
    { role: 'user', content: 'Hola, quisiera información sobre sus planes empresariales', delay: 0 },
    { role: 'ai', content: '¡Hola! Encantado de ayudarte. ¿Cuántos agentes necesitas para tu equipo?', delay: 1000 },
    { role: 'user', content: 'Somos un equipo de ventas de 15 personas', delay: 2000 },
    { role: 'ai', content: 'Perfecto. Para 15 agentes recomiendo nuestro plan Enterprise. ¿Cuál es tu principal desafío actual con leads?', delay: 1000 },
    { role: 'user', content: 'Perdemos muchos leads porque no respondemos lo suficientemente rápido', delay: 2000 },
    { role: 'ai', content: 'Entiendo. Con nuestra IA, el tiempo de respuesta baja a menos de 5 segundos. ¿Te gustaría ver una demo personalizada?', delay: 1000 },
    { role: 'user', content: 'Sí, me interesa. ¿Cuándo podríamos agendar?', delay: 1500 },
    { role: 'ai', content: '¡Excelente! Tengo disponibilidad mañana a las 10:00 AM o 3:00 PM. ¿Cuál prefieres?', delay: 1000 },
    { role: 'user', content: 'Mañana a las 10:00 AM está perfecto', delay: 1500 },
    { role: 'ai', content: '✓ Reunión confirmada para mañana 10:00 AM. Te envié email con el link de Zoom. ¡Nos vemos!', delay: 1000 }
  ]);

  const conversation = conversationRef.current;

  useEffect(() => {
    if (!isInView) {
      setIsPlaying(false);
      return;
    }

    if (isPlaying && currentMessageIndex < conversation.length) {
      const currentMessage = conversation[currentMessageIndex];
      const timer = setTimeout(() => {
        setDisplayedMessages(prev => [...prev, currentMessage]);
        setCurrentMessageIndex(prev => prev + 1);
      }, currentMessage.delay);

      return () => clearTimeout(timer);
    } else if (currentMessageIndex >= conversation.length) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentMessageIndex, isInView, conversation]);

  const handlePlayPause = () => {
    if (currentMessageIndex >= conversation.length) {
      // Reset
      setDisplayedMessages([]);
      setCurrentMessageIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    setDisplayedMessages([]);
    setCurrentMessageIndex(0);
    setIsPlaying(true);
  };

  // Auto-play when in view
  useEffect(() => {
    if (isInView && displayedMessages.length === 0) {
      setIsPlaying(true);
    }
  }, [isInView, displayedMessages.length]);

  return (
    <section ref={ref} className="relative py-32 bg-[#0D0D0D] overflow-hidden">
      <div className="absolute inset-0 bg-noise" />
      
      {/* Gradient accents */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-white/3 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan/5 rounded-full blur-[120px]" />

      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-white/3 border border-white/10 text-white text-sm font-medium mb-6">
            IA en Acción
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Mira cómo la IA{' '}
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              convierte una consulta
            </span>
            {' '}en meeting
          </h2>
          <p className="text-xl text-gray-400">
            Calificación inteligente, preguntas contextuales y cierre automático
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Chat widget mockup */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#0D0D0D]/90 to-black/90 backdrop-blur-xl shadow-2xl">
              {/* Widget header */}
              <div className="flex items-center justify-between p-4 bg-[#0D0D0D]/80 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Agente IA - Ventas</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full " />
                      <span className="text-xs text-green-400">Online 24/7</span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlayPause}
                    className="p-2 rounded-lg bg-white/3 hover:bg-white/5 border border-white/10 transition-colors"
                    title={isPlaying ? 'Pausar' : 'Reproducir'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 text-white" />
                    ) : (
                      <Play className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <button
                    onClick={handleRestart}
                    className="p-2 rounded-lg bg-cyan/10 hover:bg-cyan/20 border border-cyan/20 transition-colors"
                    title="Reiniciar"
                  >
                    <RotateCcw className="w-4 h-4 text-electric" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="p-6 space-y-4 min-h-[500px] max-h-[600px] overflow-y-auto">
                {displayedMessages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-br from-gray-600 to-gray-700' 
                          : 'bg-gradient-to-br from-orange-400 to-amber-500'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-black" />
                        )}
                      </div>

                      {/* Message bubble */}
                      <div className={`px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-white'
                          : 'bg-gradient-to-br from-white/5 to-amber-500/20 text-white border border-white/10'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {isPlaying && currentMessageIndex < conversation.length && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/3 border border-white/10">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-white/5 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-white/5 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-white/5 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Status bar */}
              {currentMessageIndex >= conversation.length && displayedMessages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-500/10 border-t border-green-500/20"
                >
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Lead calificado → Meeting agendado → CRM actualizado
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Stats below chat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-8 grid grid-cols-3 gap-4"
            >
              <div className="text-center p-4 rounded-xl bg-[#0D0D0D]/50 border border-white/8">
                <div className="text-2xl font-bold font-mono-data text-white mb-1">38s</div>
                <div className="text-xs text-gray-400">Duración total</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-[#0D0D0D]/50 border border-green-400/10">
                <div className="text-2xl font-bold font-mono-data text-green-400 mb-1">100%</div>
                <div className="text-xs text-gray-400">Calificado</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-[#0D0D0D]/50 border border-cyan/10">
                <div className="text-2xl font-bold font-mono-data text-electric mb-1">1</div>
                <div className="text-xs text-gray-400">Meeting agendado</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
