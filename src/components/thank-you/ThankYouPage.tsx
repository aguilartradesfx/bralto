"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { CheckCircle, Star, Mail, MapPin, Sparkles } from "lucide-react";
import { useRef, useMemo } from "react";

// Floating particles component
function FloatingParticles() {
  const particles = useMemo(() => 
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
    })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: particle.id % 3 === 0 
              ? 'rgba(249, 115, 22, 0.6)' 
              : particle.id % 3 === 1
              ? 'rgba(219, 39, 119, 0.6)'
              : 'rgba(0, 217, 255, 0.4)',
            boxShadow: `0 0 ${particle.size * 3}px currentColor`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Hero Confirmation Section
function HeroConfirmation() {
  return (
    <section className="relative min-h-[50vh] flex items-center justify-center bg-[#0D0D0D] overflow-hidden py-12">
      {/* Animated Background - same as hero */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large Orange Glow - Top Left */}
        <motion.div 
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{ 
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.05) 40%, transparent 70%)',
            filter: 'blur(80px)',
            top: '5%',
            left: '10%',
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
            background: 'radial-gradient(circle, rgba(219, 39, 119, 0.12) 0%, rgba(219, 39, 119, 0.04) 40%, transparent 70%)',
            filter: 'blur(80px)',
            top: '15%',
            right: '5%',
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
            background: 'radial-gradient(circle, rgba(251, 146, 60, 0.1) 0%, rgba(234, 88, 12, 0.04) 40%, transparent 70%)',
            filter: 'blur(100px)',
            top: '30%',
            left: '25%',
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
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, rgba(219, 39, 119, 0.04) 40%, transparent 70%)',
            filter: 'blur(70px)',
            bottom: '10%',
            left: '5%',
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
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.12) 0%, rgba(217, 119, 6, 0.04) 40%, transparent 70%)',
            filter: 'blur(90px)',
            bottom: '5%',
            right: '15%',
          }}
          animate={{
            x: [0, -100, 60, -80, 0],
            y: [0, -60, 100, -80, 0],
            scale: [1, 0.95, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Small Fuchsia accent - floating */}
        <motion.div 
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{ 
            background: 'radial-gradient(circle, rgba(219, 39, 119, 0.15) 0%, transparent 60%)',
            filter: 'blur(60px)',
            top: '50%',
            right: '30%',
          }}
          animate={{
            x: [0, 80, -120, 100, 0],
            y: [0, -80, 60, -100, 0],
            scale: [1, 1.3, 0.8, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Floating Particles */}
      <FloatingParticles />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ 
            duration: 0.8, 
            type: "spring", 
            bounce: 0.5 
          }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm font-medium">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Mail className="w-4 h-4" />
            </motion.div>
            SE ENVIÓ UN CORREO CON SU ACCESO
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.8, 
            delay: 0.2,
            type: "spring",
            bounce: 0.4
          }}
          className="text-5xl md:text-7xl font-bold text-white mb-6 font-['Space_Grotesk']"
        >
          <motion.span
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundImage: "linear-gradient(90deg, #FFFFFF 0%, #F97316 25%, #DB2777 50%, #00D9FF 75%, #FFFFFF 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ¡Todo listo!
          </motion.span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-300 mb-8 font-['Manrope']"
        >
          Su camino hacia un sistema digital escalable está oficialmente en marcha.
        </motion.p>

        {/* Supporting text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-lg text-gray-400 max-w-2xl mx-auto font-['Manrope'] leading-relaxed"
        >
          Lo que está por aprender y construir aquí no lo va a encontrar en ninguna otra
          plataforma, agencia o curso. Este es un programa diseñado para que usted deje
          de depender del azar y empiece a operar con estructura real.
        </motion.p>

        {/* Success icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.6, 
            delay: 0.8,
            type: "spring",
            bounce: 0.6
          }}
          className="mt-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#F97316]/10 border border-[#F97316]/30 shadow-[0_0_30px_rgba(249,115,22,0.4)]">
            <CheckCircle className="w-10 h-10 text-[#F97316]" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Transformation Card Section
function TransformationCard() {
  const bulletPoints = [
    "Convertir ideas en flujos automáticos que trabajan día y noche.",
    "Usar IA para crear funnels, emails y procesos listos para escalar.",
    "Crear AI Agents que responden, califican y preparan clientes.",
    "Integrar herramientas sin frustración ni laberintos técnicos.",
    "Diseñar un sistema que crece con su negocio, no que lo detiene."
  ];

  return (
    <section className="relative py-12 bg-[#0E0E0E] overflow-hidden">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-20 left-10 w-96 h-96 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(219, 39, 119, 0.15), transparent 70%)",
          filter: "blur(80px)"
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 20 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring" }}
          className="relative"
        >
          {/* Card glow effect */}
          <motion.div 
            className="absolute -inset-1 bg-gradient-to-br from-[#F97316]/20 to-[#DB2777]/20 rounded-3xl blur-xl opacity-50"
            animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Card */}
          <div className="relative p-8 md:p-12 rounded-2xl bg-gradient-to-br from-[#1A1A1A]/90 to-[#0E0E0E]/90 border border-white/10 backdrop-blur-sm">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 font-['Space_Grotesk']">
              Cuando usted decide tomar el control, todo empieza a avanzar.
            </h2>
            
            <p className="text-gray-300 mb-6 font-['Manrope']">
              En este proceso usted va a entender por qué algunos negocios crecen cada mes
              mientras otros se quedan estancados a pesar del esfuerzo.
            </p>
            
            <p className="text-[#F97316] font-semibold mb-6 font-['Manrope']">
              Y eso es exactamente lo que va a obtener aquí:
            </p>
            
            <ul className="space-y-4">
              {bulletPoints.map((point, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.15,
                    type: "spring",
                    bounce: 0.3
                  }}
                  whileHover={{ x: 10 }}
                  className="flex items-start gap-3 text-gray-200 font-['Manrope']"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 360]
                    }}
                    transition={{
                      duration: 2,
                      delay: index * 0.2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  >
                    <CheckCircle className="w-5 h-5 text-[#F97316] mt-0.5 flex-shrink-0" />
                  </motion.div>
                  <span>{point}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Primary CTA Section
function PrimaryCTA() {
  return (
    <section className="relative py-8 bg-[#0E0E0E] overflow-hidden">
      {/* Sparkles around button */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-[#F97316]"
          style={{
            left: `${50 + Math.cos((i / 8) * Math.PI * 2) * 25}%`,
            top: `${50 + Math.sin((i / 8) * Math.PI * 2) * 25}%`,
          }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.25,
            ease: "easeInOut"
          }}
        />
      ))}
      
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.a
          href="https://checkout.bralto.io"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 0 80px rgba(249, 115, 22, 0.6)"
          }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center justify-center px-12 py-5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#DB2777] text-white font-bold text-lg font-['Space_Grotesk'] hover:from-[#F97316]/90 hover:to-[#DB2777]/90 transition-all duration-300 shadow-[0_0_40px_rgba(249,115,22,0.3)] hover:shadow-[0_0_60px_rgba(219,39,119,0.4)]"
        >
          <motion.span
            animate={{
              x: [0, 5, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            IR A LA PLATAFORMA
          </motion.span>
          <motion.div
            className="ml-2"
            animate={{
              x: [0, 5, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.1
            }}
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
        </motion.a>
      </div>
    </section>
  );
}

// Social Proof Section
function SocialProof() {
  const testimonials = [
    {
      author: "Alina Ramírez",
      role: "Business Manager",
      rating: 5,
      quote: "A uno se le olvida hacer seguimientos cuando se da cuenta tiene mil suscripciones por todo lado. El sistema trabaja por nosotros, y solo hablamos con personas realmente interesadas."
    },
    {
      author: "Martín Frediani",
      role: "Editor - Magazine",
      rating: 5,
      quote: "En Bralto logramos algo que no habíamos podido antes: tener todo en un mismo lugar. Es una locura lo que lograron como sistema."
    },
    {
      author: "Alejandro Araya",
      role: "Asesor financiero",
      rating: 5,
      quote: "La organización de leads y la automatización nos dio una trazabilidad real. Ahora sí sentimos que operamos con orden y claridad."
    }
  ];

  return (
    <section className="relative py-12 bg-[#0E0E0E] overflow-hidden">
      {/* Floating gradient orbs */}
      <motion.div
        className="absolute -top-40 right-10 w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0, 217, 255, 0.1), transparent 70%)",
          filter: "blur(100px)"
        }}
        animate={{
          y: [0, -50, 0],
          x: [0, 30, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, type: "spring" }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white font-['Space_Grotesk']">
            Resultados reales. Crecimiento real.{" "}
            <motion.span 
              className="text-[#00D9FF]"
              animate={{
                textShadow: [
                  "0 0 20px rgba(0, 217, 255, 0.5)",
                  "0 0 40px rgba(0, 217, 255, 0.8)",
                  "0 0 20px rgba(0, 217, 255, 0.5)",
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Sistemas que no fallan.
            </motion.span>
          </h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50, rotateY: -20 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.15,
                type: "spring",
                bounce: 0.3
              }}
              whileHover={{ 
                y: -10,
                rotateY: 5,
                transition: { duration: 0.3 }
              }}
              className="relative group"
            >
              <motion.div 
                className="absolute -inset-px bg-gradient-to-br from-[#F97316]/20 to-[#DB2777]/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                whileHover={{
                  scale: 1.1,
                  opacity: 1
                }}
              />
              
              <div className="relative p-6 rounded-2xl bg-[#1A1A1A]/80 border border-white/5 hover:border-white/10 transition-all duration-300 h-full">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        duration: 0.5,
                        delay: index * 0.15 + i * 0.05,
                        type: "spring"
                      }}
                    >
                      <Star className="w-4 h-4 fill-[#F97316] text-[#F97316]" />
                    </motion.div>
                  ))}
                </div>
                
                {/* Quote */}
                <p className="text-gray-300 mb-6 font-['Manrope'] text-sm leading-relaxed">
                  "{testimonial.quote}"
                </p>
                
                {/* Author */}
                <div className="mt-auto">
                  <p className="text-white font-semibold font-['Space_Grotesk']">
                    {testimonial.author}
                  </p>
                  <p className="text-gray-500 text-sm font-['Manrope']">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Footer Section
