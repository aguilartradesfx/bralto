'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { GodRays } from '@paper-design/shaders-react'
import { GlassCalendar } from '@/components/ui/glass-calendar'

// ─── Config ──────────────────────────────────────────────────────────────────

function getAvailableDays(): Date[] {
  const days: Date[] = []
  const today = new Date()
  let offset = 1
  while (days.length < 5) {
    const d = new Date(today)
    d.setDate(today.getDate() + offset)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) days.push(d)
    offset++
  }
  return days
}

function slotKey(date: Date, timeId: string): string {
  return `${date.toISOString().slice(0, 10)}-${timeId}`
}

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const TIME_SLOTS = [
  { id: '9am',  label: '9:00 AM' },
  { id: '1pm',  label: '1:00 PM' },
  { id: '3pm',  label: '3:00 PM' },
  { id: '5pm',  label: '5:00 PM' },
]

const COUNTRY_CODES = [
  { code: '+1',   label: '+1 · EE.UU. / Canadá' },
  { code: '+52',  label: '+52 · México' },
  { code: '+57',  label: '+57 · Colombia' },
  { code: '+54',  label: '+54 · Argentina' },
  { code: '+56',  label: '+56 · Chile' },
  { code: '+51',  label: '+51 · Perú' },
  { code: '+593', label: '+593 · Ecuador' },
  { code: '+58',  label: '+58 · Venezuela' },
  { code: '+507', label: '+507 · Panamá' },
  { code: '+506', label: '+506 · Costa Rica' },
  { code: '+502', label: '+502 · Guatemala' },
  { code: '+503', label: '+503 · El Salvador' },
  { code: '+504', label: '+504 · Honduras' },
  { code: '+505', label: '+505 · Nicaragua' },
  { code: '+598', label: '+598 · Uruguay' },
  { code: '+591', label: '+591 · Bolivia' },
  { code: '+595', label: '+595 · Paraguay' },
  { code: '+34',  label: '+34 · España' },
  { code: '+55',  label: '+55 · Brasil' },
  { code: '+1-809', label: '+1-809 · R. Dominicana' },
]

