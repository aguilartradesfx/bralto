'use client'

import { useEffect, useRef, useState, useMemo } from "react"
import { motion, Variants, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

interface TypewriterProps {
  text: string | string[]
  speed?: number
  initialDelay?: number
  waitTime?: number
  deleteSpeed?: number
  loop?: boolean
  className?: string
  showCursor?: boolean
  hideCursorOnType?: boolean
  cursorChar?: string | React.ReactNode
  cursorAnimationVariants?: {
    initial: Variants["initial"]
    animate: Variants["animate"]
  }
  cursorClassName?: string
  /** Reserves stable container dimensions so the parent never shifts as text changes */
  stableSize?: boolean
}

const Typewriter = ({
  text,
  speed = 50,
  initialDelay = 0,
  waitTime = 2000,
  deleteSpeed = 30,
  loop = true,
  className,
  showCursor = true,
  hideCursorOnType = false,
  cursorChar = "|",
  cursorClassName = "ml-1",
  stableSize = false,
  cursorAnimationVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.01,
        repeat: Infinity,
        repeatDelay: 0.4,
        repeatType: "reverse",
      },
    },
  },
}: TypewriterProps) => {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [isTabHidden, setIsTabHidden] = useState(false)

  const textsRef = useRef<string[]>([])
  textsRef.current = Array.isArray(text) ? text : [text]

  const delayServed = useRef(false)

  // Ref for IntersectionObserver — attached to the outer span
  const containerRef = useRef<HTMLSpanElement>(null)
  const isInView = useInView(containerRef, { amount: 0.1 })

  // Longest phrase — used as ghost sentinel to reserve stable dimensions
  const longestText = useMemo(() => {
    const arr = Array.isArray(text) ? text : [text]
    return arr.reduce((a, b) => (b.length > a.length ? b : a), '')
  }, [text])

  // Pause when browser tab is hidden
  useEffect(() => {
    const handler = () => setIsTabHidden(document.hidden)
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  const isPaused = !isInView || isTabHidden

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const texts = textsRef.current
    const currentText = texts[currentTextIndex]

    const tick = () => {
      // Do nothing when off-screen or tab hidden
      if (isPaused) return

      if (isDeleting) {
        if (displayText === "") {
          if (currentTextIndex === texts.length - 1 && !loop) return
          setIsDeleting(false)
          setCurrentTextIndex((prev) => (prev + 1) % texts.length)
          setCurrentIndex(0)
        } else {
          timeout = setTimeout(() => {
            setDisplayText((prev) => prev.slice(0, -1))
          }, deleteSpeed)
        }
      } else {
        if (currentIndex < currentText.length) {
          timeout = setTimeout(() => {
            setDisplayText((prev) => prev + currentText[currentIndex])
            setCurrentIndex((prev) => prev + 1)
          }, speed)
        } else if (texts.length > 1 || loop) {
          timeout = setTimeout(() => {
            setIsDeleting(true)
          }, waitTime)
        }
      }
    }

    if (!delayServed.current) {
      delayServed.current = true
      timeout = setTimeout(tick, initialDelay)
    } else {
      tick()
    }

    return () => clearTimeout(timeout)
  }, [
    currentIndex,
    displayText,
    isDeleting,
    currentTextIndex,
    speed,
    deleteSpeed,
    waitTime,
    loop,
    initialDelay,
    isPaused, // re-run when visibility changes so typing resumes immediately
  ])

  const liveContent = (
    <>
      <span>{displayText}</span>
      {showCursor && (
        <motion.span
          variants={cursorAnimationVariants}
          className={cn(
            cursorClassName,
            hideCursorOnType &&
              (currentIndex < textsRef.current[currentTextIndex]?.length ||
                isDeleting)
              ? "hidden"
              : ""
          )}
          initial="initial"
          // Stop the infinite blink animation when off-screen
          animate={isPaused ? "initial" : "animate"}
        >
          {cursorChar}
        </motion.span>
      )}
    </>
  )

  if (stableSize) {
    return (
      <span
        ref={containerRef}
        className={cn("whitespace-pre-wrap tracking-tight", className)}
        style={{ position: 'relative', display: 'inline-block' }}
      >
        {/* Ghost sentinel — participates in normal flow so it defines the
            container's height/width for the longest possible phrase.
            Invisible to the user but keeps layout stable. */}
        <span
          aria-hidden
          style={{
            display: 'block',
            visibility: 'hidden',
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'pre-wrap',
          }}
        >
          {longestText}
        </span>
        {/* Live text — absolutely overlaid on top of the ghost sentinel */}
        <span style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>
          {liveContent}
        </span>
      </span>
    )
  }

  return (
    <span ref={containerRef} className={cn("whitespace-pre-wrap tracking-tight", className)}>
      {liveContent}
    </span>
  )
}

export { Typewriter }
