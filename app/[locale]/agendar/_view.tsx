'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCalendar } from '@/components/ui/glass-calendar'
import { useLocale } from 'next-intl'

// ─── Static data ──────────────────────────────────────────────────────────────

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

const TIME_SLOTS = [
  { id: '9am',  label: '9:00 AM' },
  { id: '1pm',  label: '1:00 PM' },
  { id: '3pm',  label: '3:00 PM' },
  { id: '5pm',  label: '5:00 PM' },
]

const COUNTRY_CODES = [
  { code: '+1',   label: '+1 · US / Canada' },
  { code: '+52',  label: '+52 · Mexico' },
  { code: '+57',  label: '+57 · Colombia' },
  { code: '+54',  label: '+54 · Argentina' },
  { code: '+56',  label: '+56 · Chile' },
  { code: '+51',  label: '+51 · Peru' },
  { code: '+593', label: '+593 · Ecuador' },
  { code: '+58',  label: '+58 · Venezuela' },
  { code: '+507', label: '+507 · Panama' },
  { code: '+506', label: '+506 · Costa Rica' },
  { code: '+502', label: '+502 · Guatemala' },
  { code: '+503', label: '+503 · El Salvador' },
  { code: '+504', label: '+504 · Honduras' },
  { code: '+505', label: '+505 · Nicaragua' },
  { code: '+598', label: '+598 · Uruguay' },
  { code: '+591', label: '+591 · Bolivia' },
  { code: '+595', label: '+595 · Paraguay' },
  { code: '+34',  label: '+34 · Spain' },
  { code: '+55',  label: '+55 · Brazil' },
  { code: '+44',  label: '+44 · UK' },
]

