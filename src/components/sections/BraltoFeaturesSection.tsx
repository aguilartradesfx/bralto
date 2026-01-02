"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Calendar,
  CheckCircle,
  TrendingUp,
  CreditCard,
  BarChart3,
  Globe,
  FileText,
  Phone,
  Mail,
  MessageSquare,
  Smartphone,
  User,
  Pause,
  Play,
  RotateCcw,
  ChevronDown,
  Layers,
  Globe2,
  Zap,
} from "lucide-react";
import { AnimatedCTAButton } from "@/components/ui/AnimatedCTAButton";

// Capabilities for tabs (excluding AI agents which stays as hero)
const CAPABILITIES = [
  {
    id: "organization",
    label: "Organización",
    icon: Layers,
    headline: "Del interés al cierre, todo en un solo lugar.",
    bullets: [
      "Pipeline visual y automatizado",
      "Pagos integrados sin fricción",
      "Reportes en tiempo real",
    ],
    details: [
      "Gestión de pipeline manual y automatizada (etapas, arrastre, automations).",
      "Pagos integrados (cobros en web/funnels/reservas).",
      "Reportes y analíticas (ingresos, conversiones, rendimiento por etapa).",
    ],
    animationType: "dashboard",
  },
  {
    id: "websites",
    label: "Sitios web",
    icon: Globe2,
    headline: "Crea páginas que convierten.",
    bullets: [
      "Webs, funnels y landing pages",
      "Formularios Drag & Drop",
      "Agenda integrada",
    ],
    details: [
      "Constructor avanzado para páginas y funnels.",
      "Encuestas y formularios integrables en sitios.",
      "Reservas/citas sin depender de apps externas.",
    ],
    animationType: "builder",
  },
  {
    id: "multichannel",
    label: "Multicanal",
    icon: Zap,
    headline: "Después del lead, la magia comienza.",
    bullets: [
      "Campañas automatizadas multicanal",
      "SMS, Email, WhatsApp, Messenger",
      "App móvil incluida",
    ],
    details: [
      "Automatizaciones para seguimiento y recuperación de leads.",
      "Centralización de conversaciones por canales.",
      "Responder desde cualquier dispositivo (app móvil).",
    ],
    animationType: "multichannel",
  },
];

interface Message {
  role: "user" | "ai";
  content: string;
  delay: number;
}

