'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, animate, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react'

export interface ClientProject {
  id: string
  name: string
  industry: string
  tagline: string
  story: string
  deliverables: string[]
  coverImage: string
  images: string[]
  url?: string
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function ClientModal({ client, onClose }: { client: ClientProject; onClose: () => void }) {
  const [idx, setIdx] = useState(0)

  const prev = useCallback(() => setIdx(i => (i - 1 + client.images.length) % client.images.length), [client.images.length])
  const next = useCallback(() => setIdx(i => (i + 1) % client.images.length), [client.images.length])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [onClose, prev, next])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-2xl" />

      {/* Modal — 80% screen */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        onClick={e => e.stopPropagation()}
        className="relative z-10 w-full max-w-[90vw] md:max-w-[80vw] h-[85vh] md:h-[80vh] flex flex-col rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(12,12,12,0.85)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 40px 120px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* ── Image area — takes ~65% of modal height ── */}
        <div className="relative flex-1 bg-[#f0f0f0] overflow-hidden">
          {/* Image — object-contain so it's NEVER cropped */}
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex items-center justify-center p-4 md:p-8"
            >
              <div className="relative w-full h-full">
                <Image
                  src={client.images[idx]}
                  alt={`${client.name} — imagen ${idx + 1}`}
                  fill
                  className="object-contain"
                  sizes="80vw"
                  priority={idx === 0}
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Subtle vignette on sides */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#f0f0f0]/60 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#f0f0f0]/60 to-transparent pointer-events-none" />

          {/* Nav arrows */}
          {client.images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <ChevronLeft size={18} className="text-white" />
              </button>
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <ChevronRight size={18} className="text-white" />
              </button>
            </>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <X size={15} className="text-white/70" />
          </button>

          {/* Counter dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {client.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === idx ? 20 : 6,
                  height: 6,
                  background: i === idx ? '#F97316' : 'rgba(255,255,255,0.25)',
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Text area — bottom glass panel ── */}
        <div
          className="shrink-0 overflow-y-auto"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="px-6 md:px-10 py-6 md:py-7">
            <div className="flex items-start justify-between gap-6 mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#F97316] mb-1">{client.industry}</p>
                <h3 className="text-2xl md:text-3xl font-bold text-white">{client.name}</h3>
              </div>
              {client.url && (
                <a
                  href={client.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 shrink-0 text-xs font-medium text-[#F97316] hover:text-[#fb923c] transition-colors mt-1"
                >
                  Ver sitio <ArrowUpRight size={13} />
                </a>
              )}
            </div>

            <p className="text-sm text-white/50 leading-relaxed mb-5 max-w-2xl">{client.story}</p>

            <div className="flex flex-wrap gap-2">
              {client.deliverables.map(d => (
                <span
                  key={d}
                  className="text-xs text-white/50 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Cards Slider ──────────────────────────────────────────────────────────────
export function ClientCardsSlider({ clients }: { clients: ClientProject[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragWidth, setDragWidth] = useState(0)
  const [active, setActive] = useState<ClientProject | null>(null)
  const x = useMotionValue(0)

  useEffect(() => {
    const calc = () => {
      if (containerRef.current)
        setDragWidth(Math.max(0, containerRef.current.scrollWidth - containerRef.current.offsetWidth))
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  const scroll = (dir: 'l' | 'r') => {
    const w = containerRef.current?.offsetWidth || 0
    animate(x, Math.max(Math.min(x.get() + (dir === 'l' ? w * 0.6 : -w * 0.6), 0), -dragWidth), {
      type: 'spring', stiffness: 300, damping: 30,
    })
  }

  return (
    <>
      <AnimatePresence>{active && <ClientModal client={active} onClose={() => setActive(null)} />}</AnimatePresence>

      <div className="relative group/s">
        {/* Arrows */}
        <button onClick={() => scroll('l')} className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full flex items-center justify-center opacity-0 group-hover/s:opacity-100 transition-all shadow-2xl" style={{ background: 'rgba(20,20,20,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronLeft size={16} className="text-white/70" />
        </button>
        <button onClick={() => scroll('r')} className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full flex items-center justify-center opacity-0 group-hover/s:opacity-100 transition-all shadow-2xl" style={{ background: 'rgba(20,20,20,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronRight size={16} className="text-white/70" />
        </button>

        <motion.div ref={containerRef} className="overflow-hidden cursor-grab active:cursor-grabbing">
          <motion.div
            drag="x"
            dragConstraints={{ right: 0, left: -dragWidth }}
            dragElastic={0.06}
            style={{ x }}
            className="flex gap-6 py-3"
          >
            {clients.map(client => (
              <motion.div
                key={client.id}
                whileHover={{ y: -8, transition: { duration: 0.3, ease: 'easeOut' } }}
                onClick={() => setActive(client)}
                className="relative min-w-[320px] max-w-[320px] rounded-2xl overflow-hidden cursor-pointer group/card select-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                }}
              >
                {/* Image */}
                <div className="relative h-[210px] overflow-hidden bg-[#0a0a0a]">
                  <Image
                    src={client.coverImage}
                    alt={client.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover/card:scale-[1.04]"
                    sizes="320px"
                    draggable={false}
                  />
                  {/* Gradient bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Open indicator */}
                  <div
                    className="absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-300"
                    style={{ background: 'rgba(249,115,22,0.9)', backdropFilter: 'blur(8px)' }}
                  >
                    <ArrowUpRight size={13} className="text-white" />
                  </div>
                </div>

                {/* Info */}
                <div className="px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F97316]/70 mb-1.5">{client.industry}</p>
                  <h3 className="text-base font-bold text-white mb-1.5 group-hover/card:text-white transition-colors">{client.name}</h3>
                  <p className="text-xs text-white/35 leading-relaxed line-clamp-2">{client.tagline}</p>
                </div>

                {/* Bottom shimmer on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover/card:opacity-100 transition-opacity" style={{ background: 'linear-gradient(to right, transparent, rgba(249,115,22,0.4), transparent)' }} />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
