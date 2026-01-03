"use client";
import { useState, useEffect } from "react";

interface WelcomeExperienceProps {
  onComplete: () => void;
}

export function WelcomeExperience({ onComplete }: WelcomeExperienceProps) {
  const [currentScene, setCurrentScene] = useState(0);
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    if (currentScene >= 3) return;
    
    const timer = setTimeout(() => {
      setCurrentScene(currentScene + 1);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [currentScene]);
  
  const handleContinue = () => {
    setVisible(false);
    setTimeout(onComplete, 200);
  };

  const scenes = [
    {
      title: "Agentes que responden 24/7",
      subtitle: "Incluso cuando usted no está presente",
      icon: "💬"
    },
    {
      title: "Aumenta tus citas exponencialmente",
      subtitle: "Agenda automática sin intervención manual",
      icon: "📅"
    },
    {
      title: "Tu pipeline siempre actualizado",
      subtitle: "Seguimiento automático de cada oportunidad",
      icon: "📈"
    },
    {
      title: "Bienvenido",
      subtitle: "Tu equipo de ventas automatizado te espera",
      icon: null
    }
  ];

  const scene = scenes[currentScene];
  
  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0A] transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Progress indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2">
        {scenes.map((_, index) => (
          <div
            key={index}
            className="h-1 w-6 rounded-full transition-colors duration-300"
            style={{ 
              backgroundColor: index <= currentScene 
                ? "rgba(249, 115, 22, 0.8)" 
                : "rgba(255,255,255,0.2)"
            }}
          />
        ))}
      </div>
      
      {/* Scene content */}
      <div className="text-center px-6">
        {scene.icon ? (
          <div className="text-5xl mb-6">{scene.icon}</div>
        ) : (
          <img
            src="https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6823c9f977a9d4672be32ac7.png"
            alt="Bralto"
            className="w-16 h-16 object-contain mx-auto mb-6"
          />
        )}
        
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {scene.title}
        </h2>
        <p className="text-white/50 text-sm mb-8">
          {scene.subtitle}
        </p>
        
        {currentScene === 3 && (
          <button
            onClick={handleContinue}
            className="px-8 py-4 rounded-full font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 active:scale-95 transition-all"
          >
            Continuar →
          </button>
        )}
      </div>
    </div>
  );
}
