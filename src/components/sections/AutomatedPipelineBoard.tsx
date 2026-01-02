'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Zap, Clock, MessageSquare, Calendar, CheckCircle2, TrendingUp, Database, Mail, Send, GitBranch, User, Bell, Pause, Play, RotateCcw } from 'lucide-react';

interface OpportunityCard {
  id: string;
  fullName: string;
  source: string;
  value: number;
  lastActivity: string;
  tags: string[];
  ownerInitials: string;
  columnId: string;
  createdAt: number;
}

interface Column {
  id: string;
  title: string;
  colorClass: string;
  accentColor: string;
}

const COLUMNS: Column[] = [
  { id: 'new_lead', title: 'Nuevo lead', colorClass: 'border-gray-600', accentColor: 'bg-gray-500' },
  { id: 'first_contact', title: 'Primer contacto', colorClass: 'border-gray-600', accentColor: 'bg-gray-500' },
  { id: 'bot_contact', title: 'Contacto BOT', colorClass: 'border-white/10', accentColor: 'bg-white/5' },
  { id: 'call_booked', title: 'Cita agendada', colorClass: 'border-green-400', accentColor: 'bg-green-400' },
];

const FAKE_NAMES = [
  'Sofia García', 'Mateo López', 'Valentina Torres', 'Lucas Rodríguez', 'Emma Martínez',
  'Santiago Pérez', 'Isabella González', 'Diego Hernández', 'Camila Díaz', 'Sebastián Morales',
  'Martina Jiménez', 'Nicolás Ruiz', 'Victoria Sánchez', 'Alejandro Vega', 'Catalina Mendoza',
];

const FAKE_SOURCES = ['Facebook Leads', 'IG Form', 'Landing Page', 'Web Chat', 'Referral'];
const FAKE_TAGS = ['Alta intención', 'Necesita seguimiento', 'Requiere llamada', 'Respondió hoy', 'Caliente', 'Tibio'];
const OWNERS = [
  { initials: 'AA', name: 'Ale' },
  { initials: 'MC', name: 'Mar' },
  { initials: 'JR', name: 'Juli' },
];

const generateCard = (columnId: string, index: number): OpportunityCard => {
  const randomName = FAKE_NAMES[(index * 3) % FAKE_NAMES.length];
  const randomSource = FAKE_SOURCES[(index * 2) % FAKE_SOURCES.length];
  const randomOwner = OWNERS[index % OWNERS.length];
  const numTags = (index % 2) + 1;
  const shuffledTags = [...FAKE_TAGS].sort(() => 0.5 - Math.random());
  
  return {
    id: `card-${columnId}-${index}`,
    fullName: randomName,
    source: randomSource,
    value: Math.floor(Math.random() * (12500 - 250 + 1)) + 250,
    lastActivity: 'Hace ' + Math.floor(Math.random() * 60) + 'min',
    tags: shuffledTags.slice(0, numTags),
    ownerInitials: randomOwner.initials,
    columnId,
    createdAt: Date.now(),
  };
};

// Animation sequence that moves cards but keeps at least 2 in each column
const createAnimationSequence = () => [
  { fromColumn: 'new_lead', toColumn: 'first_contact', notification: 'Lead asignado automáticamente' },
  { fromColumn: 'first_contact', toColumn: 'bot_contact', notification: 'BOT inició contacto' },
  { fromColumn: 'bot_contact', toColumn: 'call_booked', notification: 'Cita agendada con éxito' },
  { fromColumn: 'new_lead', toColumn: 'first_contact', notification: 'Seguimiento automático enviado' },
  { fromColumn: 'first_contact', toColumn: 'bot_contact', notification: 'Lead respondió al BOT' },
];

const initialCardsPerColumn = {
  new_lead: 4,
  first_contact: 4,
  bot_contact: 3,
  call_booked: 3,
};