const QUESTIONS = [
  {
    id: 'size',
    question: '¿Cuántas personas trabajan en su empresa?',
    options: [
      'Solo yo (solopreneur)',
      '2 a 5 personas',
      '6 a 20 personas',
      '21 a 50 personas',
      'Más de 50 personas',
    ],
  },
  {
    id: 'revenue',
    question: '¿Cuál es el ingreso mensual aproximado de su negocio?',
    options: [
      '$7,500 – $15,000 USD',
      '$15,001 – $30,000 USD',
      '$30,001 – $60,000 USD',
      'Más de $60,000 USD',
    ],
  },
  {
    id: 'challenge',
    question: '¿Cuál es su mayor desafío operativo hoy?',
    options: [
      'Responder clientes a tiempo',
      'Dar seguimiento a prospectos',
      'Gestionar citas y agendas',
      'Organizar procesos internos',
      'Capturar y convertir más leads',
    ],
  },
  {
    id: 'industry',
    question: '¿En qué industria opera su negocio?',
    options: [
      'Salud y bienestar',
      'Servicios profesionales',
      'Comercio y retail',
      'Educación',
      'Hostelería y turismo',
      'Automotriz',
      'Otro',
    ],
  },
  {
    id: 'timeline',
    question: '¿En qué plazo le gustaría implementar una solución?',
    options: [
      'Lo antes posible (urgente)',
      'En el próximo mes',
      'En los próximos 3 meses',
      'Solo estoy evaluando opciones',
    ],
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  selectedDate: Date | null
  selectedTime: string | null
  nombre: string
  apellido: string
  countryCode: string
  telefono: string
  email: string
  answers: Record<string, string>
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OptionCard({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all duration-150 flex items-center gap-3 ${
        selected
          ? 'border-[#F97316]/40 bg-[#F97316]/10 text-white'
          : 'border-white/[0.07] bg-white/[0.02] text-white/50 hover:border-white/[0.14] hover:text-white/70'
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
          selected
            ? 'border-[#F97316] bg-[#F97316]'
            : 'border-white/[0.2] bg-transparent'
        }`}
      >
        {selected && <Check size={9} className="text-white" strokeWidth={3} />}
      </span>
      {label}
    </button>
  )
}

function StepIndicator({ step }: { step: number }) {
  const steps = ['Fecha y hora', 'Sus datos', 'Su negocio']
  return (
    <div className="flex items-center gap-0 mb-10">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                i < step
                  ? 'bg-[#F97316] text-white'
                  : i === step
                  ? 'border-2 border-[#F97316] text-[#F97316] bg-transparent'
                  : 'border border-white/[0.1] text-white/20 bg-transparent'
              }`}
            >
              {i < step ? <Check size={12} strokeWidth={3} /> : i + 1}
            </div>
            <span
              className={`text-[10px] font-medium whitespace-nowrap hidden sm:block ${
                i === step ? 'text-white/60' : 'text-white/20'
              }`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-12 sm:w-20 mx-1 mb-4 transition-all duration-500 ${
                i < step ? 'bg-[#F97316]/40' : 'bg-white/[0.07]'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AgendarPage() {
  const router = useRouter()
  const availableDays = getAvailableDays()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set())
  const [lockedSlots, setLockedSlots] = useState<Set<string>>(new Set())

  const [sessionId] = useState<string>(() =>
    typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36),
  )

  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(0)

  function refreshSlots() {
    fetch('/api/bookings')
      .then((r) => r.json())
      .then((data) => {
        setBookedSlots(new Set(data.booked ?? []))
        setLockedSlots(new Set(data.locked ?? []))
      })
      .catch(() => {})
  }

  useEffect(() => { refreshSlots() }, [])

  useEffect(() => {
    if (!lockExpiresAt) return
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((lockExpiresAt - Date.now()) / 1000))
      setCountdown(remaining)
      if (remaining === 0) {
        clearInterval(interval)
        setLockExpiresAt(null)
        setErrors(['Su reserva temporal expiró. Por favor seleccione un nuevo horario.'])
        setStep(0)
        setForm((f) => ({ ...f, selectedDate: null, selectedTime: null }))
        refreshSlots()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [lockExpiresAt])

  const [form, setForm] = useState<FormData>({
    selectedDate: null,
    selectedTime: null,
    nombre: '',
    apellido: '',
    countryCode: '+52',
    telefono: '',
    email: '',
    answers: {},
  })

  function update(field: keyof FormData, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors([])
  }

  function setAnswer(questionId: string, value: string) {
    setForm((f) => ({
      ...f,
      answers: { ...f.answers, [questionId]: value },
    }))
    setErrors([])
  }

  function validateStep(): string[] {
    const errs: string[] = []
    if (step === 0) {
      if (!form.selectedDate) errs.push('Seleccione una fecha.')
      if (!form.selectedTime) errs.push('Seleccione un horario.')
    }
    if (step === 1) {
      if (!form.nombre.trim()) errs.push('Ingrese su nombre.')
      if (!form.apellido.trim()) errs.push('Ingrese su apellido.')
      if (!form.telefono.trim()) errs.push('Ingrese su teléfono.')
      if (!form.email.trim() || !form.email.includes('@'))
        errs.push('Ingrese un correo válido.')
    }
    if (step === 2) {
      for (const q of QUESTIONS) {
        if (!form.answers[q.id]) errs.push(`Responda: "${q.question}"`)
      }
    }
    return errs
  }

  async function next() {
    const errs = validateStep()
    if (errs.length) { setErrors(errs); return }
    setErrors([])

    if (step === 0) {
      const key = slotKey(form.selectedDate!, form.selectedTime!)
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'lock', slot: key, sessionId }),
        })
        const data = await res.json()
        if (!res.ok) {
          setErrors([data.error ?? 'Este horario ya no está disponible. Por favor elija otro.'])
          refreshSlots()
          return
        }
        setLockExpiresAt(data.expiresAt)
        setCountdown(Math.floor((data.expiresAt - Date.now()) / 1000))
      } catch {
        // Network error — proceed optimistically
      }
    }

    setStep((s) => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function back() {
    setErrors([])

    if (step === 1 && form.selectedDate && form.selectedTime) {
      const key = slotKey(form.selectedDate, form.selectedTime)
      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlock', slot: key, sessionId }),
      }).catch(() => {})
      setLockExpiresAt(null)
      setCountdown(0)
      refreshSlots()
    }

    setStep((s) => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit() {
    const errs = validateStep()
    if (errs.length) { setErrors(errs); return }
    setSubmitting(true)

    const key = slotKey(form.selectedDate!, form.selectedTime!)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          slot: key,
          sessionId,
          nombre: form.nombre,
          apellido: form.apellido,
          countryCode: form.countryCode,
          telefono: form.telefono,
          email: form.email,
          answers: form.answers,
        }),
      })
      if (res.status === 409) {
        const data = await res.json()
        setErrors([data.error ?? 'Este horario ya fue reservado. Por favor regrese y elija otro.'])
        setSubmitting(false)
        return
      }
      if (!res.ok) throw new Error()
    } catch {
      setErrors(['Ocurrió un error al agendar. Por favor inténtelo de nuevo.'])
      setSubmitting(false)
      return
    }

    router.push('/confirmacion')
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Hero background — same GodRays as home */}
      <GodRays
        colorBack="#00000000"
        colors={['#a1a1aa40', '#e4e4e740', '#71717a40', '#52525b40']}
        colorBloom="#a1a1aa"
        offsetX={0.85}
        offsetY={-1}
        intensity={0.45}
        spotty={0.45}
        midSize={10}
        midIntensity={0}
        density={0.38}
        bloom={0.3}
        speed={0.4}
        scale={1.6}
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
      />

      {/* Top bar */}
      <header className="relative z-10 border-b border-white/[0.05] bg-[#080808]/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Bralto"
              width={80}
              height={24}
              className="h-6 w-auto object-contain"
            />
          </a>
          <a
            href="/"
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <ChevronLeft size={13} />
            Volver al sitio
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto max-w-3xl px-6 py-12">
        {/* Hero */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316]">
            Llamada Estratégica Gratuita
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
            Agende su llamada con el equipo.
          </h1>
          <p className="text-sm text-white/35">
            30 minutos · Sin costo · Sin compromiso
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center">
          <StepIndicator step={step} />
        </div>

        {/* Countdown banner */}
        {step > 0 && lockExpiresAt !== null && (
          <div
            className={`mb-6 flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors duration-300 ${
              countdown < 60
                ? 'border-red-500/25 bg-red-500/5 text-red-400'
                : 'border-[#F97316]/20 bg-[#F97316]/5 text-[#F97316]/80'
            }`}
          >
            <span>Horario reservado temporalmente</span>
            <span className="font-mono font-semibold tabular-nums">
              {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* ── Step 0: Fecha y hora ─────────────────────────── */}
        {step === 0 && (
          <div>
            <h2 className="mb-5 text-lg font-semibold text-white">Seleccione una fecha</h2>

            <GlassCalendar
              selectedDate={form.selectedDate}
              onDateSelect={(date) => {
                update('selectedDate', date)
                // Clear time if different date
                update('selectedTime', null)
              }}
              selectableDates={availableDays}
              className="max-w-full"
            />

            {/* Time slots — animate in when a date is selected */}
            <AnimatePresence>
              {form.selectedDate && (
                <motion.div
                  key="time-slots"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="mt-6"
                >
                  <h2 className="mb-4 text-base font-semibold text-white">
                    Horarios disponibles —{' '}
                    <span className="text-[#F97316]">
                      {DAYS_ES[form.selectedDate.getDay()]}{' '}
                      {form.selectedDate.getDate()} de{' '}
                      {MONTHS_ES[form.selectedDate.getMonth()]}
                    </span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {TIME_SLOTS.map(({ id, label }) => {
                      const selected = form.selectedTime === id
                      const booked = bookedSlots.has(slotKey(form.selectedDate!, id)) ||
                        lockedSlots.has(slotKey(form.selectedDate!, id))
                      return (
                        <button
                          key={id}
                          disabled={booked}
                          onClick={() => !booked && update('selectedTime', id)}
                          className={`relative rounded-xl border py-3.5 text-sm font-semibold transition-all duration-150 ${
                            booked
                              ? 'border-white/[0.04] bg-white/[0.01] text-white/20 cursor-not-allowed'
                              : selected
                              ? 'border-[#F97316]/40 bg-[#F97316]/10 text-white'
                              : 'border-white/[0.07] bg-white/[0.02] text-white/50 hover:border-white/[0.14] hover:text-white/70'
                          }`}
                        >
                          {label}
                          {booked && (
                            <span className="block text-[9px] font-normal text-white/20 mt-0.5">
                              No disponible
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Step 1: Datos de contacto ────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="mb-6 text-lg font-semibold text-white">Sus datos de contacto</h2>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/40">
                    Nombre <span className="text-[#F97316]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => update('nombre', e.target.value)}
                    placeholder="Alejandro"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-150 focus:border-[#F97316]/40 focus:bg-[#F97316]/5"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/40">
                    Apellido <span className="text-[#F97316]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.apellido}
                    onChange={(e) => update('apellido', e.target.value)}
                    placeholder="García"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-150 focus:border-[#F97316]/40 focus:bg-[#F97316]/5"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/40">
                  Teléfono <span className="text-[#F97316]">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={form.countryCode}
                    onChange={(e) => update('countryCode', e.target.value)}
                    className="rounded-xl border border-white/[0.08] bg-[#111] px-3 py-3 text-sm text-white/70 outline-none transition-all duration-150 focus:border-[#F97316]/40 shrink-0"
                  >
                    {COUNTRY_CODES.map(({ code, label }) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => update('telefono', e.target.value)}
                    placeholder="55 1234 5678"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-150 focus:border-[#F97316]/40 focus:bg-[#F97316]/5"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/40">
                  Correo electrónico <span className="text-[#F97316]">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="alejandro@empresa.com"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-150 focus:border-[#F97316]/40 focus:bg-[#F97316]/5"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Su negocio ───────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="mb-2 text-lg font-semibold text-white">Un poco sobre su negocio</h2>
            <p className="mb-8 text-sm text-white/35">
              Esto nos ayuda a preparar la llamada para que sea lo más útil posible.
            </p>

            <div className="flex flex-col gap-8">
              {QUESTIONS.map((q) => (
                <div key={q.id}>
                  <p className="mb-3 text-sm font-semibold text-white/80">
                    {q.question}
                    <span className="ml-1 text-[#F97316]">*</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt) => (
                      <OptionCard
                        key={opt}
                        label={opt}
                        selected={form.answers[q.id] === opt}
                        onClick={() => setAnswer(q.id, opt)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            {errors.map((e) => (
              <p key={e} className="text-xs text-red-400">
                • {e}
              </p>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={back}
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-5 py-3 text-sm font-medium text-white/40 hover:border-white/20 hover:text-white/70 transition-all duration-150"
            >
              <ChevronLeft size={15} />
              Volver
            </button>
          ) : (
            <div />
          )}

          {step < 2 ? (
            <button
              onClick={next}
              className="flex items-center gap-2 rounded-xl bg-[#F97316] px-6 py-3 text-sm font-semibold text-white hover:bg-[#ea6c0c] transition-colors duration-150"
            >
              Continuar
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-[#F97316] px-6 py-3 text-sm font-semibold text-white hover:bg-[#ea6c0c] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Agendando…' : 'Agendar llamada'}
              {!submitting && <ArrowRight size={15} />}
            </button>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-white/20">
          30 minutos · Sin costo · Puede cancelar en cualquier momento
        </p>
      </main>
    </div>
  )
}
