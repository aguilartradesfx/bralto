"use client";

import { motion, useInView } from "framer-motion";
import React, { useRef, useEffect, useState } from "react";
import { TrendingUp, Clock, Target, Users, AlertCircle } from "lucide-react";

function AnimatedCounter({
  value,
  suffix = "",
  duration = 2000,
  startValue = 0,
  startSuffix = "",
}: {
  value: number;
  suffix?: string;
  duration?: number;
  startValue?: number;
  startSuffix?: string;
}) {
  const [count, setCount] = useState(startValue);
  const [displaySuffix, setDisplaySuffix] = useState(startSuffix);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      setCount(Math.floor(startValue + (progress * (value - startValue))));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
        setDisplaySuffix(suffix);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration, startValue, suffix]);

  return (
    <span ref={ref} className="flex">
      {count}
      {displaySuffix || suffix}
    </span>
  );
}

export function MetricsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const metrics = [
    {
      icon: Clock,
      value: 0,
      suffix: "<1min",
      startValue: 100,
      startSuffix: " mins",
      label: "Tiempo de respuesta",
      description: "vs 4.5h promedio tradicional",
      color: "from-white/5 to-amber-500/20",
      iconColor: "text-white",
      glowColor: "shadow-cyan/50",
    },
    {
      icon: TrendingUp,
      value: 37,
      suffix: "%",
      label: "Aumento en conversión",
      description: "Más leads calificados cerrando",
      color: "from-white/5 to-amber-500/20",
      iconColor: "text-white",
      glowColor: "shadow-cyan/50",
    },
    {
      icon: Target,
      value: 79,
      suffix: "%",
      label: "Meetings confirmados",
      description: "Agendados automáticamente",
      color: "from-white/5 to-amber-500/20",
      iconColor: "text-white",
      glowColor: "shadow-cyan/50",
    },
    {
      icon: Users,
      value: 24,
      suffix: "/7",
      label: "Cobertura completa",
      description: "Sin vacaciones ni días libres",
      color: "from-white/5 to-amber-500/20",
      iconColor: "text-white",
      glowColor: "shadow-cyan/50",
    },
  ];

  return (
    <section ref={ref} className="relative py-32 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-noise" />
      {/* Gradient mesh */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-30" />
      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-20"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-white/3 border border-white/10 text-white text-sm font-medium mb-6">
            Resultados Medibles
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Números que{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              hablan por sí solos
            </span>
          </h2>
          <p className="text-xl text-gray-400">
            Mejora real en métricas que impactan directamente tu bottom line
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              className="group relative"
            >
              {/* Glow effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${metric.color} rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50 group-hover:opacity-100`}
              />

              <div className="relative h-full p-8 rounded-2xl bg-gradient-to-br from-[#0D0D0D]/90 to-[#0D0D0D]/90 border border-white/5 backdrop-blur-sm hover:border-white/10 transition-all duration-500">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}
                >
                  <metric.icon className={`w-7 h-7 ${metric.iconColor}`} />
                </div>

                {/* Main metric */}
                <div className="mb-4">
                  <div
                    className={`text-6xl md:text-7xl font-bold font-mono-data mb-2 ${metric.iconColor} group-hover:`}
                  >
                    <AnimatedCounter
                      value={metric.value}
                      suffix={metric.suffix}
                      startValue={metric.startValue}
                      startSuffix={metric.startSuffix}
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {metric.label}
                  </h3>
                  <p className="text-sm text-gray-400">{metric.description}</p>
                </div>

                {/* Progress bar */}
                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: "100%" } : {}}
                      transition={{ duration: 1.5, delay: index * 0.15 + 0.5 }}
                      className={`h-full bg-gradient-to-r ${metric.color.replace("/20", "")}`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Callout alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-gray-300">
              <span className="font-semibold text-white">La realidad:</span> Un cliente
              esperando más de 5 minutos tiene 10x más probabilidad de abandonar
            </p>
          </div>
        </motion.div>

        {/* Bottom CTA */}
      </div>
    </section>
  );
}