export function AutomatedPipelineBoard() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  
  const [cards, setCards] = useState<OpportunityCard[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; icon: any }>>([]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    automatedActions: 0,
    meetingsBooked: 0,
  });
  const [speed, setSpeed] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const animationSequence = createAnimationSequence();

  // Initialize cards - cards per column
  const initializeCards = () => {
    const initialCards: OpportunityCard[] = [];
    let cardIndex = 0;
    Object.entries(initialCardsPerColumn).forEach(([columnId, count]) => {
      for (let i = 0; i < count; i++) {
        initialCards.push(generateCard(columnId, cardIndex));
        cardIndex++;
      }
    });
    return initialCards;
  };

  useEffect(() => {
    const initialCards = initializeCards();
    setCards(initialCards);
    setStats({
      totalLeads: initialCards.length,
      automatedActions: 0,
      meetingsBooked: initialCards.filter(c => c.columnId === 'call_booked').length,
    });
  }, []);

  // Auto-play when in view
  useEffect(() => {
    if (isInView && !isPlaying && !isComplete && cards.length > 0 && currentStep === 0) {
      setIsPlaying(true);
    }
  }, [isInView, cards.length, isPlaying, isComplete, currentStep]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || currentStep >= animationSequence.length) {
      if (currentStep >= animationSequence.length && isPlaying) {
        setIsPlaying(false);
        setIsComplete(true);
      }
      return;
    }

    const baseInterval = 2500 / speed;
    const timeout = setTimeout(() => {
      const step = animationSequence[currentStep];
      
      setCards(prevCards => {
        const updatedCards = [...prevCards];
        const cardsInColumn = updatedCards.filter(c => c.columnId === step.fromColumn);
        
        // Only move if there are more than 2 cards in the source column
        if (cardsInColumn.length > 2) {
          const cardToMove = cardsInColumn[0];
          cardToMove.columnId = step.toColumn;
          cardToMove.lastActivity = 'Ahora';
          
          // Update flow scenario
          let newFlowIndex = 0;
          if (step.toColumn === 'call_booked') {
            newFlowIndex = 1;
          } else if (step.toColumn === 'bot_contact') {
            newFlowIndex = 0;
          }
          
          // Add notification
          const icons = [MessageSquare, CheckCircle2, Calendar, Bell, TrendingUp];
          const randomIcon = icons[Math.floor(Math.random() * icons.length)];
          
          setNotifications(prev => {
            const newNotif = {
              id: `notif-${Date.now()}`,
              message: step.notification,
              icon: randomIcon,
            };
            return [newNotif, ...prev.slice(0, 2)];
          });

          setStats(prev => ({
            ...prev,
            automatedActions: prev.automatedActions + 1,
            meetingsBooked: step.toColumn === 'call_booked' ? prev.meetingsBooked + 1 : prev.meetingsBooked,
          }));
        }
        
        return updatedCards;
      });

      setCurrentStep(prev => prev + 1);
    }, baseInterval);

    return () => clearTimeout(timeout);
  }, [isPlaying, currentStep, speed]);

  // Remove notifications after delay
  useEffect(() => {
    if (notifications.length === 0) return;

    const timeout = setTimeout(() => {
      setNotifications(prev => prev.slice(0, -1));
    }, 3000 / speed);

    return () => clearTimeout(timeout);
  }, [notifications, speed]);

  const handlePlayPause = () => {
    if (isComplete) {
      // Reset
      setCurrentStep(0);
      setIsComplete(false);
      setStats(prev => ({ ...prev, automatedActions: 0 }));
      setNotifications([]);
      setCards(initializeCards());
      setTimeout(() => setIsPlaying(true), 100);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsComplete(false);
    setStats(prev => ({ ...prev, automatedActions: 0 }));
    setNotifications([]);
    setCards(initializeCards());
    setTimeout(() => setIsPlaying(true), 100);
  };

  const getColumnCards = (columnId: string) => {
    return cards.filter(c => c.columnId === columnId);
  };

  return (
    <section id="pipeline" ref={ref} className="relative py-24 bg-[#0D0D0D] overflow-hidden">
      <div className="absolute inset-0 bg-noise" />
      
      {/* Gradient accents */}
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-white/3 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-[120px]" />

      <div className="relative z-10 container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={handlePlayPause}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0D0D0D]/80 border border-white/10 hover:bg-white/3 transition-all text-white font-medium"
            >
              {isComplete ? (
                <>
                  <RotateCcw className="w-4 h-4 text-white" />
                  <span className="text-sm">Reproducir de nuevo</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-4 h-4 text-white" />
                  <span className="text-sm">Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-white" />
                  <span className="text-sm">Reproducir</span>
                </>
              )}
            </button>
            {!isComplete && (
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0D0D0D]/80 border border-white/10 hover:bg-white/5 transition-all"
              >
                <RotateCcw className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0D0D0D]/80 border border-white/10">
              <span className="text-gray-400 text-xs">Velocidad</span>
              <input
                type="range"
                min="0.75"
                max="1.75"
                step="0.25"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-20 h-1 accent-cyan"
              />
              <span className="text-white text-xs font-mono">{speed}x</span>
            </div>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Tu pipeline{' '}
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              no debería quedarse quieto
            </span>
          </h2>
          <p className="text-lg text-gray-400 mb-6">
            Automatiza seguimiento, contacto y agendamiento 24/7 — sin perder oportunidades
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="px-4 py-2 rounded-lg bg-[#0D0D0D]/80 border border-white/10">
              <span className="text-xl font-bold font-mono-data text-white">{stats.totalLeads}</span>
              <span className="text-gray-400 text-xs ml-2">Leads</span>
            </div>
            <div className="px-4 py-2 rounded-lg bg-[#0D0D0D]/80 border border-cyan/20">
              <span className="text-xl font-bold font-mono-data text-electric">{stats.automatedActions}</span>
              <span className="text-gray-400 text-xs ml-2">Acciones</span>
            </div>
            <div className="px-4 py-2 rounded-lg bg-[#0D0D0D]/80 border border-green-400/20">
              <span className="text-xl font-bold font-mono-data text-green-400">{stats.meetingsBooked}</span>
              <span className="text-gray-400 text-xs ml-2">Citas</span>
            </div>
          </div>
        </motion.div>

        {/* Pipeline - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative"
        >
          {/* Floating notifications on left side */}
          <div className="absolute top-4 left-4 z-20 space-y-2 pointer-events-none">
            <AnimatePresence mode="popLayout">
              {notifications.map((notif, index) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -100, scale: 0.8 }}
                  animate={{ opacity: 1 - (index * 0.3), x: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.8 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-white/5 to-transparent border border-white/10/40 backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  <div className="w-6 h-6 rounded-full bg-white/5/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    <notif.icon className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-xs text-white font-medium whitespace-nowrap">{notif.message}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pipeline Board */}
          <div className="h-[520px] overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-cyan/20 scrollbar-track-transparent">
            <div className="inline-flex gap-3 h-full min-w-full">
              {COLUMNS.map((column) => (
                <div
                  key={column.id}
                  className="flex-1 min-w-[280px] flex flex-col"
                >
                  {/* Column header */}
                  <div className={`mb-3 p-3 rounded-lg bg-[#0D0D0D]/80 border ${column.colorClass} backdrop-blur-sm`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm">{column.title}</h3>
                      <div className={`px-2 py-1 rounded ${column.accentColor}/10 flex items-center justify-center`}>
                        <span className="text-xs font-mono-data text-gray-300">{cards.filter(c => c.columnId === column.id).length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan/20 scrollbar-track-transparent">
                    <AnimatePresence mode="popLayout">
                      {getColumnCards(column.id).map((card) => (
                        <motion.div
                          key={card.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8, x: -50 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.8, x: 50 }}
                          transition={{ duration: 0.5, ease: 'easeInOut' }}
                          className="group"
                        >
                          <div className="relative p-3 rounded-lg bg-[#0D0D0D]/80 border border-white/5 hover:border-cyan/30 backdrop-blur-sm transition-all duration-300">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-white text-xs mb-0.5 truncate">{card.fullName}</h4>
                                <p className="text-[10px] text-gray-500">{card.source}</p>
                              </div>
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white/5 to-amber-500/20 flex items-center justify-center flex-shrink-0 ml-2">
                                <span className="text-[10px] font-bold text-white">{card.ownerInitials}</span>
                              </div>
                            </div>

                            <div className="mb-2">
                              <div className="text-sm font-bold font-mono-data text-white">
                                ${card.value.toLocaleString()}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-2">
                              {card.tags.slice(0, 2).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-white/3 text-white border border-white/10 truncate"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{card.lastActivity}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
