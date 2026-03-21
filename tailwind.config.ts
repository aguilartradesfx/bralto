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
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        orange: {
          DEFAULT: '#F97316',
          50: 'rgba(249,115,22,0.05)',
          100: 'rgba(249,115,22,0.1)',
          200: 'rgba(249,115,22,0.2)',
          500: '#F97316',
          600: '#EA6C0C',
        },
        surface: {
          DEFAULT: '#111111',
          secondary: '#161616',
          tertiary: '#1a1a1a',
        },
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
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
        marquee: 'marquee 30s linear infinite',
        'scroll-up': 'scroll-up 30s linear infinite',
        'scroll-up-slow': 'scroll-up 40s linear infinite',
        'scroll-up-fast': 'scroll-up 22s linear infinite',
        'fade-in-up': 'fade-in-up 0.6s ease forwards',
        glow: 'glow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