const CONTENT = {
  es: {
    backToSite: 'Volver al sitio',
    eyebrow: 'Llamada Estratégica Gratuita',
    headline: 'Agende su llamada con el equipo.',
    subline: '30 minutos · Sin costo · Sin compromiso',
    stepLabels: ['Fecha y hora', 'Sus datos', 'Su negocio'],
    slotLocked: 'Horario reservado temporalmente',
    step0Heading: 'Seleccione una fecha',
    slotsFor: 'Horarios disponibles',
    unavailable: 'No disponible',
    step1Heading: 'Sus datos de contacto',
    firstName: 'Nombre',
    lastName: 'Apellido',
    phone: 'Teléfono',
    email: 'Correo electrónico',
    step2Heading: 'Un poco sobre su negocio',
    step2Sub: 'Esto nos ayuda a preparar la llamada para que sea lo más útil posible.',
    back: 'Volver',
    next: 'Continuar',
    submitting: 'Agendando…',
    submit: 'Agendar llamada',
    footer: '30 minutos · Sin costo · Puede cancelar en cualquier momento',
    errDate: 'Seleccione una fecha.',
    errTime: 'Seleccione un horario.',
    errFirstName: 'Ingrese su nombre.',
    errLastName: 'Ingrese su apellido.',
    errPhone: 'Ingrese su teléfono.',
    errEmail: 'Ingrese un correo válido.',
    errQuestion: 'Responda: ',
    errSlotTaken: 'Este horario ya no está disponible. Por favor elija otro.',
    errLockExpired: 'Su reserva temporal expiró. Por favor seleccione un nuevo horario.',
    errConflict: 'Este horario ya fue reservado. Por favor regrese y elija otro.',
    errGeneric: 'Ocurrió un error al agendar. Por favor inténtelo de nuevo.',
    DAYS: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    MONTHS: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    questions: [
      {
        id: 'size',
        question: '¿Cuántas personas trabajan en su empresa?',
        options: ['Solo yo (solopreneur)', '2 a 5 personas', '6 a 20 personas', '21 a 50 personas', 'Más de 50 personas'],
      },
      {
        id: 'revenue',
        question: '¿Cuál es el ingreso mensual aproximado de su negocio?',
        options: ['$7,500 – $15,000 USD', '$15,001 – $30,000 USD', '$30,001 – $60,000 USD', 'Más de $60,000 USD'],
      },
      {
        id: 'challenge',
        question: '¿Cuál es su mayor desafío operativo hoy?',
        options: ['Responder clientes a tiempo', 'Dar seguimiento a prospectos', 'Gestionar citas y agendas', 'Organizar procesos internos', 'Capturar y convertir más leads'],
      },
      {
        id: 'industry',
        question: '¿En qué industria opera su negocio?',
        options: ['Salud y bienestar', 'Servicios profesionales', 'Comercio y retail', 'Educación', 'Hostelería y turismo', 'Automotriz', 'Otro'],
      },
      {
        id: 'timeline',
        question: '¿En qué plazo le gustaría implementar una solución?',
        options: ['Lo antes posible (urgente)', 'En el próximo mes', 'En los próximos 3 meses', 'Solo estoy evaluando opciones'],
      },
    ],
  },
  en: {
    backToSite: 'Back to site',
    eyebrow: 'Free Strategy Call',
    headline: 'Book your call with our team.',
    subline: '30 minutes · No cost · No commitment',
    stepLabels: ['Date & time', 'Your info', 'Your business'],
    slotLocked: 'Time slot temporarily reserved',
    step0Heading: 'Select a date',
    slotsFor: 'Available times',
    unavailable: 'Unavailable',
    step1Heading: 'Your contact details',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone',
    email: 'Email address',
    step2Heading: 'A bit about your business',
    step2Sub: 'This helps us prepare so the call is as useful as possible.',
    back: 'Back',
    next: 'Continue',
    submitting: 'Booking…',
    submit: 'Book call',
    footer: '30 minutes · No cost · Cancel anytime',
    errDate: 'Please select a date.',
    errTime: 'Please select a time slot.',
    errFirstName: 'Please enter your first name.',
    errLastName: 'Please enter your last name.',
    errPhone: 'Please enter your phone number.',
    errEmail: 'Please enter a valid email address.',
    errQuestion: 'Please answer: ',
    errSlotTaken: 'This time slot is no longer available. Please choose another.',
    errLockExpired: 'Your temporary reservation expired. Please select a new time slot.',
    errConflict: 'This slot was just booked. Please go back and choose another.',
    errGeneric: 'Something went wrong. Please try again.',
    DAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    MONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    questions: [
      {
        id: 'size',
        question: 'How many people work at your company?',
        options: ['Just me (solopreneur)', '2 to 5 people', '6 to 20 people', '21 to 50 people', 'More than 50 people'],
      },
      {
        id: 'revenue',
        question: 'What is your approximate monthly revenue?',
        options: ['$7,500 – $15,000', '$15,001 – $30,000', '$30,001 – $60,000', 'Over $60,000'],
      },
      {
        id: 'challenge',
        question: 'What is your biggest operational challenge right now?',
        options: ['Responding to leads on time', 'Following up with prospects', 'Managing appointments', 'Organizing internal processes', 'Capturing and converting more leads'],
      },
      {
        id: 'industry',
        question: 'What industry is your business in?',
        options: ['Health & wellness', 'Professional services', 'Retail & e-commerce', 'Education', 'Hospitality & travel', 'Automotive', 'Other'],
      },
      {
        id: 'timeline',
        question: 'How soon would you like to implement a solution?',
        options: ['As soon as possible (urgent)', 'Within the next month', 'In the next 3 months', "I'm just exploring options"],
      },
    ],
  },
}

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

function OptionCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all duration-150 flex items-center gap-3 ${
        selected
          ? 'border-[#5bb6ff]/40 bg-[#5bb6ff]/10 text-white'
          : 'border-white/[0.07] bg-white/[0.02] text-white/50 hover:border-white/[0.14] hover:text-white/70'
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
          selected ? 'border-[#5bb6ff] bg-[#5bb6ff]' : 'border-white/[0.2] bg-transparent'
        }`}
      >
        {selected && <Check size={9} className="text-white" strokeWidth={3} />}
      </span>
      {label}
    </button>
  )
}

function StepIndicator({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                i < step
                  ? 'bg-[#5bb6ff] text-white'
                  : i === step
                  ? 'border-2 border-[#5bb6ff] text-[#5bb6ff] bg-transparent'
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
          {i < labels.length - 1 && (
            <div
              className={`h-px w-12 sm:w-20 mx-1 mb-4 transition-all duration-500 ${
                i < step ? 'bg-[#5bb6ff]/40' : 'bg-white/[0.07]'
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
  const locale = useLocale()
  const router = useRouter()
  const c = CONTENT[locale as 'es' | 'en'] ?? CONTENT.es

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
        setErrors([c.errLockExpired])
        setStep(0)
        setForm((f) => ({ ...f, selectedDate: null, selectedTime: null }))
        refreshSlots()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [lockExpiresAt, c.errLockExpired])

  const [form, setForm] = useState<FormData>({
    selectedDate: null,
    selectedTime: null,
    nombre: '',
    apellido: '',
    countryCode: '+1',
    telefono: '',
    email: '',
    answers: {},
  })

  function update(field: keyof FormData, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors([])
  }

  function setAnswer(questionId: string, value: string) {
    setForm((f) => ({ ...f, answers: { ...f.answers, [questionId]: value } }))
    setErrors([])
  }

  function validateStep(): string[] {
    const errs: string[] = []
    if (step === 0) {
      if (!form.selectedDate) errs.push(c.errDate)
      if (!form.selectedTime) errs.push(c.errTime)
    }
    if (step === 1) {
      if (!form.nombre.trim()) errs.push(c.errFirstName)
      if (!form.apellido.trim()) errs.push(c.errLastName)
      if (!form.telefono.trim()) errs.push(c.errPhone)
      if (!form.email.trim() || !form.email.includes('@')) errs.push(c.errEmail)
    }
    if (step === 2) {
      for (const q of c.questions) {
        if (!form.answers[q.id]) errs.push(`${c.errQuestion}"${q.question}"`)
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
          setErrors([data.error ?? c.errSlotTaken])
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
        setErrors([data.error ?? c.errConflict])
        setSubmitting(false)
        return
      }
      if (!res.ok) throw new Error()
    } catch {
      setErrors([c.errGeneric])
      setSubmitting(false)
      return
    }

    router.push(`/${locale}/confirmacion`)
  }

  return (
    <div className="min-h-screen bg-[#060607]">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(91,182,255,0.04),transparent)]" />

      {/* Top bar */}
      <header className="relative z-10 border-b border-white/[0.05] bg-[#060607]/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <a href={`/${locale}`} className="flex items-center gap-2">
            <Image src="/logo.png" alt="Bralto" width={80} height={24} className="h-6 w-auto object-contain" />
          </a>
          <a href={`/${locale}`} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
            <ChevronLeft size={13} />
            {c.backToSite}
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto max-w-3xl px-6 py-12">
        {/* Hero */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#5bb6ff]">
            {c.eyebrow}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
            {c.headline}
          </h1>
          <p className="text-sm text-white/35">{c.subline}</p>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center">
          <StepIndicator step={step} labels={c.stepLabels} />
        </div>

        {/* Countdown banner */}
        {step > 0 && lockExpiresAt !== null && (
          <div
            className={`mb-6 flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors duration-300 ${
              countdown < 60
                ? 'border-red-500/25 bg-red-500/5 text-red-400'
                : 'border-[#5bb6ff]/20 bg-[#5bb6ff]/5 text-[#5bb6ff]/80'
            }`}
          >
            <span>{c.slotLocked}</span>
            <span className="font-mono font-semibold tabular-nums">
              {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* ── Step 0: Date & time ─────────────────────────── */}
        {step === 0 && (
          <div>
            <h2 className="mb-5 text-lg font-semibold text-white">{c.step0Heading}</h2>

            <GlassCalendar
              selectedDate={form.selectedDate}
              onDateSelect={(date) => {
                update('selectedDate', date)
                update('selectedTime', null)
              }}
              selectableDates={availableDays}
              className="max-w-full"
            />

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
                    {c.slotsFor} —{' '}
                    <span className="text-[#5bb6ff]">
                      {c.DAYS[form.selectedDate.getDay()]}{' '}
                      {form.selectedDate.getDate()}{' '}
                      {c.MONTHS[form.selectedDate.getMonth()]}
                    </span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {TIME_SLOTS.map(({ id, label }) => {
                      const selected = form.selectedTime === id
                      const booked =
                        bookedSlots.has(slotKey(form.selectedDate!, id)) ||
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
                              ? 'border-[#5bb6ff]/40 bg-[#5bb6ff]/10 text-white'
                              : 'border-white/[0.07] bg-white/[0.02] text-white/50 hover:border-white/[0.14] hover:text-white/70'
                          }`}
                        >
                          {label}
                          {booked && (
                            <span className="block text-[9px] font-normal text-white/20 mt-0.5">
                              {c.unavailable}
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

        {/* ── Step 1: Contact info ─────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="mb-6 text-lg font-semibold text-white">{c.step1Heading}</h2>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/40">
                    {c.firstName} <span className="text-[#5bb6ff]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => update('nombre', e.target.value)}
                    placeholder="Alex"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-150 focus:border-[#5bb6ff]/40 focus:bg-[#5bb6ff]/5"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/40">
                    {c.lastName} <span className="text-[#5bb6ff]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.apellido}
                    onChange={(e) => update('apellido', e.target.value)}
                    placeholder="Johnson"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-150 focus:border-[#5bb6ff]/40 focus:bg-[#5bb6ff]/5"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/40">
                  {c.phone} <span className="text-[#5bb6ff]">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={form.countryCode}
                    onChange={(e) => update('countryCode', e.target.value)}
                    className="rounded-xl border border-white/[0.08] bg-[#111] px-3 py-3 text-sm text-white/70 outline-none transition-all duration-150 focus:border-[#5bb6ff]/40 shrink-0"
                  >
                    {COUNTRY_CODES.map(({ code, label }) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => update('telefono', e.target.value)}
                    placeholder="555 000 0000"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-150 focus:border-[#5bb6ff]/40 focus:bg-[#5bb6ff]/5"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/40">
                  {c.email} <span className="text-[#5bb6ff]">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-150 focus:border-[#5bb6ff]/40 focus:bg-[#5bb6ff]/5"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Your business ────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="mb-2 text-lg font-semibold text-white">{c.step2Heading}</h2>
            <p className="mb-8 text-sm text-white/35">{c.step2Sub}</p>

            <div className="flex flex-col gap-8">
              {c.questions.map((q) => (
                <div key={q.id}>
                  <p className="mb-3 text-sm font-semibold text-white/80">
                    {q.question}
                    <span className="ml-1 text-[#5bb6ff]">*</span>
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
              <p key={e} className="text-xs text-red-400">• {e}</p>
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
              {c.back}
            </button>
          ) : (
            <div />
          )}

          {step < 2 ? (
            <button
              onClick={next}
              className="flex items-center gap-2 rounded-xl bg-[#ffa845] px-6 py-3 text-sm font-semibold text-black hover:bg-[#f59e0b] transition-colors duration-150"
            >
              {c.next}
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-[#5bb6ff] px-6 py-3 text-sm font-semibold text-white hover:bg-[#7cc5ff] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? c.submitting : c.submit}
              {!submitting && <ArrowRight size={15} />}
            </button>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-white/20">{c.footer}</p>
      </main>
    </div>
  )
}
