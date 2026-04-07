'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, animate, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, ArrowUpRight } from 'lucide-react'

export interface ClientProject {
  id: string
  name: string
  industry: string
  tagline: string
  story: string
  deliverables: string[]
  coverImage: string
  images: string[]
}

function ClientModal({ client, onClose }: { client: ClientProject; onClose: () => void }) {
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handler) }
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full md:max-w-5xl max-h-[95vh] md:max-h-[88vh] bg-[#0e0e0e] rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-white/[0.06] shrink-0">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-0.5">{client.industry}</p>
              <h2 className="text-xl font-bold text-white">{client.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X size={16} className="text-white/60" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-full">

              {/* Left: gallery */}
              <div className="relative bg-[#0a0a0a]">
                <div className="relative aspect-video md:aspect-auto md:h-72 overflow-hidden">
                  <Image
                    src={client.images[activeImg]}
                    alt={`${client.name} mockup ${activeImg + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {/* Nav arrows */}
                  {client.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImg(i => (i - 1 + client.images.length) % client.images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur hover:bg-black/80 transition-colors"
                      >
                        <ChevronLeft size={15} className="text-white" />
                      </button>
                      <button
                        onClick={() => setActiveImg(i => (i + 1) % client.images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur hover:bg-black/80 transition-colors"
                      >
                        <ChevronRight size={15} className="text-white" />
                      </button>
                    </>
                  )}
                  {/* Counter */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-[10px] font-semibold text-white/60">
                    {activeImg + 1} / {client.images.length}
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="flex gap-2 p-4 overflow-x-auto scrollbar-none">
                  {client.images.map((src, i) => (
                    <button
                      key={src}
                      onClick={() => setActiveImg(i)}
                      className={`relative shrink-0 w-16 h-10 rounded-lg overflow-hidden transition-all ${
                        activeImg === i ? 'ring-2 ring-[#F97316] opacity-100' : 'opacity-40 hover:opacity-70'
                      }`}
                    >
                      <Image src={src} alt="" fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: story */}
              <div className="px-6 md:px-8 py-6 flex flex-col gap-6">
                <p className="text-sm text-white/50 leading-relaxed">{client.story}</p>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25 mb-3">Qué construimos</p>
                  <ul className="space-y-2">
                    {client.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2.5 text-sm text-white/60">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-[#F97316] shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export function ClientCardsSlider({ clients }: { clients: ClientProject[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragWidth, setDragWidth] = useState(0)
  const [activeClient, setActiveClient] = useState<ClientProject | null>(null)
  const x = useMotionValue(0)

  useEffect(() => {
    const calc = () => {
      if (containerRef.current) {
        setDragWidth(containerRef.current.scrollWidth - containerRef.current.offsetWidth)
      }
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    const w = containerRef.current?.offsetWidth || 0
    const next = Math.max(Math.min(x.get() + (dir === 'left' ? w * 0.7 : -w * 0.7), 0), -dragWidth)
    animate(x, next, { type: 'spring', stiffness: 300, damping: 30 })
  }

  return (
    <>
      {activeClient && <ClientModal client={activeClient} onClose={() => setActiveClient(null)} />}

      <div className="relative group/slider w-full">
        {/* Arrow left */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-20 h-11 w-11 rounded-full bg-[#0e0e0e] border border-white/10 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 hover:border-[#F97316]/40 transition-all shadow-xl"
        >
          <ChevronLeft size={16} className="text-white/60" />
        </button>
        {/* Arrow right */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-20 h-11 w-11 rounded-full bg-[#0e0e0e] border border-white/10 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 hover:border-[#F97316]/40 transition-all shadow-xl"
        >
          <ChevronRight size={16} className="text-white/60" />
        </button>

        <motion.div
          ref={containerRef}
          className="cursor-grab active:cursor-grabbing overflow-hidden"
          whileTap={{ cursor: 'grabbing' }}
        >
          <motion.div
            drag="x"
            dragConstraints={{ right: 0, left: -dragWidth }}
            dragElastic={0.08}
            style={{ x }}
            className="flex gap-5 py-2"
          >
            {clients.map((client) => (
              <motion.div
                key={client.id}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                onClick={() => setActiveClient(client)}
                className="min-w-[300px] max-w-[300px] cursor-pointer group/card"
              >
                {/* Cover image — no box, just the image with overlay */}
                <div className="relative h-[200px] rounded-2xl overflow-hidden mb-4">
                  <Image
                    src={client.coverImage}
                    alt={client.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                    sizes="300px"
                    draggable={false}
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* Industry tag */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur text-[10px] font-semibold text-white/70 uppercase tracking-wider">
                      {client.industry}
                    </span>
                  </div>

                  {/* View arrow */}
                  <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <ArrowUpRight size={13} className="text-white" />
                  </div>
                </div>

                {/* Text — clean, no box */}
                <div className="px-1">
                  <h3 className="text-base font-bold text-white mb-1 group-hover/card:text-[#F97316] transition-colors">
                    {client.name}
                  </h3>
                  <p className="text-sm text-white/40 leading-snug line-clamp-2">{client.tagline}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
