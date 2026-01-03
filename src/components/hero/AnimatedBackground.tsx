"use client";

import { useMobileDetect } from '@/hooks/use-mobile-detect';

export function AnimatedBackground() {
  const isMobile = useMobileDetect();
  
  if (isMobile) {
    // Ultra-lightweight version for mobile - no animations, no blur
    return (
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-black" />
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, rgba(249, 115, 22, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(219, 39, 119, 0.06) 0%, transparent 50%)',
          }}
        />
      </div>
    );
  }
  
  // Desktop: Use CSS animations instead of Framer Motion for better performance
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-black" />
      
      {/* Keyframes injected once */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatGlow1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(100px, -50px) scale(1.15); }
          66% { transform: translate(-60px, 60px) scale(0.95); }
        }
        @keyframes floatGlow2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-80px, 60px) scale(0.9); }
          66% { transform: translate(50px, -40px) scale(1.1); }
        }
        @keyframes floatGlow3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -60px) scale(1.08); }
        }
      `}} />
      
      {/* Orange Glow - Top Left */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.05) 40%, transparent 70%)',
          filter: 'blur(80px)',
          top: '5%',
          left: '10%',
          animation: 'floatGlow1 18s ease-in-out infinite',
        }}
      />
      
      {/* Fuchsia Glow - Top Right */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(219, 39, 119, 0.12) 0%, rgba(219, 39, 119, 0.04) 40%, transparent 70%)',
          filter: 'blur(80px)',
          top: '15%',
          right: '5%',
          animation: 'floatGlow2 22s ease-in-out infinite',
        }}
      />
      
      {/* Orange Glow - Center */}
      <div 
        className="absolute w-[700px] h-[700px] rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.1) 0%, rgba(234, 88, 12, 0.04) 40%, transparent 70%)',
          filter: 'blur(100px)',
          top: '30%',
          left: '25%',
          animation: 'floatGlow3 25s ease-in-out infinite',
        }}
      />
      
      {/* Fuchsia Glow - Bottom */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
          bottom: '5%',
          left: '15%',
          animation: 'floatGlow1 20s ease-in-out infinite reverse',
        }}
      />
    </div>
  );
}