function ConversationAnimation() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const chatRef = useRef(null);
  const isInView = useInView(chatRef, { once: false });

  const conversationRef = useRef<Message[]>([
    {
      role: "user",
      content: "Hola, quisiera información sobre sus planes empresariales",
      delay: 0,
    },
    {
      role: "ai",
      content:
        "¡Hola! Encantado de ayudarte. ¿Cuántos agentes necesitas para tu equipo?",
      delay: 1000,
    },
    {
      role: "user",
      content: "Somos un equipo de ventas de 15 personas",
      delay: 2000,
    },
    {
      role: "ai",
      content:
        "Perfecto. Para 15 agentes recomiendo nuestro plan Enterprise. ¿Cuál es tu principal desafío actual con leads?",
      delay: 1000,
    },
    {
      role: "user",
      content:
        "Perdemos muchos leads porque no respondemos lo suficientemente rápido",
      delay: 2000,
    },
    {
      role: "ai",
      content:
        "Entiendo. Con nuestra IA, el tiempo de respuesta baja a menos de 5 segundos. ¿Te gustaría ver una demo personalizada?",
      delay: 1000,
    },
    {
      role: "user",
      content: "Sí, me interesa. ¿Cuándo podríamos agendar?",
      delay: 1500,
    },
    {
      role: "ai",
      content:
        "¡Excelente! Tengo disponibilidad mañana a las 10:00 AM o 3:00 PM. ¿Cuál prefieres?",
      delay: 1000,
    },
    {
      role: "user",
      content: "Mañana a las 10:00 AM está perfecto",
      delay: 1500,
    },
    {
      role: "ai",
      content:
        "✓ Reunión confirmada para mañana 10:00 AM. Te envié email con el link de Zoom. ¡Nos vemos!",
      delay: 1000,
    },
  ]);

  const conversation = conversationRef.current;

  useEffect(() => {
    if (!isInView) {
      setIsPlaying(false);
      return;
    }

    if (isPlaying && currentMessageIndex < conversation.length) {
      const currentMessage = conversation[currentMessageIndex];
      const timer = setTimeout(() => {
        setDisplayedMessages((prev) => [...prev, currentMessage]);
        setCurrentMessageIndex((prev) => prev + 1);
      }, currentMessage.delay);

      return () => clearTimeout(timer);
    } else if (currentMessageIndex >= conversation.length) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentMessageIndex, isInView, conversation]);

  const handlePlayPause = () => {
    if (currentMessageIndex >= conversation.length) {
      // Reset
      setDisplayedMessages([]);
      setCurrentMessageIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    setDisplayedMessages([]);
    setCurrentMessageIndex(0);
    setIsPlaying(true);
  };

  // Auto-play when in view
  useEffect(() => {
    if (isInView && displayedMessages.length === 0) {
      setIsPlaying(true);
    }
  }, [isInView, displayedMessages.length]);

  return (
    <div ref={chatRef} className="relative h-[500px]">
      {/* Chat widget mockup */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#0D0D0D]/90 to-black/90 backdrop-blur-xl shadow-2xl h-full flex flex-col">
        {/* Widget header */}
        <div className="flex items-center justify-between p-4 bg-[#0D0D0D]/80 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Agente IA - Ventas</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-green-400">Online 24/7</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className="p-2 rounded-lg bg-white/3 hover:bg-white/5 border border-white/10 transition-colors"
              title={isPlaying ? "Pausar" : "Reproducir"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white" />
              )}
            </button>
            <button
              onClick={handleRestart}
              className="p-2 rounded-lg bg-cyan/10 hover:bg-cyan/20 border border-cyan/20 transition-colors"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4 text-electric" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {displayedMessages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex items-start gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-gray-600 to-gray-700"
                      : "bg-gradient-to-br from-orange-400 to-amber-500"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-black" />
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-gray-700 to-gray-800 text-white"
                      : "bg-gradient-to-br from-white/5 to-amber-500/20 text-white border border-white/10"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isPlaying && currentMessageIndex < conversation.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/3 border border-white/10">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-white/5 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-white/5 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-white/5 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Status bar */}
        {currentMessageIndex >= conversation.length &&
          displayedMessages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-500/10 border-t border-green-500/20 flex-shrink-0"
            >
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Lead calificado → Meeting agendado → CRM actualizado
                </span>
              </div>
            </motion.div>
          )}
      </div>
      {/* Stats below chat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-6 grid grid-cols-3 gap-4"
      >
        <div className="text-center p-4 rounded-xl bg-[#0D0D0D]/50 border border-white/8">
          <div className="text-2xl font-bold text-white mb-1">38s</div>
          <div className="text-xs text-gray-400">Duración total</div>
        </div>
        <div className="text-center p-4 rounded-xl bg-[#0D0D0D]/50 border border-green-400/10">
          <div className="text-2xl font-bold text-green-400 mb-1">100%</div>
          <div className="text-xs text-gray-400">Calificado</div>
        </div>
        <div className="text-center p-4 rounded-xl bg-[#0D0D0D]/50 border border-cyan/10">
          <div className="text-2xl font-bold text-electric mb-1">1</div>
          <div className="text-xs text-gray-400">Meeting agendado</div>
        </div>
      </motion.div>
    </div>
  );
}

function DashboardAnimation() {
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-3 rounded-lg bg-gradient-to-br from-[#0D0D0D]/90 to-[#0D0D0D]/90 border border-white/10"
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-white">Pipeline</h4>
          <TrendingUp className="w-3 h-3 text-white" />
        </div>
        <div className="space-y-2">
          {["Nuevo", "Calificado", "Propuesta", "Cerrado"].map((stage, i) => (
            <motion.div
              key={stage}
              initial={{ width: 0 }}
              animate={{ width: `${100 - i * 20}%` }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="h-6 bg-white/5 border border-white/10 rounded flex items-center px-2"
            >
              <span className="text-[10px] text-gray-300">{stage}</span>
              <span className="ml-auto text-[10px] font-bold text-white">
                {20 - i * 4}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="absolute -top-1 -right-1 px-2 py-1 bg-white/5/30 border border-white/10 rounded backdrop-blur-sm"
      >
        <div className="flex items-center gap-1">
          <CreditCard className="w-2.5 h-2.5 text-white" />
          <span className="text-[9px] font-bold text-white">Pago recibido</span>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.9 }}
        className="absolute -bottom-1 -left-1 px-2 py-1 bg-cyan/30 border border-cyan/50 rounded backdrop-blur-sm"
      >
        <div className="flex items-center gap-1">
          <BarChart3 className="w-2.5 h-2.5 text-electric" />
          <span className="text-[9px] font-bold text-white">
            +23% conversión
          </span>
        </div>
      </motion.div>
    </div>
  );
}

function BuilderAnimation() {
  return (
    <div className="relative overflow-hidden">
      {/* Browser mockup - more compact */}
      <div className="p-3 rounded-lg bg-gradient-to-br from-[#0D0D0D]/90 to-[#0D0D0D]/90 border border-white/10">
        {/* Browser chrome */}
        <div className="flex items-center gap-1 mb-2 pb-1.5 border-b border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
          <div className="flex-1 mx-2 px-2 py-0.5 rounded bg-white/5 text-[8px] text-gray-500">
            tuempresa.com
          </div>
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500/20 border border-green-500/40 rounded text-[8px] text-green-400">
            <div className="w-1 h-1 bg-green-400 rounded-full" />
            Live
          </div>
        </div>

        {/* Website preview - condensed */}
        <div className="space-y-1.5">
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-white/5 rounded border border-white/10">
            <div className="w-12 h-2 bg-white/5/40 rounded" />
            <div className="flex gap-1">
              <div className="w-6 h-1.5 bg-white/20 rounded" />
              <div className="w-6 h-1.5 bg-white/20 rounded" />
            </div>
          </div>

          {/* Hero */}
          <div className="p-2 bg-gradient-to-r from-white/5 to-white/3 rounded border border-white/10">
            <div className="w-2/3 h-3 bg-white/30 rounded mb-1" />
            <div className="w-1/2 h-1.5 bg-white/15 rounded mb-2" />
            <div className="w-14 h-4 bg-white/5/40 border border-white/10 rounded" />
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="p-1.5 bg-white/5 rounded border border-white/10"
              >
                <div className="w-4 h-4 bg-white/5 rounded mb-1 mx-auto" />
                <div className="w-full h-1.5 bg-white/20 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Floating badges */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="absolute top-2 -right-1 px-1.5 py-0.5 bg-white/5 border border-white/10/40 rounded backdrop-blur-sm"
      >
        <div className="flex items-center gap-1">
          <Globe className="w-2.5 h-2.5 text-white" />
          <span className="text-[8px] text-white">Responsivo</span>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="absolute bottom-8 -left-1 px-1.5 py-0.5 bg-cyan/20 border border-cyan/40 rounded backdrop-blur-sm"
      >
        <div className="flex items-center gap-1">
          <FileText className="w-2.5 h-2.5 text-electric" />
          <span className="text-[8px] text-white">SEO listo</span>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-violet/20 border border-violet/40 rounded backdrop-blur-sm"
      >
        <div className="flex items-center gap-1">
          <CheckCircle className="w-2.5 h-2.5 text-violet" />
          <span className="text-[8px] text-white">Sin código</span>
        </div>
      </motion.div>
    </div>
  );
}

