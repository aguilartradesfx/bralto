"use client";

import { CheckCircle, Star, Mail, MapPin, Sparkles } from "lucide-react";

// Hero Confirmation Section - With subtle animations
function HeroConfirmation() {
  return (
    <section className="relative min-h-[50vh] flex items-center justify-center bg-[#0D0D0D] overflow-hidden py-12">
      {/* Animated Background - Smooth movement */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full opacity-40 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
            top: '5%',
            left: '10%',
          }}
        />
        <div 
          className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full opacity-30 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(219, 39, 119, 0.12) 0%, transparent 70%)',
            filter: 'blur(80px)',
            bottom: '10%',
            right: '5%',
          }}
        />
        <div 
          className="absolute w-[350px] h-[350px] rounded-full opacity-20 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(0, 217, 255, 0.1) 0%, transparent 70%)',
            filter: 'blur(70px)',
            top: '40%',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm font-medium">
            <Mail className="w-4 h-4" />
            SE ENVIÓ UN CORREO CON SU ACCESO
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-['Space_Grotesk']">
          <span
            style={{
              backgroundImage: "linear-gradient(90deg, #FFFFFF 0%, #F97316 50%, #DB2777 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ¡Todo listo!
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-gray-300 mb-8 font-['Manrope']">
          Su camino hacia un sistema digital escalable está oficialmente en marcha.
        </p>

        {/* Supporting text */}
        <p className="text-lg text-gray-400 max-w-2xl mx-auto font-['Manrope'] leading-relaxed">
          Lo que está por aprender y construir aquí no lo va a encontrar en ninguna otra
          plataforma, agencia o curso. Este es un programa diseñado para que usted deje
          de depender del azar y empiece a operar con estructura real.
        </p>

        {/* Success icon */}
        <div className="mt-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#F97316]/10 border border-[#F97316]/30" style={{ boxShadow: '0 0 30px rgba(249, 115, 22, 0.3)' }}>
            <CheckCircle className="w-10 h-10 text-[#F97316]" />
          </div>
        </div>
      </div>
    </section>
  );
}

// Transformation Card Section - Optimized
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Card */}
          <div className="relative p-8 md:p-12 rounded-2xl bg-gradient-to-br from-[#1A1A1A]/90 to-[#0E0E0E]/90 border border-white/10">
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
                <li
                  key={index}
                  className="flex items-start gap-3 text-gray-200 font-['Manrope']"
                >
                  <CheckCircle className="w-5 h-5 text-[#F97316] mt-0.5 flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// Primary CTA Section - With glow
function PrimaryCTA() {
  return (
    <section className="relative py-8 bg-[#0E0E0E] overflow-hidden">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <a
          href="https://checkout.bralto.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-12 py-5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#DB2777] text-white font-bold text-lg font-['Space_Grotesk'] hover:from-[#F97316]/90 hover:to-[#DB2777]/90 transition-all duration-300 hover:scale-105"
          style={{ boxShadow: '0 0 40px rgba(249, 115, 22, 0.4)' }}
        >
          <span>IR A LA PLATAFORMA</span>
          <Sparkles className="w-5 h-5 ml-2" />
        </a>
      </div>
    </section>
  );
}

// Social Proof Section - Optimized
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Headline */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white font-['Space_Grotesk']">
            Resultados reales. Crecimiento real.{" "}
            <span className="text-[#00D9FF]">
              Sistemas que no fallan.
            </span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative group"
            >
              <div className="relative p-6 rounded-2xl bg-[#1A1A1A]/80 border border-white/5 hover:border-orange-500/20 transition-all duration-300 h-full hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#F97316] text-[#F97316]" />
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
            </div>
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
