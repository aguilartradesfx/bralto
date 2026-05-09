'use client'
import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LiquidMetalButtonProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

function MobileButton({
  children,
  href,
  onClick,
  className,
  size = 'md',
}: LiquidMetalButtonProps) {
  const sizeClasses = {
    sm: 'px-5 py-2.5 text-sm',
    md: 'px-7 py-3.5 text-base',
    lg: 'px-9 py-4 text-lg',
  }

  const inner = (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center font-semibold rounded-lg',
        'bg-[#ffa845] text-black tracking-tight',
        'shadow-[0_0_20px_rgba(255,168,69,0.3)]',
        'transition-shadow duration-300 hover:shadow-[0_0_32px_rgba(255,168,69,0.5)]',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </motion.button>
  )

  if (href) {
    return (
      <a href={href} className="inline-flex">
        {inner}
      </a>
    )
  }
  return inner
}

function DesktopButton({
  children,
  href,
  onClick,
  className,
  size = 'md',
}: LiquidMetalButtonProps) {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const sizeClasses = {
    sm: 'px-5 py-2.5 text-sm',
    md: 'px-7 py-3.5 text-base',
    lg: 'px-9 py-4 text-lg',
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  const inner = (
    <motion.button
      ref={buttonRef}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative inline-flex items-center justify-center font-semibold rounded-lg overflow-hidden',
        'text-white tracking-tight',
        sizeClasses[size],
        className
      )}
      style={{
        background: isHovered
          ? `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, #ffd085 0%, #ffa845 30%, #f59e0b 60%, #d97706 100%)`
          : 'linear-gradient(135deg, #f59e0b 0%, #ffa845 40%, #ffd085 70%, #ffa845 100%)',
        color: 'black',
        boxShadow: isHovered
          ? '0 0 40px rgba(255,168,69,0.5), 0 0 80px rgba(255,168,69,0.2), inset 0 1px 0 rgba(255,255,255,0.3)'
          : '0 0 20px rgba(255,168,69,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {/* Shimmer layer */}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
          animation: 'liquidShimmer 2.5s ease infinite',
          opacity: isHovered ? 1 : 0.5,
          transition: 'opacity 0.3s ease',
        }}
      />
      {/* Top highlight */}
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <span className="relative z-10">{children}</span>
    </motion.button>
  )

  if (href) {
    return (
      <a href={href} className="inline-flex">
        {inner}
      </a>
    )
  }
  return inner
}

export function LiquidMetalButton(props: LiquidMetalButtonProps) {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileButton {...props} />
  return <DesktopButton {...props} />
}