function FooterBrand() {
  return (
    <footer className="relative py-8 bg-[#0E0E0E] border-t border-white/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Brand Block */}
          <div>
            <img 
              src="https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6823c9f977a9d4672be32ac7.png" 
              alt="Bralto Logo" 
              className="h-10 w-auto mb-4"
            />
            <p className="text-gray-400 font-['Manrope'] text-sm leading-relaxed">
              Diseñamos sistemas inteligentes para marcas que entienden que el crecimiento
              ya no depende de más esfuerzo, sino de mejor estructura.
            </p>
          </div>

          {/* Contact */}
          <div className="md:text-right">
            <p className="text-white font-semibold font-['Space_Grotesk'] mb-2">
              Alejandro Aguilar | Bralto
            </p>
            <p className="text-gray-400 text-sm font-['Manrope'] flex items-center gap-2 md:justify-end mb-2">
              <MapPin className="w-4 h-4" />
              Dallas, TX
            </p>
            <a 
              href="mailto:cs@bralto.io" 
              className="text-[#00D9FF] text-sm font-['Manrope'] hover:underline"
            >
              cs@bralto.io
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-gray-500 text-xs font-['Manrope']">
            Copyright 2026. Alejandro Aguilar. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Main Thank You Page Component
export default function ThankYouPage() {
  return (
    <div className="bg-[#0E0E0E]">
      {/* Top Logo */}
      <div className="w-full flex justify-center py-6 bg-[#0E0E0E]">
        <img 
          src="https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6823c9f977a9d4672be32ac7.png" 
          alt="Bralto Logo" 
          className="h-10 w-auto"
        />
      </div>

      <HeroConfirmation />
      <TransformationCard />
      <PrimaryCTA />
      <SocialProof />
      <FooterBrand />
    </div>
  );
}
