'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GodRays } from '@paper-design/shaders-react'
import { Typewriter } from '@/components/ui/typewriter'
import { SplineScene } from '@/components/ui/spline-scene'

const ACTION_WORDS = ['ventas', 'seguimientos', 'reservas', 'respuestas', 'citas', 'procesos']

const SUBTITLE_TEXTS = [
  'para que su negocio nunca pare.',
  'sin perder una sola oportunidad.',
  'mientras usted duerme.',
  'las 24 horas del día.',
  'con cero intervención humana.',
  'sin depender de su equipo.',
]

function Word({
  text,
  delay,
  className = '',
}: {
  text: string
  delay: number
  className?: string
}) {
  return (
    <>
      <span className={`word ${className}`.trim()} data-delay={delay}>
        {text}
      </span>
      {' '}
    </>
  )
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const [actionIndex, setActionIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const words = sectionRef.current?.querySelectorAll<HTMLElement>('.word')
    words?.forEach((word) => {
      const delay = parseInt(word.getAttribute('data-delay') || '0', 10)
      setTimeout(() => {
        word.style.animation = 'word-appear 0.8s ease-out forwards'
      }, delay)
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setActionIndex((prev) => (prev + 1) % ACTION_WORDS.length)
      }, 3000)
      return () => clearInterval(interval)
    }, 1100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="relative overflow-hidden bg-[#080808]"
      style={{ minHeight: '90vh' }}
    >
      {/* Background */}
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
        speed={isMobile ? 0 : 0.4}
        scale={1.6}
        minPixelRatio={isMobile ? 1 : undefined}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />

      {/* Split layout */}
      <div className="relative z-10 flex flex-col md:flex-row h-[90vh] md:min-h-[90vh] md:h-auto">

        {/* Left: text */}
        <div className="flex flex-col justify-center flex-1 px-8 pt-5 pb-0 md:pl-24 md:pr-8 md:py-20 gap-2 md:gap-12">

          {/* Top tagline */}
          <div>
            <p className="text-xs md:text-sm font-mono font-light uppercase tracking-[0.2em] text-white/50 text-center md:text-left">
              <Word text="Infraestructura" delay={0} />
              <Word text="de" delay={150} />
              <Word text="Operaciones" delay={300} />
              <Word text="Digitales" delay={450} />
            </p>
            <div
              className="mt-2 md:mt-4 w-16 h-px mx-auto md:ml-0"
              style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)' }}
            />
          </div>

          {/* Main headline */}
          <div>
            <h1
              className="font-semibold leading-tight tracking-tighter"
              style={{ fontFamily: "'Hubot Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
            >
              {/* Line 1 — static */}
              <div
                className="hero-headline text-white text-center md:text-left"
              >
                <Word text="Automatizamos" delay={800} />
                <Word text="sus" delay={950} />
              </div>

              {/* Line 2 — animated action word */}
              <div
                className="hero-headline relative overflow-hidden text-[#F97316] mb-3 md:mb-5"
                style={{ height: '1.3em' }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={actionIndex}
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: '0%' }}
                    exit={{ opacity: 0, y: '-100%' }}
                    transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                    style={{ display: 'block' }}
                    className="text-center md:text-left"
                  >
                    {ACTION_WORDS[actionIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Line 3 — benefit Typewriter */}
              <div className="text-white/40 font-thin text-center md:text-left" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 3.5rem)' }}>
                <Typewriter
                  text={SUBTITLE_TEXTS}
                  speed={45}
                  deleteSpeed={22}
                  waitTime={4000}
                  initialDelay={1500}
                  cursorChar="_"
                  cursorClassName="ml-0.5 text-[#F97316]"
                  className="font-thin"
                  stableSize
                />
              </div>
            </h1>
          </div>

          {/* Bottom — canales integrados */}
          <div>
            <div
              className="mb-4 w-16 h-px mx-auto md:ml-0"
              style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)' }}
            />
            <p className="text-xs font-mono font-light uppercase tracking-[0.2em] text-white/35 text-center md:text-left">
              <Word text="WhatsApp" delay={4200} />
              <Word text="·" delay={4350} />
              <Word text="Instagram" delay={4500} />
              <Word text="·" delay={4650} />
              <Word text="Email" delay={4800} />
              <Word text="·" delay={4950} />
              <Word text="Web" delay={5100} />
              <Word text="·" delay={5250} />
              <Word text="y más" delay={5400} />
            </p>
          </div>

        </div>

        {/* Right: robot */}
        <div className="relative flex-shrink-0 w-full md:w-[46%] h-[50vh] md:h-auto">
          <div
            className="absolute inset-0"
            style={{ transform: 'scale(1.45) translateY(8%)', transformOrigin: 'center center' }}
          >
            {/* Skip 3D scene on mobile — heaviest GPU consumer */}
            {!isMobile && (
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            )}
          </div>
        </div>

      </div>
    </section>
  )
}
