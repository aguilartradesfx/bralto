"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground } from "./AnimatedBackground";
import { AnimatedCTAButton } from "@/components/ui/AnimatedCTAButton";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

const rotatingWords = ["LEADS", "CITAS", "VENTAS"];

export function BraltoHeroSectionNoVideo() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "#0A0A0A" }}
    >
      <AnimatedBackground />
      <div className="absolute inset-0 bg-mesh-gradient z-[1]" />
      <div className="relative z-10 container mx-auto px-4 pt-28 pb-20">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Centered Top Content */}
          <div className="text-center space-y-8">
            {/* Brand badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-center"
            >
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "white",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: "linear-gradient(135deg, #F97316, #DB2777)",
                  }}
                />
                Bralto
              </span>
            </motion.div>
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15] px-4"
            >
              <span className="block text-white text-center">
                AUMENTE EXPONENCIALMENTE SUS{" "}
                <span className="inline-block relative" style={{ minWidth: "8ch" }}>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentWordIndex}
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: "0%", opacity: 1 }}
                      exit={{ y: "-100%", opacity: 0 }}
                      transition={{ 
                        duration: 0.5, 
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      className="inline-block bg-gradient-to-r from-orange-300 via-orange-500 to-amber-600 bg-clip-text text-transparent"
                    >
                      {rotatingWords[currentWordIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </span>
              <span className="block text-white text-center mt-2">
                EN PILOTO AUTOMÁTICO SIN EQUIPOS HUMANOS
              </span>
            </motion.h1>
            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-4xl mx-auto"
            >
              Automatice respuestas, seguimientos y cierres 24/7 con agentes de
              IA que califican, agendan y convierten prospectos por usted en
              WhatsApp, Web Chat y llamadas telefónicas, sin perder
              oportunidades, gestión de leads, pagos y membresías.
            </motion.p>
            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <AnimatedCTAButton
                href="https://checkout.bralto.io"
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
              >
                <span className="flex items-center gap-2">
                  Empezar Ahora
                  <ArrowRight className="w-5 h-5" />
                </span>
              </AnimatedCTAButton>
              <motion.a
                href="#como-funciona"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector("#como-funciona")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-6 py-3 text-gray-300 hover:text-white font-medium transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Ver Cómo Funciona
                <motion.span
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ↓
                </motion.span>
              </motion.a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
