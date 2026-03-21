'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plane, Printer, UtensilsCrossed, Stethoscope, PawPrint, Car,
  ChevronLeft, ChevronRight, Check, ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Typewriter } from '@/components/ui/typewriter'

const CTA_PHRASES = [
  'Tu competencia posiblemente está considerando algo como esto.',
  'En este juego, gana el que se mueve primero.',
  'Mientras lees esto, alguien más ya está automatizando.',
  'El que automatiza primero, captura el mercado.',
  'Cada día sin automatizar es una ventaja que le regalas a tu competencia.',
]

const SLIDE_DURATION = 6000
const TICK = 50

interface SlideData {
  industry: string
  label: string
  accent: string
  isCta?: boolean
  problem?: string
  deliverables?: string[]
  result?: string
  Icon?: LucideIcon
  automation?: string[]
  stats?: { value: string; label: string }[]
}

const slides: SlideData[] = [
  {
    industry: 'Agencia de Viajes',
    label: 'Turismo & Reservas',
    problem: 'Perdían leads porque respondían tarde o fuera de horario. Los clientes consultaban de noche y amanecían con la competencia.',
    deliverables: [
      'Sitio web con motor de reservas en línea',
      'Sistema de agendamiento de llamadas con el equipo de ventas',
      'Plataforma de administración de tours con interfaz propia',
      'Automatización de seguimiento post-reserva',
    ],
    result: 'Triplicaron las consultas convertidas en el primer mes.',
    accent: '#F97316',
    Icon: Plane,
    automation: ['Respuesta inmediata 24/7', 'Cotizador automático', 'Agenda con asesor'],
    stats: [
      { value: '3×', label: 'Conversiones' },
      { value: '< 2 min', label: 'Tiempo de respuesta' },
    ],
  },
  {
    industry: 'Imprenta',
    label: 'Producción & Pedidos',
    problem: 'El equipo pasaba horas cotizando trabajos manualmente por WhatsApp. Cada cotización requería ir y venir con el cliente para definir especificaciones.',
    deliverables: [
      'Cotizador automático por material, tamaño y acabado',
      'Sistema de seguimiento de pedidos en tiempo real',
      'Notificaciones automáticas de estado de producción',
      'Panel de gestión de clientes y pedidos recurrentes',
    ],
    result: 'Redujeron el tiempo de cotización de 2 horas a menos de 4 minutos.',
    accent: '#3B82F6',
    Icon: Printer,
    automation: ['Cotizador inteligente', 'Estado de pedidos', 'Notificaciones automáticas'],
    stats: [
      { value: '96%', label: 'Menos tiempo cotizando' },
      { value: '0', label: 'Errores de pedido' },
    ],
  },
  {
    industry: 'Restaurante',
    label: 'Reservas & Fidelización',
    problem: 'Las reservas llegaban dispersas por WhatsApp, teléfono e Instagram. Sin seguimiento, los no-shows eran moneda corriente y las mesas se perdían.',
    deliverables: [
      'Agente de reservas multicanal (WhatsApp, Instagram, web)',
      'Confirmaciones y recordatorios automáticos de reserva',
      'Reactivación automática de clientes inactivos con ofertas',
      'Panel de gestión de mesas y disponibilidad en tiempo real',
    ],
    result: 'Eliminaron los no-shows y llenaron el 95% de las mesas cada noche.',
    accent: '#10B981',
    Icon: UtensilsCrossed,
    automation: ['Reservas multicanal', 'Recordatorios de cita', 'Reactivación de clientes'],
    stats: [
      { value: '100%', label: 'Reducción no-shows' },
      { value: '2.4×', label: 'Más reservas' },
    ],
  },
  {
    industry: 'Clínica Dental',
    label: 'Salud & Citas Médicas',
    problem: 'La recepcionista no daba abasto con llamadas y mensajes para agendar, reagendar y confirmar citas. Horas perdidas en tareas repetitivas.',
    deliverables: [
      'Agente de agendamiento 24/7 por WhatsApp',
      'Recordatorios automáticos de cita y pre-consulta',
      'Seguimiento post-consulta y limpieza semestral',
      'Panel de historial y gestión de pacientes',
    ],
    result: 'El equipo de recepción recuperó 3 horas diarias para la experiencia del paciente.',
    accent: '#8B5CF6',
    Icon: Stethoscope,
    automation: ['Agendamiento 24/7', 'Recordatorios de cita', 'Seguimiento post-consulta'],
    stats: [
      { value: '68%', label: 'Menos llamadas manuales' },
      { value: '4.9★', label: 'Satisfacción' },
    ],
  },
  {
    industry: 'Veterinaria',
    label: 'Salud Animal & Control',
    problem: 'Los dueños de mascotas olvidaban las vacunas y controles anuales. La clínica perdía ingresos recurrentes sin una forma de recordarles proactivamente.',
    deliverables: [
      'Recordatorios personalizados por nombre de mascota y vacuna',
      'Agendamiento express desde WhatsApp sin llamar',
      'Historial digital de cada mascota y sus tratamientos',
      'Alertas automáticas de próximos controles anuales',
    ],
    result: 'Aumentaron las visitas de control un 40% en los primeros 60 días.',
    accent: '#EC4899',
    Icon: PawPrint,
    automation: ['Recordatorios por mascota', 'Agendamiento express', 'Historial digital'],
    stats: [
      { value: '+40%', label: 'Más visitas de control' },
      { value: '60 días', label: 'Para ver resultados' },
    ],
  },
  {
    industry: 'Agencia de Autos',
    label: 'Ventas & Seguimiento',
    problem: 'Los vendedores perdían el hilo con decenas de prospectos simultáneos. Sin seguimiento consistente, los leads fríos se perdían antes de madurar.',
    deliverables: [
      'CRM automático con seguimiento por etapa de compra',
      'Reactivación de leads inactivos con mensajes personalizados',
      'Recordatorios automáticos de test drive y citas de cierre',
      'Pipeline de ventas visible en tiempo real para todo el equipo',
    ],
    result: 'Cerraron 30% más ventas sin contratar un solo vendedor adicional.',
    accent: '#F59E0B',
    Icon: Car,
    automation: ['CRM automático', 'Seguimiento por etapa', 'Reactivación de leads'],
    stats: [
      { value: '+30%', label: 'Más ventas cerradas' },
      { value: '0', label: 'Prospectos perdidos' },
    ],
  },
  {
    industry: '¿Y su negocio?',
    label: '+50 casos reales',
    accent: '#F97316',
    isCta: true,
  },
]

