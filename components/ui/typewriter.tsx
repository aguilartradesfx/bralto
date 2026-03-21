'use client'

import { useEffect, useRef, useState } from "react"
import { motion, Variants } from "framer-motion"
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

  // Stable ref so the effect never re-runs just because the parent re-rendered
  // with the same text values but a new array reference.
  const textsRef = useRef<string[]>([])
  textsRef.current = Array.isArray(text) ? text : [text]

  // Tracks whether we've served the one-time initialDelay already
  const delayServed = useRef(false)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const texts = textsRef.current
    const currentText = texts[currentTextIndex]

    const tick = () => {
      if (isDeleting) {
        if (displayText === "") {
          // Done deleting — move to next phrase
          if (currentTextIndex === texts.length - 1 && !loop) return
          setIsDeleting(false)
          setCurrentTextIndex((prev) => (prev + 1) % texts.length)
          setCurrentIndex(0)
          // State updates will re-run the effect; no extra setTimeout needed
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

    // Apply initialDelay only once at startup
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
    // 'textsRef' intentionally omitted — we read it via ref to stay stable
  ])

  return (
    // Use <span> not <div> so this can safely live inside <h1> or <p>
    <span className={cn("whitespace-pre-wrap tracking-tight", className)}>
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
          animate="animate"
        >
          {cursorChar}
        </motion.span>
      )}
    </span>
  )
}

export { Typewriter }
