"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect } from "react";
import { Calendar } from "lucide-react";

export function FormSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    // Load the form embed script
    const script = document.createElement("script");
    script.src = "https://link.bralto.io/js/form_embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <section id="contacto" ref={ref} className="relative py-32 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-noise" />
      {/* Gradient accents */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-white/3 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-[120px]" />
      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-white/3 border border-white/10 text-white text-sm font-medium mb-6">
            Agenda tu Demo
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Transforma tu negocio{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              en 30 minutos
            </span>
          </h2>
          <p className="text-xl text-gray-400">
            Completa el formulario y recibe una demo personalizada para tu
            industria
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-amber-500/20 rounded-2xl blur-2xl" />

            {/* Form container */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#0D0D0D]/90 to-[#0D0D0D]/90 backdrop-blur-xl shadow-2xl">
              {/* Header */}
              <div className="p-6 bg-[#0D0D0D]/50 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/5 to-amber-500/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Pruebe el sistema en este momento
                    </h3>
                    <p className="text-sm text-gray-400">Solo toma 2 minutos</p>
                  </div>
                </div>
              </div>

              {/* Form iframe */}
              <div className="p-6">
                <iframe
                  src="https://link.bralto.io/widget/form/NhHrFaAeIszUyobGBWhb"
                  style={{
                    width: "100%",
                    height: "587px",
                    border: "none",
                    borderRadius: "3px",
                  }}
                  id="inline-NhHrFaAeIszUyobGBWhb"
                  data-layout="{'id':'INLINE'}"
                  data-trigger-type="alwaysShow"
                  data-trigger-value=""
                  data-activation-type="alwaysActivated"
                  data-activation-value=""
                  data-deactivation-type="neverDeactivate"
                  data-deactivation-value=""
                  data-form-name="Form 17"
                  data-height="587"
                  data-layout-iframe-id="inline-NhHrFaAeIszUyobGBWhb"
                  data-form-id="NhHrFaAeIszUyobGBWhb"
                  title="Form 17"
                />
              </div>
            </div>

            {/* Trust indicators below form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 " />
                <span>Sin compromiso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 " />
                <span>Demo en vivo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 " />
                <span>Respuesta inmediata</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
