import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Menlo', 'Monaco', 'monospace'],
        serif: ['var(--font-instrument-serif)', 'Georgia', 'serif'],
      },
      colors: {
        // Brand accents — Dark Bento system
        cyan: {
          DEFAULT: '#5bb6ff',
          dim: 'rgba(91,182,255,0.12)',
          glow: 'rgba(91,182,255,0.28)',
        },
        amber: {
          DEFAULT: '#ffa845',
          dim: 'rgba(255,168,69,0.12)',
          glow: 'rgba(255,168,69,0.28)',
        },
        // Keep orange for backward compat (internal pages, contracts, etc.)
        orange: {
          DEFAULT: '#F97316',
          50: 'rgba(249,115,22,0.05)',
          100: 'rgba(249,115,22,0.1)',
          200: 'rgba(249,115,22,0.2)',
          500: '#F97316',
          600: '#EA6C0C',
        },
        surface: {
          DEFAULT: '#131316',
          secondary: '#1a1a1e',
          tertiary: '#1d1d22',
        },
      },
      borderRadius: {
        card: '22px',
        'card-lg': '28px',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'scroll-up': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(52,211,153,0.5)' },
          '50%': { opacity: '0.85', boxShadow: '0 0 0 5px rgba(52,211,153,0)' },
        },
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
        marquee: 'marquee 30s linear infinite',
        'scroll-up': 'scroll-up 30s linear infinite',
        'scroll-up-slow': 'scroll-up 40s linear infinite',
        'scroll-up-fast': 'scroll-up 22s linear infinite',
        'fade-in-up': 'fade-in-up 0.6s ease forwards',
        glow: 'glow 3s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
}

export default config