function MultichannelAnimation() {
  const channels = [
    { icon: Phone, label: "Llamada", color: "text-white" },
    { icon: Mail, label: "Email", color: "text-electric" },
    { icon: MessageCircle, label: "WhatsApp", color: "text-white" },
    { icon: MessageSquare, label: "Messenger", color: "text-electric" },
    { icon: Smartphone, label: "SMS", color: "text-white" },
  ];

  return (
    <div className="relative">
      <div className="grid grid-cols-5 gap-2">
        {channels.map((channel, i) => {
          const Icon = channel.icon;
          return (
            <motion.div
              key={channel.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative"
            >
              <div className="aspect-square rounded-lg bg-gradient-to-br from-[#0D0D0D]/90 to-[#0D0D0D]/90 border border-white/10 flex flex-col items-center justify-center gap-1 p-2">
                <Icon className={`w-4 h-4 ${channel.color}`} />
                <span className="text-[9px] text-gray-400">
                  {channel.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-3 p-2 rounded-lg bg-white/5 border border-white/10/40"
      >
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-white/5 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-white">
            5 canales sincronizados
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// AI Agents Hero Block (Chat Demo stays untouched)
function AIAgentsBlock() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const bullets = [
    "Leads calificados sin intervención",
    "Calendario en piloto automático",
    "Seguimiento sin esfuerzo",
  ];

  return (
    <div ref={ref} className="mb-16">
      <div className="max-w-4xl mx-auto">
        {/* Compact header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <span className="text-xs font-bold text-white tracking-widest">
            AGENTES DE AI
          </span>
          <h3 className="text-xl md:text-2xl font-bold text-white mt-1">
            Agenda llena, automáticamente.
          </h3>

          {/* Inline bullets */}
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {bullets.map((bullet, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/3 border border-white/10"
              >
                <CheckCircle className="w-3 h-3 text-white" />
                <span className="text-xs text-gray-300">{bullet}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Chat Demo - UNTOUCHED */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative"
        >
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-[#0D0D0D]/60 to-[#0D0D0D]/60 border border-white/10 backdrop-blur-sm">
            <ConversationAnimation />
          </div>
          <div className="absolute -inset-4 bg-white/3 rounded-3xl blur-2xl -z-10" />
        </motion.div>
      </div>
    </div>
  );
}

// Capabilities Tabs Component
function CapabilitiesTabs() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const AnimationComponents: Record<string, React.FC> = {
    dashboard: DashboardAnimation,
    builder: BuilderAnimation,
    multichannel: MultichannelAnimation,
  };

  const activeCapability = CAPABILITIES[activeTab];
  const ActiveAnimation = AnimationComponents[activeCapability.animationType];

  return (
    <div ref={ref} className="mt-8 pt-8 border-t border-white/5">
      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="flex justify-center gap-2 mb-8"
      >
        {CAPABILITIES.map((cap, i) => {
          const Icon = cap.icon;
          const isActive = i === activeTab;
          return (
            <button
              key={cap.id}
              onClick={() => {
                setActiveTab(i);
                setShowDetails(false);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 ${
                isActive
                  ? "bg-white/5 border border-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                  : "bg-[#0D0D0D]/50 border border-white/10 text-gray-400 hover:border-cyan/30 hover:text-gray-300"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : ""}`} />
              <span className="text-sm font-medium">{cap.label}</span>
            </button>
          );
        })}
      </motion.div>
      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="grid lg:grid-cols-2 gap-6 items-start"
        >
          {/* Left: Content */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">
                {activeCapability.headline}
              </h3>
            </div>

            {/* Visible bullets */}
            <div className="space-y-2">
              {activeCapability.bullets.map((bullet, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-4 h-4 rounded-full bg-white/5 border border-white/10/40 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-sm text-gray-300">{bullet}</span>
                </motion.div>
              ))}
            </div>

            {/* Expandable details */}
            <div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1.5 text-xs text-white hover:text-white/80 transition-colors"
              >
                <span>Ver detalles</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-300 ${showDetails ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-3 rounded-lg bg-[#0D0D0D]/50 border border-white/5 space-y-2">
                      {activeCapability.details.map((detail, i) => (
                        <p
                          key={i}
                          className="text-xs text-gray-400 leading-relaxed"
                        >
                          • {detail}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Animation */}
          <div className="relative">
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#0D0D0D]/60 to-[#0D0D0D]/60 border border-white/10 backdrop-blur-sm">
              <ActiveAnimation />
            </div>
            <div className="absolute -inset-4 bg-white/3 rounded-2xl blur-xl -z-10" />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function BraltoFeaturesSection() {
  return (
    <section id="caracteristicas" className="relative py-16 overflow-hidden bg-gradient-to-b from-black via-[#0D0D0D] to-black">
      <div className="absolute inset-0 bg-noise opacity-20" />
      <div className="relative z-10 container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="text-xs font-bold text-white tracking-widest">
            TODO EN UNO
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-2">
            Todo el sistema que convierte leads en ventas,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">
              sin fricción.
            </span>
          </h2>
          <p className="text-lg text-gray-400 mt-4">
            Desde el primer mensaje hasta el pago, todo ocurre en Bralto.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto space-y-12">
          {/* AI Agents Block with Chat Demo */}
          <AIAgentsBlock />

          {/* Capabilities Tabs */}
          <div className="pt-8">
            <CapabilitiesTabs />
          </div>
        </div>

        {/* CTA Block - More compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mt-12"
        >
          <AnimatedCTAButton
            href="https://checkout.bralto.io"
            target="_blank"
            rel="noopener noreferrer"
            size="lg"
            className="px-8 py-5 text-base"
          >
            INICIAR PRUEBA GRATUITA
          </AnimatedCTAButton>
          <p className="text-xs text-gray-500 mt-3">
            Hoy paga $0 – Pruebe el sistema antes de pagarlo
          </p>
        </motion.div>
      </div>
    </section>
  );
}
