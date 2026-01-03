"use client";

import { motion } from "framer-motion";
import { AnimatedBackground } from "./AnimatedBackground";
import { AnimatedCTAButton } from "@/components/ui/AnimatedCTAButton";
import { Play, Volume2, VolumeX } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useMobileDetect } from "@/hooks/use-mobile-detect";

export function BraltoHeroSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useMobileDetect();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && isPlaying) {
            video.play();
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 },
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [isPlaying]);

  const handlePlayClick = () => {
    if (videoRef.current) {
      setIsPlaying(true);
      videoRef.current.play();
    }
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "#0A0A0A" }}
    >
      <AnimatedBackground />
      <div className="absolute inset-0 bg-mesh-gradient z-[1]" />
      <div className="relative z-10 container mx-auto px-4 py-20">
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
              className={
                isMobile
                  ? "text-3xl font-bold leading-tight"
                  : "text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
              }
            >
              <span className="text-white">AUMENTE EXPONENCIALMENTE SUS </span>
              <span className="bg-gradient-to-r from-orange-300 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                LEADS, CITAS Y VENTAS
              </span>
              <span className="text-white">
                {" "}
                EN PILOTO AUTOMÁTICO SIN EQUIPOS HUMANOS
              </span>
            </motion.h1>
          </div>

          {/* Centered Video with animated neon border */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
            className="relative group max-w-4xl mx-auto"
          >
            {/* Animated neon border wrapper */}
            <div className="relative p-[3px] rounded-2xl overflow-hidden">
              {/* Base gradient border - always visible */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background:
                    "linear-gradient(90deg, #F97316 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 30%, #DB2777 50%, rgba(0,0,0,0) 70%, rgba(0,0,0,0) 80%, #F97316 100%)",
                  backgroundSize: "200% 100%",
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Glow effect behind the video */}
              <motion.div
                className="absolute -inset-4 rounded-3xl -z-10"
                animate={{
                  boxShadow: [
                    "0 0 60px rgba(249, 115, 22, 0.4), 0 0 120px rgba(219, 39, 119, 0.25), 0 0 180px rgba(249, 115, 22, 0.15)",
                    "0 0 80px rgba(219, 39, 119, 0.45), 0 0 140px rgba(249, 115, 22, 0.3), 0 0 200px rgba(219, 39, 119, 0.2)",
                    "0 0 60px rgba(249, 115, 22, 0.4), 0 0 120px rgba(219, 39, 119, 0.25), 0 0 180px rgba(249, 115, 22, 0.15)",
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Video container */}
              <div
                className="relative aspect-video rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl transition-all duration-300"
                style={{
                  background: "rgba(10,10,10,0.95)",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                }}
              >
                {/* Video element */}
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  src="https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/691ecf165c5cab592905967c.mp4"
                  playsInline
                  muted={isMuted}
                  disablePictureInPicture
                  controlsList="nodownload nofullscreen noremoteplayback"
                  onContextMenu={(e) => e.preventDefault()}
                />

                {/* Play button overlay */}
                {!isPlaying && (
                  <div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    style={{
                      background:
                        "linear-gradient(to bottom right, rgba(11,11,14,0.85), rgba(17,18,22,0.85))",
                    }}
                    onClick={handlePlayClick}
                  >
                    <div className="absolute inset-0 bg-mesh-gradient opacity-30" />

                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div
                        className="w-20 h-20 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                        style={{
                          background: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                        }}
                      >
                        <Play className="w-10 h-10 ml-1 text-white fill-white" />
                      </div>
                      <p className="text-sm text-white/60">
                        Ver video de presentación
                      </p>
                    </div>

                    {/* Decorative elements */}
                    <div
                      className="absolute top-4 left-4 w-16 h-16 rounded-full blur-xl"
                      style={{ background: "rgba(255, 255, 255, 0.02)" }}
                    />
                    <div
                      className="absolute bottom-4 right-4 w-24 h-24 rounded-full blur-xl"
                      style={{ background: "rgba(255, 255, 255, 0.02)" }}
                    />
                  </div>
                )}

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{ boxShadow: "inset 0 0 60px rgba(249,115,22,0.1)" }}
                  />
                </div>

                {/* Mute/Unmute button */}
                {isPlaying && (
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute bottom-4 right-4 z-20 w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110"
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                    }}
                    aria-label={
                      isMuted ? "Activar sonido" : "Desactivar sonido"
                    }
                  >
                    {isMuted ? (
                      <VolumeX className="w-6 h-6 text-white" />
                    ) : (
                      <Volume2 className="w-6 h-6 text-white" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Floating decorative elements */}
            <div
              className="absolute -top-6 -right-6 w-32 h-32 rounded-full blur-3xl -z-10"
              style={{ background: "rgba(255, 255, 255, 0.03)" }}
            />
            <div
              className="absolute -bottom-6 -left-6 w-40 h-40 rounded-full blur-3xl -z-10"
              style={{ background: "rgba(255, 255, 255, 0.02)" }}
            />
          </motion.div>

          {/* Subheadline - Now after video */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center"
          >
            <p
              className={
                isMobile
                  ? "text-sm text-gray-300 leading-relaxed max-w-4xl mx-auto px-2"
                  : "text-base md:text-lg text-gray-300 leading-relaxed max-w-4xl mx-auto"
              }
            >
              Automatice respuestas, seguimientos y cierres 24/7 con agentes de
              IA que califican, agendan y convierten prospectos por usted en
              WhatsApp, Web Chat y llamadas telefónicas, sin perder
              oportunidades, gestión de leads, pagos y membresías.
            </p>
          </motion.div>

          {/* Centered Bottom Content */}
          <div className="text-center space-y-6">
            {/* Primary CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col items-center space-y-4"
            >
              <AnimatedCTAButton
                href="https://checkout.bralto.io"
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                className="px-8 py-6 text-base md:text-lg"
              >
                INICIE SU PRUEBA GRATUITA DE 14 DÍAS
              </AnimatedCTAButton>
            </motion.div>

            {/* Supporting text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.9 }}
              className="pt-4 max-w-2xl mx-auto"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-xs text-gray-500">
                Resultados de operaciones reales en 2024 con empresas que
                implementaron plataformas y Agentes de IA.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
