"use client";

import { motion } from 'framer-motion';

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Pure black background */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Large Orange Glow - Top Left */}
      <motion.div 
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.05) 40%, transparent 70%)',
          filter: 'blur(80px)',
          top: '5%',
          left: '10%',
        }}
        animate={{
          x: [0, 150, -100, 80, 0],
          y: [0, -80, 100, -60, 0],
          scale: [1, 1.2, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Fuchsia Glow - Top Right */}
      <motion.div 
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(219, 39, 119, 0.12) 0%, rgba(219, 39, 119, 0.04) 40%, transparent 70%)',
          filter: 'blur(80px)',
          top: '15%',
          right: '5%',
        }}
        animate={{
          x: [0, -120, 80, -60, 0],
          y: [0, 100, -80, 60, 0],
          scale: [1, 0.9, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Orange Glow - Center */}
      <motion.div 
        className="absolute w-[700px] h-[700px] rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.1) 0%, rgba(234, 88, 12, 0.04) 40%, transparent 70%)',
          filter: 'blur(100px)',
          top: '30%',
          left: '25%',
        }}
        animate={{
          x: [0, -80, 120, -100, 0],
          y: [0, 60, -100, 80, 0],
          scale: [1, 1.1, 0.85, 1.05, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Fuchsia Glow - Bottom Left */}
      <motion.div 
        className="absolute w-[450px] h-[450px] rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, rgba(219, 39, 119, 0.04) 40%, transparent 70%)',
          filter: 'blur(70px)',
          bottom: '10%',
          left: '5%',
        }}
        animate={{
          x: [0, 100, -60, 80, 0],
          y: [0, -100, 60, -40, 0],
          scale: [1, 1.15, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Orange Glow - Bottom Right */}
      <motion.div 
        className="absolute w-[550px] h-[550px] rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.12) 0%, rgba(217, 119, 6, 0.04) 40%, transparent 70%)',
          filter: 'blur(90px)',
          bottom: '5%',
          right: '15%',
        }}
        animate={{
          x: [0, -100, 60, -80, 0],
          y: [0, -60, 100, -80, 0],
          scale: [1, 0.95, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Small Fuchsia accent - floating */}
      <motion.div 
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(219, 39, 119, 0.15) 0%, transparent 60%)',
          filter: 'blur(60px)',
          top: '50%',
          right: '30%',
        }}
        animate={{
          x: [0, 80, -120, 100, 0],
          y: [0, -80, 60, -100, 0],
          scale: [1, 1.3, 0.8, 1.2, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
