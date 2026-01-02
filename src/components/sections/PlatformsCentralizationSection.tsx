"use client";

import React, { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, X, DollarSign, Zap, TrendingUp } from "lucide-react";
import { AnimatedCTAButton } from "@/components/ui/AnimatedCTAButton";

interface PlatformRow {
  function: string;
  replaces: string[];
  separate_cost: string;
  bralto: boolean;
}

const PLATFORMS: PlatformRow[] = [
  {
    function: "Gestión de CRM y Embudos de Venta",
    replaces: ["HubSpot", "Pipedrive"],
    separate_cost: "$99 – $800 / mes",
    bralto: true,
  },
  {
    function: "Embudos de Venta Ilimitados",
    replaces: ["ClickFunnels", "Leadpages"],
    separate_cost: "$297 / mes",
    bralto: true,
  },
  {
    function: "Constructor de Sitios Web",
    replaces: ["Wix", "WordPress", "Squarespace"],
    separate_cost: "$29 / mes",
    bralto: true,
  },
  {
    function: "Encuestas y Formularios",
    replaces: ["Typeform", "SurveyGizmo", "Google Forms"],
    separate_cost: "$49 / mes",
    bralto: true,
  },
  {
    function: "Email Marketing",
    replaces: ["Mailchimp", "ActiveCampaign", "HubSpot"],
    separate_cost: "$99 / mes",
    bralto: true,
  },
  {
    function: "Mensajería SMS Bidireccional",
    replaces: ["Twilio", "Podium", "SimpleTexting"],
    separate_cost: "$99 / mes",
    bralto: true,
  },
  {
    function: "Reservas y Citas Automatizadas",
    replaces: ["Calendly", "Acuity", "Book Like a Boss"],
    separate_cost: "$29 / mes",
    bralto: true,
  },
  {
    function: "Automatización de Flujos de Trabajo",
    replaces: ["HubSpot Workflows", "Keap"],
    separate_cost: "$169 / mes",
    bralto: true,
  },
  {
    function: "Cursos y Productos Digitales",
    replaces: ["Teachable", "Thinkific", "Kajabi"],
    separate_cost: "$99 / mes",
    bralto: true,
  },
  {
    function: "Seguimiento de Llamadas",
    replaces: ["CallRail", "WhatConverts"],
    separate_cost: "$49 / mes",
    bralto: true,
  },
  {
    function: "Gestión de Reputación Online",
    replaces: ["Birdeye", "Yext", "Podium"],
    separate_cost: "$159 / mes",
    bralto: true,
  },
  {
    function: "Análisis y Seguimiento de Datos",
    replaces: ["Google Analytics 360", "Mixpanel"],
    separate_cost: "$299 / mes",
    bralto: true,
  },
  {
    function: "Comunidades",
    replaces: ["Skool", "Circle", "Mighty Networks"],
    separate_cost: "$89 / mes",
    bralto: true,
  },
  {
    function: "Firma de Documentos Digitales",
    replaces: ["HelloSign", "PandaDoc"],
    separate_cost: "$47 / mes",
    bralto: true,
  },
  {
    function: "App Móvil con Marca Personalizada (Gray Label)",
    replaces: ["Custom Mobile App Development"],
    separate_cost: "≈ $2,500",
    bralto: true,
  },
  {
    function: "Aplicación de Escritorio (White Label)",
    replaces: ["Custom SaaS Licensing"],
    separate_cost: "$5,000 setup + $499 / mes",
    bralto: true,
  },
];

