"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface AnimatedCTAButtonProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'lg' | 'default';
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
}

export function AnimatedCTAButton({ 
  children, 
  className = '', 
  size = 'lg',
  onClick,
  href,
  target,
  rel
}: AnimatedCTAButtonProps) {
  const buttonContent = (
    <div className="relative rounded-xl overflow-visible group inline-block">
      {/* Pulsing glow behind button */}
      <motion.div 
        className="absolute -inset-2 rounded-xl -z-10 blur-md"
        style={{
          background: 'linear-gradient(135deg, #F97316, #DB2777, #F97316)',
        }}
        animate={{
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Secondary softer pulsing glow */}
      <motion.div 
        className="absolute -inset-3 rounded-2xl -z-20 blur-md"
        style={{
          background: 'linear-gradient(135deg, #EC4899, #FBBF24, #F97316)',
        }}
        animate={{
          opacity: [0.08, 0.20, 0.08],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />
      
      {/* Inner button - solid with subtle border */}
      <Button
        size={size}
        onClick={onClick}
        className={`relative font-bold transition-all duration-300 hover:scale-[1.05] text-white border border-orange-500/30 ${className}`}
        style={{ 
          background: 'linear-gradient(135deg, #F97316, #EA580C, #D97706)',
          borderRadius: '0.75rem',
        }}
      >
        {children}
      </Button>
    </div>
  );

  if (href) {
    return (
      <a href={href} target={target} rel={rel} className="inline-block">
        {buttonContent}
      </a>
    );
  }

  return buttonContent;
}
