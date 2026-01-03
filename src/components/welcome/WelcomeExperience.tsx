"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Reusable button component for scenes
const NextButton = ({ onClick, label = "Siguiente →" }: { onClick: () => void; label?: string }) => (
  <button
    onClick={onClick}
    className="mt-4 px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all"
  >
    {label}
  </button>
);

// Common card styles
const cardStyle = "bg-[#1a1a2e] border border-white/10 rounded-xl";
const headerStyle = "text-center mb-2";
const titleStyle = "text-2xl md:text-3xl font-bold text-white mb-2";
const subtitleStyle = "text-white/50 text-sm";

// Scene 1: Chat bubbles appearing
interface ChatSceneProps {
  onNext: () => void;
}

const ChatScene = ({ onNext }: ChatSceneProps) => {
  return (
  <div className="flex flex-col items-center justify-center gap-6 w-full max-w-md">
    {/* Header text */}
    <div className="text-center mb-4">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
        Agentes que responden 24/7
      </h2>
      <p className="text-white/50 text-sm">
        Incluso cuando usted no está presente
      </p>
    </div>
    
    {/* Chat bubbles */}
    <div className="flex flex-col gap-4 w-full">
      <div className="self-start bg-[#1a1a2e] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]">
        <p className="text-white/80 text-sm">Hola, me interesa saber más sobre sus servicios...</p>
      </div>
      <div className="self-end bg-orange-500/10 border border-orange-500/30 rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%]">
        <p className="text-orange-300 text-sm">¡Perfecto! Déjame agendar una reunión con nuestro equipo...</p>
      </div>
    </div>
    
    <NextButton onClick={onNext} />
  </div>
  );
};

// Scene 2: Calendar booking
interface CalendarSceneProps {
  onNext: () => void;
}

const CalendarScene = ({ onNext }: CalendarSceneProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full max-w-sm">
      {/* Header text */}
      <div className="text-center mb-2">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Aumenta tus citas exponencialmente
        </h2>
        <p className="text-white/50 text-sm">
          Agenda automática sin intervención manual
        </p>
      </div>
      
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/60 text-sm">Marzo 2025</span>
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
      </div>
      <div className="flex items-center gap-2 text-orange-400 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Reunión agendada: 15 de Marzo, 10:00 AM</span>
      </div>
      
      <NextButton onClick={onNext} />
    </div>
  );
};

// Scene 3: Pipeline updating
interface PipelineSceneProps {
  onNext: () => void;
}

const PipelineScene = ({ onNext }: PipelineSceneProps) => {
  const stages = ["Nuevo Lead", "Calificado", "Propuesta", "Negociación", "Cerrado"];
  
  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full max-w-lg">
      {/* Header text */}
      <div className="text-center mb-2">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Tu pipeline siempre actualizado
        </h2>
        <p className="text-white/50 text-sm">
          Seguimiento automático de cada oportunidad
        </p>
      </div>
      
      <div className="flex items-center gap-1 w-full overflow-hidden">
        {stages.map((stage, index) => (
          <div
            key={stage}
            className={`flex-1 py-3 px-2 rounded border border-white/10 text-center ${
              index <= 3 ? "bg-orange-500/10" : "bg-white/5"
            }`}
          >
            <span className={`text-xs ${index <= 3 ? "text-orange-400" : "text-white/40"}`}>
              {stage}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 bg-[#1a1a2e] border border-orange-500/30 rounded-lg px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
          JD
        </div>
        <div className="text-left">
          <p className="text-white text-sm font-medium">Juan Díaz</p>
          <p className="text-orange-400/70 text-xs">Movido a Negociación → Valor: $15,000</p>
        </div>
      </div>
      
      <NextButton onClick={onNext} />
    </div>
  );
};

// Scene 4: Platforms Bralto replaces
interface PlatformsSceneProps {
  onNext: () => void;
}

const PlatformsScene = ({ onNext }: PlatformsSceneProps) => {
  const leftPlatforms = [
    "Calendly", "Intercom", "HubSpot", "Zendesk", "Drift", "ManyChat"
  ];
  
  const rightPlatforms = [
    "Salesforce", "ActiveCampaign", "Zapier", "Mailchimp", "Stripe", "Twilio"
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full max-w-2xl px-4">
      {/* Header text */}
      <div className="text-center mb-2">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Reemplaza múltiples herramientas
        </h2>
        <p className="text-white/50 text-sm">
          Todo lo que necesitas en una sola plataforma
        </p>
      </div>

      {/* Platforms list - 2 columns */}
      <div className="w-full grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          {leftPlatforms.map((platform) => (
            <div
              key={platform}
              className="bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between hover:border-red-400/30 hover:shadow-[0_0_15px_rgba(248,113,113,0.15)] transition-all duration-300 group"
            >
              <span className="text-white/80 text-sm font-medium">{platform}</span>
              <span className="text-red-400 text-xs group-hover:scale-110 transition-transform">✕</span>
            </div>
          ))}
        </div>
        
        {/* Right column */}
        <div className="space-y-2">
          {rightPlatforms.map((platform) => (
            <div
              key={platform}
              className="bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between hover:border-red-400/30 hover:shadow-[0_0_15px_rgba(248,113,113,0.15)] transition-all duration-300 group"
            >
              <span className="text-white/80 text-sm font-medium">{platform}</span>
              <span className="text-red-400 text-xs group-hover:scale-110 transition-transform">✕</span>
            </div>
          ))}
        </div>
      </div>

      {/* Arrow down to Bralto */}
      <div className="flex flex-col items-center gap-2">
        <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        
        <div className="bg-orange-500/10 border-2 border-orange-500/50 rounded-lg px-6 py-4 flex items-center gap-3 hover:border-orange-500/70 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all duration-300">
          <img
            src="https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6823c9f977a9d4672be32ac7.png"
            alt="Bralto"
            className="w-8 h-8 object-contain"
          />
          <span className="text-orange-300 font-bold text-lg">Bralto</span>
          <span className="text-green-400 text-xs">✓</span>
        </div>
      </div>

      <NextButton onClick={onNext} />
    </div>
  );
};