export function PlatformsCentralizationSection() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"bralto" | "separado">("bralto");
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="centralizacion"
      ref={sectionRef}
      className="relative py-24 px-6 overflow-hidden bg-gradient-to-b from-black via-[#0D0D0D] to-black"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-white/3 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-cyan/5 rounded-full blur-[120px]" />
      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-bold text-white mb-3 tracking-wider uppercase">
            Centralización total
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Bralto reemplaza y centraliza todas las plataformas
            <br />
            que su negocio necesita.
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Todo su sistema de ventas, marketing, automatización y operación,
            funcionando desde un solo lugar.
          </p>
        </motion.div>

        {/* Toggle view modes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center gap-3 mb-12"
        >
          <button
            onClick={() => setViewMode("separado")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              viewMode === "separado"
                ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500/50 text-white"
                : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Si se paga separado
            </span>
          </button>
          <button
            onClick={() => setViewMode("bralto")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              viewMode === "bralto"
                ? "bg-gradient-to-r from-white/5 to-amber-500/20 border-2 border-white/10/50 text-white"
                : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Todo con Bralto
            </span>
          </button>
        </motion.div>

        {/* Desktop Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="hidden lg:block relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#0D0D0D]/80 to-[#0D0D0D]/80 backdrop-blur-sm overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-white/10">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-bold text-gray-300">
              <div className="col-span-4">Funciones</div>
              <div className="col-span-4">Reemplazamos</div>
              <div className="col-span-2 text-center">Si se paga separado</div>
              <div className="col-span-2 text-center">
                <span className="text-white">Bralto</span>
              </div>
            </div>
          </div>

          {/* Rows */}
          <div>
            {PLATFORMS.map((platform, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                onMouseEnter={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 transition-all duration-300 ${
                  hoveredRow === index
                    ? "bg-white/3 border-white/10"
                    : "hover:bg-white/[0.02]"
                }`}
              >
                {/* Function name */}
                <div className="col-span-4 flex items-center gap-2">
                  <p className="text-xs font-medium text-white">
                    {platform.function}
                  </p>
                  {hoveredRow === index && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[10px] text-white font-medium whitespace-nowrap"
                    >
                      ✓ Incluido sin costos adicionales
                    </motion.span>
                  )}
                </div>

                {/* Replaces */}
                <div className="col-span-4 flex items-center">
                  <div className="flex flex-wrap gap-1.5">
                    {platform.replaces.map((tool, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{
                          duration: 0.3,
                          delay: 0.5 + index * 0.05 + i * 0.05,
                        }}
                        className="px-1.5 py-0.5 text-[10px] bg-white/5 border border-white/10 rounded text-gray-400"
                      >
                        {tool}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Separate cost */}
                <div className="col-span-2 flex items-center justify-center">
                  <motion.div
                    animate={
                      viewMode === "separado"
                        ? { scale: 1.1, color: "#ff4444" }
                        : { scale: 1, color: "#9ca3af" }
                    }
                    transition={{ duration: 0.3 }}
                    className="text-xs font-bold"
                  >
                    {platform.separate_cost}
                  </motion.div>
                </div>

                {/* Bralto */}
                <div className="col-span-2 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{
                      duration: 0.5,
                      delay: 0.6 + index * 0.05,
                      type: "spring",
                      stiffness: 200,
                    }}
                    className="relative"
                  >
                    <motion.div
                      animate={
                        viewMode === "bralto" || hoveredRow === index
                          ? { scale: 1.2, rotate: [0, 10, -10, 0] }
                          : { scale: 1, rotate: 0 }
                      }
                      transition={{ duration: 0.5 }}
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-black" strokeWidth={3} />
                    </motion.div>

                    {/* Glow effect */}
                    {(viewMode === "bralto" || hoveredRow === index) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-white/5 blur-xl -z-10"
                      />
                    )}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mobile Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:hidden space-y-4"
        >
          {PLATFORMS.map((platform, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.03 }}
              className="relative rounded-xl border border-white/10 bg-gradient-to-br from-[#0D0D0D]/80 to-[#0D0D0D]/80 backdrop-blur-sm p-4 space-y-2"
            >
              {/* Function name with checkmark */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-bold text-white flex-1">
                  {platform.function}
                </h3>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{
                    duration: 0.5,
                    delay: 0.5 + index * 0.03,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className="relative flex-shrink-0"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-black" strokeWidth={3} />
                  </div>
                </motion.div>
              </div>

              {/* Replaces with costs and Bralto badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {platform.replaces.map((tool, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-[11px] bg-white/5 border border-white/10 rounded text-gray-400"
                    >
                      {tool}
                    </span>
                  ))}
                  <motion.span
                    animate={
                      viewMode === "separado"
                        ? { scale: 1.05, color: "#ff4444" }
                        : { scale: 1, color: "#9ca3af" }
                    }
                    className="px-2 py-1 text-[11px] font-bold bg-red-500/10 border border-red-500/20 rounded"
                  >
                    {platform.separate_cost}
                  </motion.span>
                </div>

                {/* Bralto included badge */}
                <div className="flex items-center gap-1.5 bg-white/3 border border-white/10 rounded-full px-2.5 py-1 flex-shrink-0">
                  <p className="text-[10px] text-white font-medium whitespace-nowrap">
                    Con Bralto
                  </p>
                  <p className="text-[10px] font-bold text-green-400 whitespace-nowrap">
                    ✓ Incluido
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Savings summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <div className="inline-block px-8 py-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/3 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-2">
              Un solo sistema. Menos costos. Menos fricción.
            </h3>
            <p className="text-gray-400 mb-6">
              Sin integraciones frágiles. Sin pagos duplicados. Sin herramientas
              sueltas.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <AnimatedCTAButton
                href="https://checkout.bralto.io"
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                className="px-8"
              >
                Iniciar prueba gratuita
              </AnimatedCTAButton>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