const contentVariants = {
  enter: (dir: string) => ({ opacity: 0, y: dir === 'next' ? 20 : -20 }),
  center: { opacity: 1, y: 0 },
  exit: (dir: string) => ({ opacity: 0, y: dir === 'next' ? -20 : 20 }),
}

export function RobotSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const goToSlide = useCallback(
    (index: number, dir: 'next' | 'prev' = 'next') => {
      if (index === currentIndex) return
      setDirection(dir)
      setCurrentIndex(index)
    },
    [currentIndex],
  )

  const goNext = useCallback(() => {
    goToSlide((currentIndex + 1) % slides.length, 'next')
  }, [currentIndex, goToSlide])

  const goPrev = useCallback(() => {
    goToSlide((currentIndex - 1 + slides.length) % slides.length, 'prev')
  }, [currentIndex, goToSlide])

  useEffect(() => {
    setProgress(0)
  }, [currentIndex])

  useEffect(() => {
    if (isPaused) return
    let elapsed = 0
    const timer = setInterval(() => {
      elapsed += TICK
      setProgress(Math.min((elapsed / SLIDE_DURATION) * 100, 100))
      if (elapsed >= SLIDE_DURATION) {
        clearInterval(timer)
        setDirection('next')
        setCurrentIndex((prev) => (prev + 1) % slides.length)
      }
    }, TICK)
    return () => clearInterval(timer)
  }, [currentIndex, isPaused])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 60) diff > 0 ? goNext() : goPrev()
  }

  const current = slides[currentIndex]

  return (
    <section id="casos-reales" className="relative py-20 bg-[#080808]">

      {/* Header — constrained width */}
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-4"
          >
            Servicio Integral
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white"
          >
            Cada negocio es diferente.
            <br />
            <span className="text-white/40">Cada solución también.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18 }}
            className="mt-4 text-sm text-white/35 leading-relaxed"
          >
            Estos son ejemplos reales de lo que hemos construido.
          </motion.p>
        </div>
      </div>

      {/* Carousel — wider container */}
      <div className="mx-auto max-w-[1556px] px-6">

        {/* Carousel wrapper — external arrows on desktop */}
        <div className="relative lg:px-14">

          {/* Prev arrow */}
          <button
            onClick={goPrev}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full border border-white/[0.12] bg-[#111] text-white/50 hover:border-white/30 hover:text-white hover:bg-[#181818] transition-all duration-200"
            aria-label="Anterior"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Next arrow */}
          <button
            onClick={goNext}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full border border-white/[0.12] bg-[#111] text-white/50 hover:border-white/30 hover:text-white hover:bg-[#181818] transition-all duration-200"
            aria-label="Siguiente"
          >
            <ChevronRight size={18} />
          </button>

          {/* Carousel card */}
          <div
            className="relative rounded-2xl border border-white/[0.07] bg-[#0e0e0e] overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Dynamic background wash */}
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-700"
              style={{
                background: `radial-gradient(ellipse at 85% 50%, ${current.accent}10 0%, transparent 60%)`,
              }}
            />

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px]" style={{ minHeight: 570 }}>

              {/* Left: text */}
              <div className="relative overflow-hidden p-10 md:p-12 lg:p-16 flex flex-col">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={contentVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="flex flex-col h-full"
                  >
                    {/* Slide counter + label */}
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-xs font-mono text-white/20">
                        {String(currentIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                      </span>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 py-0.5 rounded-full border"
                        style={{
                          color: current.accent,
                          borderColor: `${current.accent}30`,
                          background: `${current.accent}10`,
                        }}
                      >
                        {current.label}
                      </span>
                    </div>

                    {/* Industry — large */}
                    <h3 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
                      {current.industry}
                    </h3>

                    {current.isCta ? (
                      /* ── CTA slide content ── */
                      <>
                        <p className="text-base text-white/50 leading-relaxed mb-4 flex-1">
                          Hemos automatizado más de 50 tipos de negocios distintos — desde hoteles hasta ferreterías.
                          Si tiene una operación que depende de personas, hay algo que podemos construir para usted.
                        </p>
                        <p className="text-sm text-white/30 leading-relaxed mb-10">
                          Cada sistema es completamente a la medida. Sin plantillas, sin soluciones genéricas.
                        </p>
                        <a
                          href="/agendar"
                          className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl font-semibold text-white text-base transition-all duration-200 w-fit"
                          style={{ background: '#F97316' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#ea6a0e')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#F97316')}
                        >
                          Agendar una llamada
                          <ArrowRight size={18} />
                        </a>
                      </>
                    ) : (
                      /* ── Regular slide content ── */
                      <>
                        {/* Problem */}
                        <div className="mb-7">
                          <p
                            className="text-xs font-bold uppercase tracking-[0.18em] mb-3 flex items-center gap-2"
                            style={{ color: current.accent }}
                          >
                            <span className="h-px w-5 inline-block shrink-0" style={{ background: current.accent }} />
                            El problema
                          </p>
                          <p className="text-base text-white/50 leading-relaxed">
                            {current.problem}
                          </p>
                        </div>

                        {/* Deliverables checklist */}
                        <div className="mb-8 flex-1">
                          <p
                            className="text-xs font-bold uppercase tracking-[0.18em] mb-4 flex items-center gap-2"
                            style={{ color: current.accent }}
                          >
                            <span className="h-px w-5 inline-block shrink-0" style={{ background: current.accent }} />
                            Lo que construimos
                          </p>
                          <ul className="flex flex-col gap-3.5">
                            {current.deliverables?.map((item) => (
                              <li key={item} className="flex items-start gap-3.5">
                                <span
                                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                                  style={{ background: `${current.accent}18` }}
                                >
                                  <Check size={11} style={{ color: current.accent }} />
                                </span>
                                <span className="text-base text-white/65 leading-snug">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Result */}
                        <div
                          className="px-5 py-4 rounded-lg border text-base text-white/55 leading-relaxed"
                          style={{
                            borderColor: `${current.accent}20`,
                            background: `${current.accent}07`,
                          }}
                        >
                          <span className="font-semibold mr-1" style={{ color: current.accent }}>✓</span>
                          {current.result}
                        </div>
                      </>
                    )}

                    {/* Mobile nav arrows */}
                    <div className="flex gap-2 mt-6 lg:hidden">
                      <button
                        onClick={goPrev}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/70 transition-all duration-200"
                        aria-label="Anterior"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={goNext}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/70 transition-all duration-200"
                        aria-label="Siguiente"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right: visual */}
              <div className="relative hidden lg:flex flex-col items-center justify-center p-14 border-l border-white/[0.06]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="flex flex-col items-center w-full"
                  >
                    {/* Decorative corners */}
                    <div
                      className="absolute top-5 left-5 w-7 h-7 border-t border-l"
                      style={{ borderColor: `${current.accent}35` }}
                    />
                    <div
                      className="absolute bottom-5 right-5 w-7 h-7 border-b border-r"
                      style={{ borderColor: `${current.accent}35` }}
                    />

                    {current.isCta ? (
                      /* ── CTA right panel ── */
                      <div className="flex flex-col items-center w-full">
                        <div className="text-center mb-8">
                          <div className="text-6xl font-black mb-2" style={{ color: '#F97316' }}>+50</div>
                          <div className="text-sm text-white/35 uppercase tracking-widest">industrias automatizadas</div>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {[
                            'Hoteles', 'Gimnasios', 'Abogados', 'Escuelas',
                            'Ferreterías', 'Inmobiliarias', 'Salones de Belleza',
                            'Contadores', 'Farmacias', 'Tiendas Online',
                            'Talleres', 'Aseguradoras',
                          ].map((ind) => (
                            <span
                              key={ind}
                              className="text-xs px-3 py-1.5 rounded-full border border-white/[0.08] text-white/35 bg-white/[0.02]"
                            >
                              {ind}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* ── Regular right panel ── */
                      <>
                        {/* Icon with glow */}
                        <div className="relative mb-7">
                          <div
                            className="absolute inset-0 rounded-full blur-3xl scale-150"
                            style={{ background: `${current.accent}18` }}
                          />
                          <div
                            className="relative flex items-center justify-center w-32 h-32 rounded-2xl border"
                            style={{
                              borderColor: `${current.accent}30`,
                              background: `${current.accent}10`,
                            }}
                          >
                            {current.Icon && <current.Icon size={56} style={{ color: current.accent }} />}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-12 mb-8">
                          {current.stats?.map((s) => (
                            <div key={s.label} className="text-center">
                              <div
                                className="text-3xl font-bold mb-1.5"
                                style={{ color: current.accent }}
                              >
                                {s.value}
                              </div>
                              <div className="text-sm text-white/35">{s.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Automation tags */}
                        <div className="flex flex-col gap-2 w-full">
                          {current.automation?.map((a) => (
                            <div
                              key={a}
                              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/55"
                              style={{ background: `${current.accent}08` }}
                            >
                              <div
                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ background: current.accent }}
                              />
                              {a}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

            </div>

            {/* Progress bar */}
            <div className="flex border-t border-white/[0.05]">
              {slides.map((slide, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i, i > currentIndex ? 'next' : 'prev')}
                  className="flex-1 flex flex-col gap-1.5 px-2 pt-3 pb-2.5 hover:bg-white/[0.02] transition-colors text-left"
                  aria-label={`Ir a ${slide.industry}`}
                >
                  <div className="h-0.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-none"
                      style={{
                        width:
                          i === currentIndex
                            ? `${progress}%`
                            : i < currentIndex
                            ? '100%'
                            : '0%',
                        background: i <= currentIndex ? current.accent : undefined,
                      }}
                    />
                  </div>
                  <span
                    className="text-[9px] font-medium truncate transition-colors duration-300 hidden sm:block"
                    style={{
                      color:
                        i === currentIndex
                          ? current.accent
                          : i < currentIndex
                          ? 'rgba(255,255,255,0.20)'
                          : 'rgba(255,255,255,0.15)',
                    }}
                  >
                    {slide.industry}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>{/* end carousel wrapper */}

      </div>{/* end wider container */}

      {/* Typewriter strip */}
      <div className="mx-auto max-w-4xl px-6 mt-16 text-center">
        <div className="text-2xl md:text-3xl font-bold tracking-tight text-white min-h-[2em]">
          <Typewriter
            text={CTA_PHRASES}
            speed={38}
            deleteSpeed={18}
            waitTime={3800}
            cursorChar="_"
            cursorClassName="ml-1 text-[#F97316]"
          />
        </div>
      </div>

    </section>
  )
}
