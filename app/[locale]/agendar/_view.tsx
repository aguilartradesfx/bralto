'use client'

import { useState, useEffect, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { GlassCalendar } from '@/components/ui/glass-calendar'
import { Arrow, Check } from '@/components/home/icons'
import { PaymentForm, type PaymentLabels } from '@/components/payments/payment-form'
import { dialCodeOptions, guessDialCode, invalidContactFields, type ContactField } from '@/lib/diagnostic/contact'
import { bookableDays, costaRicaToday, localDate, slotKey } from '@/lib/diagnostic/days'
import { formatSlotDay, formatSlotTime, localSlotTime, slotStart, TIME_SLOT_IDS } from '@/lib/diagnostic/slots'
import type { ClientCheckout } from '@/lib/payments/types'
import { cn } from '@/lib/utils'
import './agendar.css'

// ─── Static data ──────────────────────────────────────────────────────────────

const CONTENT = {
  es: {
    backToSite: 'Volver al sitio',
    eyebrow: 'Diagnóstico de 30 minutos',
    headline: 'Agende su diagnóstico con el equipo.',
    subline: '30 minutos · $97 USD · Se descuenta del proyecto si decide contratar',
    stepLabels: ['Fecha y hora', 'Sus datos', 'Su negocio', 'Pago'],
    slotLocked: 'Horario reservado temporalmente',
    step0Heading: 'Seleccione una fecha',
    slotsFor: 'Horarios disponibles',
    unavailable: 'No disponible',
    step1Heading: 'Sus datos de contacto',
    firstName: 'Nombre',
    lastName: 'Apellido',
    phone: 'Teléfono',
    countryCode: 'Código de país',
    email: 'Correo electrónico',
    step2Heading: 'Un poco sobre su negocio',
    step2Sub: 'Esto nos ayuda a preparar la llamada para que sea lo más útil posible.',
    back: 'Volver',
    next: 'Continuar',
    submitting: 'Preparando el pago…',
    submit: 'Continuar al pago',
    footer: 'Pago seguro con Tilopay.',
    step3Heading: 'Pago seguro',
    step3Sub: 'Diagnóstico de 30 minutos · $97 USD',
    pay: {
      cardNumber: 'Número de tarjeta',
      cardExpiry: 'Vencimiento',
      cardExpiryPlaceholder: 'MM/AA',
      cardCvv: 'CVV',
      pay: 'Pagar $97 USD',
      paying: 'Procesando el pago…',
      loading: 'Preparando el formulario de pago…',
      back: 'Volver',
      testMode: 'Modo de pruebas: este pago no cobra dinero real.',
      blocked: (actual, expected) =>
        `El cobro está bloqueado: la pasarela está en modo ${actual === 'TEST' ? 'pruebas' : 'producción'} y este sitio espera ${expected === 'TEST' ? 'pruebas' : 'producción'}.`,
      loadError: 'No se pudo abrir el pago. Vuelva a intentarlo en unos minutos.',
      secureNote: 'Los datos de su tarjeta van directo a Tilopay: no pasan por nuestros servidores.',
    } satisfies PaymentLabels,
    summaryTitle: 'Diagnóstico de 30 minutos',
    summaryPrice: '$97 USD',
    summaryNote: 'En 30 minutos entendemos su negocio y le decimos por dónde empezar. Si decide avanzar, le descontamos los $97 completos del proyecto.',
    paymentCancelled: 'El pago no se completó y no se hizo ningún cobro. Su horario sigue reservado unos minutos por si quiere intentarlo de nuevo.',
    errDate: 'Seleccione una fecha.',
    errTime: 'Seleccione un horario.',
    errFirstName: 'Ingrese su nombre.',
    errLastName: 'Ingrese su apellido.',
    errPhone: 'Ingrese su teléfono sin el código de país, solo con números.',
    errEmail: 'Ingrese un correo válido.',
    errQuestion: 'Elija una opción.',
    errSlotTaken: 'Este horario ya no está disponible. Por favor elija otro.',
    errLockExpired: 'Su reserva temporal expiró. Por favor seleccione un nuevo horario.',
    errConflict: 'Este horario ya fue reservado. Por favor regrese y elija otro.',
    errGeneric: 'Ocurrió un error al agendar. Por favor inténtelo de nuevo.',
    zoneNote: 'Horas de Costa Rica (GMT-6).',
    zoneLocalNote: 'Debajo de cada una, la hora donde usted está.',
    localSuffix: 'en su zona',
    emailPlaceholder: 'nombre@empresa.com',
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
    eyebrow: '30-minute diagnostic call',
    headline: 'Book your diagnostic call with our team.',
    subline: '30 minutes · $97 USD · Deducted from the project if you hire us',
    stepLabels: ['Date & time', 'Your info', 'Your business', 'Payment'],
    slotLocked: 'Time slot temporarily reserved',
    step0Heading: 'Select a date',
    slotsFor: 'Available times',
    unavailable: 'Unavailable',
    step1Heading: 'Your contact details',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone',
    countryCode: 'Country code',
    email: 'Email address',
    step2Heading: 'A bit about your business',
    step2Sub: 'This helps us prepare so the call is as useful as possible.',
    back: 'Back',
    next: 'Continue',
    submitting: 'Preparing payment…',
    submit: 'Continue to payment',
    footer: 'Secure payment with Tilopay.',
    step3Heading: 'Secure payment',
    step3Sub: '30-minute diagnostic call · $97 USD',
    pay: {
      cardNumber: 'Card number',
      cardExpiry: 'Expiration',
      cardExpiryPlaceholder: 'MM/YY',
      cardCvv: 'CVV',
      pay: 'Pay $97 USD',
      paying: 'Processing payment…',
      loading: 'Loading the payment form…',
      back: 'Back',
      testMode: 'Test mode: this payment does not charge real money.',
      blocked: (actual, expected) =>
        `Payments are blocked: the gateway is in ${actual === 'TEST' ? 'test' : 'live'} mode and this site expects ${expected === 'TEST' ? 'test' : 'live'} mode.`,
      loadError: "We couldn't open the payment form. Please try again in a few minutes.",
      secureNote: 'Your card details go straight to Tilopay and never touch our servers.',
    } satisfies PaymentLabels,
    summaryTitle: '30-minute diagnostic call',
    summaryPrice: '$97 USD',
    summaryNote: 'In 30 minutes we understand your business and tell you where to start. If you move forward, we credit the full $97 toward your project.',
    paymentCancelled: "The payment wasn't completed and you were not charged. Your time slot stays reserved for a few minutes in case you want to try again.",
    errDate: 'Please select a date.',
    errTime: 'Please select a time slot.',
    errFirstName: 'Please enter your first name.',
    errLastName: 'Please enter your last name.',
    errPhone: 'Please enter your phone number without the country code, digits only.',
    errEmail: 'Please enter a valid email address.',
    errQuestion: 'Please choose an option.',
    errSlotTaken: 'This time slot is no longer available. Please choose another.',
    errLockExpired: 'Your temporary reservation expired. Please select a new time slot.',
    errConflict: 'This slot was just booked. Please go back and choose another.',
    errGeneric: 'Something went wrong. Please try again.',
    zoneNote: 'Costa Rica time (GMT-6).',
    zoneLocalNote: 'Under each one, the time where you are.',
    localSuffix: 'your time',
    emailPlaceholder: 'name@company.com',
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

const SESSION_KEY = 'bralto-agendar-session'

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

// Las respuestas viajan tal cual al CRM ("Facturación mensual - 2.0" en GoHighLevel), donde filtros
// y automatizaciones pueden depender del texto exacto: solo cambia cómo se muestran los rangos
function optionLabel(opt: string, lang: 'es' | 'en') {
  return opt.replace(/ – /g, lang === 'en' ? ' to ' : ' a ')
}

// Errores junto a cada campo o grupo: la fecha, el horario, cada dato de contacto y cada pregunta
type ErrorKey = 'date' | 'time' | ContactField | `q:${string}`
type FieldErrors = Partial<Record<ErrorKey, string>>

const FIELD_ID: Record<ContactField, string> = {
  nombre: 'bk-first',
  apellido: 'bk-last',
  telefono: 'bk-phone',
  email: 'bk-email',
}

// Errores que se van cuando cambia cada dato
const CLEARS: Partial<Record<keyof FormData, ErrorKey[]>> = {
  selectedDate: ['date', 'time'],
  selectedTime: ['time'],
  nombre: ['nombre'],
  apellido: ['apellido'],
  countryCode: ['telefono'],
  telefono: ['telefono'],
  email: ['email'],
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OptionCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={cn('bk-option', selected && 'is-selected')}>
      <span className="bk-option__dot" aria-hidden="true" />
      {label}
    </button>
  )
}

function StepIndicator({ step, labels }: { step: number; labels: string[] }) {
  return (
    <ol className="bk-steps">
      {labels.map((label, i) => (
        <li
          key={label}
          className={cn('bk-step', i < step && 'is-done', i === step && 'is-current')}
          aria-current={i === step ? 'step' : undefined}
        >
          <span className="bk-step__mark">{i < step ? <Check /> : i + 1}</span>
          <span className="bk-step__label">{label}</span>
        </li>
      ))}
    </ol>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AgendarPage() {
  const locale = useLocale()
  const c = CONTENT[locale as 'es' | 'en'] ?? CONTENT.es
  const lang = locale === 'en' ? 'en' : 'es'

  // Con la fecha de Costa Rica: el servidor (UTC) y el navegador marcan los mismos días
  const availableDays = bookableDays(Date.now()).map(localDate)
  const today = localDate(costaRicaToday(Date.now()))

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  // Lo que devuelve el servidor para el formulario de la pasarela (token del SDK, nunca credenciales)
  const [checkout, setCheckout] = useState<ClientCheckout | null>(null)
  // Errores junto a cada campo y, aparte, los que devuelve el servidor
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set())
  const [lockedSlots, setLockedSlots] = useState<Set<string>>(new Set())
  // Curated slots that are actually free in GHL. `null` = couldn't check
  // (GHL down) → don't restrict, show all curated slots as before.
  const [ghlAvailable, setGhlAvailable] = useState<Set<string> | null>(null)

  // Se guarda en sessionStorage: si cancela el pago y vuelve, el horario retenido sigue siendo suyo
  const [sessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (saved) return saved
    } catch {}
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    try {
      sessionStorage.setItem(SESSION_KEY, id)
    } catch {}
    return id
  })
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('pago') === 'cancelado') setNotice(c.paymentCancelled)
  }, [c.paymentCancelled])

  // Zona de quien agenda: solo la sabe el navegador. Con ella, cada horario muestra también su hora
  const [visitorZone, setVisitorZone] = useState<string | undefined>(undefined)
  useEffect(() => {
    try {
      setVisitorZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    } catch {}
  }, [])

  const countryOptions = useMemo(() => dialCodeOptions(lang), [lang])

  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(0)

  function refreshSlots() {
    fetch(`/api/bookings?session=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data) => {
        setBookedSlots(new Set(data.booked ?? []))
        setLockedSlots(new Set(data.locked ?? []))
        setGhlAvailable(Array.isArray(data.ghlAvailable) ? new Set(data.ghlAvailable) : null)
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
        setCheckout(null)
        setFieldErrors({})
        setFormError(c.errLockExpired)
        setStep(0)
        setForm((f) => ({ ...f, selectedDate: null, selectedTime: null }))
        refreshSlots()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [lockExpiresAt, c.errLockExpired])

  const [form, setForm] = useState<FormData>(() => ({
    selectedDate: null,
    selectedTime: null,
    nombre: '',
    apellido: '',
    // El país que dicen el idioma o la zona del navegador (el selector recién aparece en el paso 2)
    countryCode: guessDialCode({
      languages: typeof window === 'undefined' ? [] : navigator.languages,
      timeZone: typeof window === 'undefined' ? undefined : Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: lang,
    }),
    telefono: '',
    email: '',
    answers: {},
  }))

  function clearErrors(keys: ErrorKey[]) {
    setFormError(null)
    setFieldErrors((current) => {
      if (!keys.some((key) => key in current)) return current
      const next = { ...current }
      for (const key of keys) delete next[key]
      return next
    })
  }

  function update(field: keyof FormData, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }))
    clearErrors(CLEARS[field] ?? [])
  }

  function setAnswer(questionId: string, value: string) {
    setForm((f) => ({ ...f, answers: { ...f.answers, [questionId]: value } }))
    clearErrors([`q:${questionId}`])
  }

  function validateStep(): FieldErrors {
    if (step === 0) {
      if (!form.selectedDate) return { date: c.errDate }
      if (!form.selectedTime) return { time: c.errTime }
    }
    if (step === 1) {
      const messages: Record<ContactField, string> = {
        nombre: c.errFirstName,
        apellido: c.errLastName,
        telefono: c.errPhone,
        email: c.errEmail,
      }
      return Object.fromEntries(invalidContactFields(form).map((field) => [field, messages[field]]))
    }
    if (step === 2) {
      return Object.fromEntries(c.questions.filter((q) => !form.answers[q.id]).map((q) => [`q:${q.id}`, c.errQuestion]))
    }
    return {}
  }

  // Muestra los errores y lleva el foco al primero: el lector de pantalla lo lee junto a su mensaje
  function reportErrors(errors: FieldErrors): boolean {
    setFieldErrors(errors)
    setFormError(null)
    const first = Object.keys(errors)[0] as ErrorKey | undefined
    if (!first) return false
    const selector =
      first === 'date'
        ? '.bk-day.is-available'
        : first === 'time'
          ? '.bk-slot:not(:disabled)'
          : first.startsWith('q:')
            ? `#bk-q-${first.slice(2)}-options button`
            : `#${FIELD_ID[first as ContactField]}`
    requestAnimationFrame(() => document.querySelector<HTMLElement>(selector)?.focus())
    return true
  }

  async function next() {
    if (reportErrors(validateStep())) return

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
          setFormError(data.error ?? c.errSlotTaken)
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
    setFieldErrors({})
    setFormError(null)
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
    if (reportErrors(validateStep())) return
    setSubmitting(true)

    const key = slotKey(form.selectedDate!, form.selectedTime!)
    try {
      const res = await fetch('/api/diagnostic/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot: key,
          sessionId,
          nombre: form.nombre,
          apellido: form.apellido,
          countryCode: form.countryCode,
          telefono: form.telefono,
          email: form.email,
          answers: form.answers,
          locale,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { checkout?: ClientCheckout; holdExpiresAt?: number }
      if (res.status === 409) {
        setFormError(c.errConflict)
        setSubmitting(false)
        return
      }
      if (!res.ok || !data.checkout) throw new Error()
      setCheckout(data.checkout)
      // El horario queda retenido mientras paga
      if (data.holdExpiresAt) {
        setLockExpiresAt(data.holdExpiresAt)
        setCountdown(Math.floor((data.holdExpiresAt - Date.now()) / 1000))
      }
      setSubmitting(false)
      setStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setFormError(c.errGeneric)
      setSubmitting(false)
    }
  }

  // Horarios del día elegido: la hora de Costa Rica y, si es otra, la de quien agenda
  const slots = form.selectedDate
    ? TIME_SLOT_IDS.map((id) => {
        const key = slotKey(form.selectedDate!, id)
        const start = slotStart(key)
        return {
          id,
          label: formatSlotTime(start, lang),
          local: localSlotTime(start, lang, visitorZone),
          booked: bookedSlots.has(key) || lockedSlots.has(key) || (ghlAvailable !== null && !ghlAvailable.has(key)),
        }
      })
    : []

  return (
    <main className="bk" data-focus-page>
      <div className="hm-wrap bk__wrap">
        <header className="bk__head">
          <p className="hm-eyebrow">{c.eyebrow}</p>
          <h1 className="bk__title">{c.headline}</h1>
          <p className="bk__sub">{c.subline}</p>
        </header>

        {notice && (
          <p className="bk-notice" role="status">
            {notice}
          </p>
        )}

        <StepIndicator step={step} labels={c.stepLabels} />

        {/* Horario retenido mientras completa los datos */}
        {step > 0 && lockExpiresAt !== null && (
          <div className={cn('bk-hold', countdown < 60 && 'is-ending')}>
            <span>{c.slotLocked}</span>
            <span className="bk-hold__time">
              {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </span>
          </div>
        )}

        <section className="bk-panel hm-glass hm-glass--thick" aria-labelledby="bk-step-title">
          {/* ── Paso 0: fecha y hora ── */}
          {step === 0 && (
            <>
              <h2 id="bk-step-title" className="bk-h2">
                {c.step0Heading}
              </h2>

              <GlassCalendar
                locale={locale === 'en' ? 'en' : 'es'}
                selectedDate={form.selectedDate}
                onDateSelect={(date) => {
                  update('selectedDate', date)
                  update('selectedTime', null)
                }}
                selectableDates={availableDays}
                today={today}
              />

              {fieldErrors.date && (
                <p className="bk-field__error" role="alert">
                  {fieldErrors.date}
                </p>
              )}

              {form.selectedDate && (
                <div key={form.selectedDate.toDateString()} className="bk-slots-wrap">
                  <h3 className="bk-h3">
                    {c.slotsFor}: <span>{formatSlotDay(form.selectedDate, lang)}</span>
                  </h3>
                  <p className="bk-zone">
                    {c.zoneNote}
                    {slots.some((slot) => slot.local) && ` ${c.zoneLocalNote}`}
                  </p>
                  <div className="bk-slots">
                    {slots.map((slot) => {
                      const selected = form.selectedTime === slot.id
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={slot.booked}
                          aria-pressed={selected}
                          onClick={() => !slot.booked && update('selectedTime', slot.id)}
                          className={cn('bk-slot', selected && 'is-selected')}
                        >
                          {slot.label}
                          {slot.booked ? (
                            <small>{c.unavailable}</small>
                          ) : (
                            slot.local && (
                              <small>
                                {slot.local} {c.localSuffix}
                              </small>
                            )
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {fieldErrors.time && (
                    <p className="bk-field__error" role="alert">
                      {fieldErrors.time}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Paso 1: datos de contacto ── */}
          {step === 1 && (
            <>
              <h2 id="bk-step-title" className="bk-h2">
                {c.step1Heading}
              </h2>

              <div className="bk-fields">
                <div className="bk-row">
                  <div className="bk-field">
                    <label htmlFor="bk-first">
                      {c.firstName}
                      <span className="bk-req" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="bk-first"
                      className="bk-input"
                      type="text"
                      autoComplete="given-name"
                      required
                      aria-invalid={fieldErrors.nombre ? true : undefined}
                      aria-describedby={fieldErrors.nombre ? 'bk-first-error' : undefined}
                      value={form.nombre}
                      onChange={(e) => update('nombre', e.target.value)}
                    />
                    {fieldErrors.nombre && (
                      <p id="bk-first-error" className="bk-field__error">
                        {fieldErrors.nombre}
                      </p>
                    )}
                  </div>
                  <div className="bk-field">
                    <label htmlFor="bk-last">
                      {c.lastName}
                      <span className="bk-req" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="bk-last"
                      className="bk-input"
                      type="text"
                      autoComplete="family-name"
                      required
                      aria-invalid={fieldErrors.apellido ? true : undefined}
                      aria-describedby={fieldErrors.apellido ? 'bk-last-error' : undefined}
                      value={form.apellido}
                      onChange={(e) => update('apellido', e.target.value)}
                    />
                    {fieldErrors.apellido && (
                      <p id="bk-last-error" className="bk-field__error">
                        {fieldErrors.apellido}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bk-field">
                  <label htmlFor="bk-phone">
                    {c.phone}
                    <span className="bk-req" aria-hidden="true">*</span>
                  </label>
                  <div className="bk-phone">
                    <select
                      className="bk-input"
                      aria-label={c.countryCode}
                      value={form.countryCode}
                      onChange={(e) => update('countryCode', e.target.value)}
                    >
                      {countryOptions.map(({ code, label }) => (
                        <option key={code} value={code}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <input
                      id="bk-phone"
                      className="bk-input"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      required
                      aria-invalid={fieldErrors.telefono ? true : undefined}
                      aria-describedby={fieldErrors.telefono ? 'bk-phone-error' : undefined}
                      value={form.telefono}
                      onChange={(e) => update('telefono', e.target.value)}
                    />
                  </div>
                  {fieldErrors.telefono && (
                    <p id="bk-phone-error" className="bk-field__error">
                      {fieldErrors.telefono}
                    </p>
                  )}
                </div>

                <div className="bk-field">
                  <label htmlFor="bk-email">
                    {c.email}
                    <span className="bk-req" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="bk-email"
                    className="bk-input"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    aria-invalid={fieldErrors.email ? true : undefined}
                    aria-describedby={fieldErrors.email ? 'bk-email-error' : undefined}
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder={c.emailPlaceholder}
                  />
                  {fieldErrors.email && (
                    <p id="bk-email-error" className="bk-field__error">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Paso 2: su negocio y resumen del cobro ── */}
          {step === 2 && (
            <>
              <h2 id="bk-step-title" className="bk-h2">
                {c.step2Heading}
              </h2>
              <p className="bk-lead">{c.step2Sub}</p>

              <div className="bk-questions">
                {c.questions.map((q) => {
                  const error = fieldErrors[`q:${q.id}`]
                  return (
                    <div
                      key={q.id}
                      className="bk-q"
                      role="group"
                      aria-labelledby={`bk-q-${q.id}`}
                      aria-describedby={error ? `bk-q-${q.id}-error` : undefined}
                    >
                      <p id={`bk-q-${q.id}`}>
                        {q.question}
                        <span className="bk-req" aria-hidden="true">*</span>
                      </p>
                      <div id={`bk-q-${q.id}-options`} className="bk-options">
                        {q.options.map((opt) => (
                          <OptionCard
                            key={opt}
                            label={optionLabel(opt, lang)}
                            selected={form.answers[q.id] === opt}
                            onClick={() => setAnswer(q.id, opt)}
                          />
                        ))}
                      </div>
                      {error && (
                        <p id={`bk-q-${q.id}-error`} className="bk-field__error">
                          {error}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="bk-summary">
                <div className="bk-summary__row">
                  <p>{c.summaryTitle}</p>
                  <p className="bk-summary__price">{c.summaryPrice}</p>
                </div>
                <p className="bk-summary__note">{c.summaryNote}</p>
              </div>
            </>
          )}

          {/* ── Paso 3: pago (formulario de la pasarela activa) ── */}
          {step === 3 && checkout && (
            <>
              <h2 id="bk-step-title" className="bk-h2">
                {c.step3Heading}
              </h2>
              <p className="bk-lead">{c.step3Sub}</p>
              <PaymentForm
                checkout={checkout}
                labels={c.pay}
                onBack={() => {
                  setCheckout(null)
                  setFieldErrors({})
                  setFormError(null)
                  setStep(2)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            </>
          )}

          {/* Errores del servidor (horario tomado, reserva vencida…); los de cada campo van junto a él */}
          {step < 3 && formError && (
            <div className="bk-errors" role="alert">
              <p>{formError}</p>
            </div>
          )}

          {step < 3 && (
            <div className="bk-nav">
              {step > 0 ? (
                <button type="button" onClick={back} className="hm-btn hm-btn--glass hm-glass">
                  <Arrow />
                  {c.back}
                </button>
              ) : (
                <span />
              )}

              {step < 2 ? (
                <button type="button" onClick={next} className="hm-btn hm-btn--solid">
                  {c.next}
                  <Arrow />
                </button>
              ) : (
                <button type="button" onClick={submit} disabled={submitting} className="hm-btn hm-btn--solid">
                  {submitting ? c.submitting : c.submit}
                  {!submitting && <Arrow />}
                </button>
              )}
            </div>
          )}
        </section>

        <p className="bk-foot">{c.footer}</p>
      </div>
    </main>
  )
}