// Scene 5: Welcome with Bralto eye and CTA button
interface WelcomeSceneProps {
  onContinue: () => void;
}

const WelcomeScene = ({ onContinue }: WelcomeSceneProps) => (
  <div className="flex flex-col items-center justify-center gap-8">
    <img
      src="https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6823c9f977a9d4672be32ac7.png"
      alt="Bralto"
      className="w-20 h-20 object-contain"
    />
    <h1 className="text-3xl md:text-4xl font-bold text-white text-center">
      Bienvenido
    </h1>
    <p className="text-white/60 text-center text-sm">
      Tu equipo de ventas automatizado te espera
    </p>
    <NextButton onClick={onContinue} label="Continuar →" />
  </div>
);

interface WelcomeExperienceProps {
  onComplete: () => void;
}

export function WelcomeExperience({ onComplete }: WelcomeExperienceProps) {
  const [currentScene, setCurrentScene] = useState(0);
  
  const handleNext = () => {
    if (currentScene < 4) {
      setCurrentScene(currentScene + 1);
    } else {
      onComplete();
    }
  };
  
  const scenes = [
    { key: "chat", component: <ChatScene onNext={handleNext} /> },
    { key: "calendar", component: <CalendarScene onNext={handleNext} /> },
    { key: "pipeline", component: <PipelineScene onNext={handleNext} /> },
    { key: "platforms", component: <PlatformsScene onNext={handleNext} /> },
    { key: "welcome", component: <WelcomeScene onContinue={onComplete} /> }
  ];
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0A]">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full opacity-30"
          style={{ 
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.2) 0%, transparent 70%)',
            filter: 'blur(80px)',
            top: '10%',
            left: '5%',
            animation: 'floatSlow 20s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute w-[250px] h-[250px] md:w-[400px] md:h-[400px] rounded-full opacity-20"
          style={{ 
            background: 'radial-gradient(circle, rgba(219, 39, 119, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
            bottom: '15%',
            right: '5%',
            animation: 'floatSlow 25s ease-in-out infinite reverse',
          }}
        />
        <div 
          className="absolute w-[200px] h-[200px] md:w-[350px] md:h-[350px] rounded-full opacity-15"
          style={{ 
            background: 'radial-gradient(circle, rgba(0, 217, 255, 0.15) 0%, transparent 70%)',
            filter: 'blur(70px)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'floatSlow 18s ease-in-out infinite',
          }}
        />
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatSlow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 30px) scale(0.95); }
        }
      `}} />
      
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full flex items-center justify-center"
          >
            {scenes[currentScene].component}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
