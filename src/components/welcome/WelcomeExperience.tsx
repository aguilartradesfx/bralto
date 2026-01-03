"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Detect if user prefers reduced motion or is on mobile
const useReducedMotion = () => {
  const [reduceMotion, setReduceMotion] = useState(false);
  
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduceMotion(isMobile || prefersReducedMotion);
  }, []);
  
  return reduceMotion;
};

// Scene 1: Chat bubbles appearing
const ChatScene = () => {
  return (
  <div className="flex flex-col items-center justify-center gap-6 w-full max-w-md">
    {/* Header text */}
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center mb-4"
    >
      <motion.h2 
        className="text-2xl md:text-3xl font-bold text-white mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Agentes que responden 24/7
      </motion.h2>
      <motion.p
        className="text-white/50 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        Incluso cuando usted no está presente
      </motion.p>
    </motion.div>
    
    {/* Chat bubbles */}
    <div className="flex flex-col gap-4 w-full">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="self-start bg-[#1a1a2e] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]"
      >
        <p className="text-white/80 text-sm">Hola, me interesa saber más sobre sus servicios...</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.8, duration: 0.5 }}
        className="self-end bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%]"
      >
        <p className="text-orange-300 text-sm">¡Perfecto! Déjame agendar una reunión con nuestro equipo...</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.6, duration: 0.4 }}
        className="flex items-center gap-2 text-white/50 text-xs"
      >
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse [animation-delay:200ms]" />
          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse [animation-delay:400ms]" />
        </div>
        <span>Bralto está escribiendo...</span>
      </motion.div>
    </div>
  </div>
  );
};

// Scene 2: Calendar booking
const CalendarScene = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full max-w-sm">
      {/* Header text */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-2"
      >
        <motion.h2 
          className="text-2xl md:text-3xl font-bold text-white mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Aumenta tus citas exponencialmente
        </motion.h2>
        <motion.p
          className="text-white/50 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Agenda automática sin intervención manual
        </motion.p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/60 text-sm">Marzo 2025</span>
          <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-white/40 mb-2">
          {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {Array.from({ length: 28 }, (_, i) => (
            <div
              key={i}
              className={`p-1.5 rounded ${
                i === 14
                  ? "bg-orange-500 text-white font-bold"
                  : "text-white/60"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 0.5 }}
        className="flex items-center gap-2 text-orange-400 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Reunión agendada: 15 de Marzo, 10:00 AM</span>
      </motion.div>
    </div>
  );
};

// Scene 3: Pipeline updating
const PipelineScene = () => {
  const stages = ["Nuevo Lead", "Calificado", "Propuesta", "Negociación", "Cerrado"];
  
  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full max-w-lg">
      {/* Header text */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-2"
      >
        <motion.h2 
          className="text-2xl md:text-3xl font-bold text-white mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Tu pipeline siempre actualizado
        </motion.h2>
        <motion.p
          className="text-white/50 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Seguimiento automático de cada oportunidad
        </motion.p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="flex items-center gap-1 w-full overflow-hidden"
      >
        {stages.map((stage, index) => (
          <motion.div
            key={stage}
            initial={{ opacity: 0.3, scale: 0.95 }}
            animate={{ 
              opacity: index <= 3 ? 1 : 0.3, 
              scale: index === 3 ? 1.05 : 1,
              backgroundColor: index <= 3 ? "rgba(249, 115, 22, 0.15)" : "rgba(255,255,255,0.05)"
            }}
            transition={{ delay: 1.2 + index * 0.4, duration: 0.5 }}
            className="flex-1 py-3 px-2 rounded border border-white/10 text-center"
          >
            <span className={`text-xs ${index <= 3 ? "text-orange-400" : "text-white/40"}`}>
              {stage}
            </span>
          </motion.div>
        ))}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 3, duration: 0.5 }}
        className="flex items-center gap-3 bg-[#1a1a2e] border border-orange-500/30 rounded-lg px-4 py-3"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
          JD
        </div>
        <div className="text-left">
          <p className="text-white text-sm font-medium">Juan Díaz</p>
          <p className="text-orange-400/70 text-xs">Movido a Negociación → Valor: $15,000</p>
        </div>
      </motion.div>
    </div>
  );
};

// Scene 4: Welcome with Bralto eye and CTA button
interface WelcomeSceneProps {
  onContinue: () => void;
}

const WelcomeScene = ({ onContinue }: WelcomeSceneProps) => (
  <div className="flex flex-col items-center justify-center gap-8">
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <img
        src="https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6823c9f977a9d4672be32ac7.png"
        alt="Bralto"
        className="w-20 h-20 object-contain"
        style={{ 
          filter: "drop-shadow(0 0 30px rgba(249,115,22,0.4))"
        }}
      />
    </motion.div>
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="text-3xl md:text-4xl font-bold text-white text-center"
    >
      Bienvenido
    </motion.h1>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7, duration: 0.5 }}
      className="text-white/60 text-center text-sm"
    >
      Tu equipo de ventas automatizado te espera
    </motion.p>
    
    {/* Animated CTA Button */}
    <motion.button
      onClick={onContinue}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative mt-4 px-8 py-4 rounded-full font-semibold text-white overflow-hidden group"
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "linear-gradient(135deg, #F97316 0%, #EA580C 50%, #C2410C 100%)",
        }}
      />
      
      {/* Glowing border effect */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: "0 0 20px rgba(249, 115, 22, 0.5), 0 0 40px rgba(249, 115, 22, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)"
        }}
      />
      
      {/* Shimmer effect - CSS only */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
      >
        <div 
          className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
          }}
        />
      </div>
      
      {/* Button text */}
      <span className="relative z-10 flex items-center gap-2 text-lg">
        Continuar
        <span className="animate-[bounceX_1s_ease-in-out_infinite]">
          →
        </span>
      </span>
    </motion.button>
  </div>
);

interface WelcomeExperienceProps {
  onComplete: () => void;
}

export function WelcomeExperience({ onComplete }: WelcomeExperienceProps) {
  const [currentScene, setCurrentScene] = useState(0);
  const [waitingForClick, setWaitingForClick] = useState(false);
  const reduceMotion = useReducedMotion();
  
  useEffect(() => {
    // Don't auto-advance on the last scene (welcome)
    if (currentScene === 3) {
      setWaitingForClick(true);
      return;
    }
    
    // Faster timings on mobile for less wait time
    const timings = reduceMotion ? [2500, 2200, 3000] : [3500, 3200, 4000];
    const timer = setTimeout(() => {
      setCurrentScene(currentScene + 1);
    }, timings[currentScene]);
    
    return () => clearTimeout(timer);
  }, [currentScene, reduceMotion]);
  
  const handleContinue = () => {
    onComplete();
  };
  
  const scenes = [
    { key: "chat", component: <ChatScene /> },
    { key: "calendar", component: <CalendarScene /> },
    { key: "pipeline", component: <PipelineScene /> },
    { key: "welcome", component: <WelcomeScene onContinue={handleContinue} /> }
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "#0A0A0A" }}
    >
      {/* Simplified background for mobile - static gradient, animated only on desktop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {reduceMotion ? (
          /* Static gradient for mobile - no animations */
          <>
            <div 
              className="absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full"
              style={{ 
                background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)',
                filter: 'blur(60px)',
                top: '10%',
                left: '5%',
                willChange: 'auto',
              }}
            />
            <div 
              className="absolute w-[250px] h-[250px] md:w-[500px] md:h-[500px] rounded-full"
              style={{ 
                background: 'radial-gradient(circle, rgba(219, 39, 119, 0.12) 0%, transparent 70%)',
                filter: 'blur(60px)',
                top: '20%',
                right: '0%',
                willChange: 'auto',
              }}
            />
            <div 
              className="absolute w-[280px] h-[280px] md:w-[550px] md:h-[550px] rounded-full"
              style={{ 
                background: 'radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, transparent 70%)',
                filter: 'blur(60px)',
                bottom: '10%',
                right: '10%',
                willChange: 'auto',
              }}
            />
          </>
        ) : (
          /* Full animations for desktop */
          <>
            {/* Large Orange Glow - Top Left */}
            <motion.div 
              className="absolute w-[600px] h-[600px] rounded-full"
              style={{ 
                background: 'radial-gradient(circle, rgba(249, 115, 22, 0.18) 0%, rgba(249, 115, 22, 0.06) 40%, transparent 70%)',
                filter: 'blur(80px)',
                top: '5%',
                left: '10%',
                willChange: 'transform',
              }}
              animate={{
                x: [0, 150, -100, 80, 0],
                y: [0, -80, 100, -60, 0],
                scale: [1, 1.2, 0.9, 1.1, 1],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Fuchsia Glow - Top Right */}
            <motion.div 
              className="absolute w-[500px] h-[500px] rounded-full"
              style={{ 
                background: 'radial-gradient(circle, rgba(219, 39, 119, 0.14) 0%, rgba(219, 39, 119, 0.05) 40%, transparent 70%)',
                filter: 'blur(80px)',
                top: '15%',
                right: '5%',
                willChange: 'transform',
              }}
              animate={{
                x: [0, -120, 80, -60, 0],
                y: [0, 100, -80, 60, 0],
                scale: [1, 0.9, 1.15, 0.95, 1],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Orange Glow - Center */}
            <motion.div 
              className="absolute w-[700px] h-[700px] rounded-full"
              style={{ 
                background: 'radial-gradient(circle, rgba(251, 146, 60, 0.12) 0%, rgba(234, 88, 12, 0.05) 40%, transparent 70%)',
                filter: 'blur(100px)',
                top: '30%',
                left: '25%',
                willChange: 'transform',
              }}
              animate={{
                x: [0, -80, 120, -100, 0],
                y: [0, 60, -100, 80, 0],
                scale: [1, 1.1, 0.85, 1.05, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Fuchsia Glow - Bottom Left */}
            <motion.div 
              className="absolute w-[450px] h-[450px] rounded-full"
              style={{ 
                background: 'radial-gradient(circle, rgba(236, 72, 153, 0.14) 0%, rgba(219, 39, 119, 0.05) 40%, transparent 70%)',
                filter: 'blur(70px)',
                bottom: '10%',
                left: '5%',
                willChange: 'transform',
              }}
              animate={{
                x: [0, 100, -60, 80, 0],
                y: [0, -100, 60, -40, 0],
                scale: [1, 1.15, 0.9, 1.1, 1],
              }}
              transition={{
                duration: 16,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Orange Glow - Bottom Right */}
            <motion.div 
              className="absolute w-[550px] h-[550px] rounded-full"
              style={{ 
                background: 'radial-gradient(circle, rgba(249, 115, 22, 0.14) 0%, rgba(217, 119, 6, 0.05) 40%, transparent 70%)',
                filter: 'blur(90px)',
                bottom: '15%',
                right: '10%',
                willChange: 'transform',
              }}
              animate={{
                x: [0, -100, 60, -80, 0],
                y: [0, -60, 100, -80, 0],
                scale: [1, 1.1, 0.9, 1.05, 1],
              }}
              transition={{
                duration: 17,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </>
        )}
      </div>
      
      {/* Progress indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2">
        {scenes.map((_, index) => (
          <div
            key={index}
            className="h-1 rounded-full transition-colors duration-300"
            style={{ 
              width: 24,
              backgroundColor: index <= currentScene 
                ? "rgba(249, 115, 22, 0.8)" 
                : "rgba(255,255,255,0.2)"
            }}
          />
        ))}
      </div>
      
      {/* Scene container */}
      <div className="relative w-full max-w-2xl px-6 py-12 flex items-center justify-center min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={scenes[currentScene].key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full flex items-center justify-center"
          >
            {scenes[currentScene].component}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
