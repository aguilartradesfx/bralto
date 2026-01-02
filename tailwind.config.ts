import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        // Instagram-inspired gradient colors
        orange: {
          DEFAULT: '#FF6432',
          300: '#FF8A5C',
          400: '#FF7642',
          500: '#FF6432',
          600: '#E54D20',
          700: '#CC3D10'
        },
        fuchsia: {
          DEFAULT: '#DC32B4',
          300: '#E85CC6',
          400: '#E247BD',
          500: '#DC32B4',
          600: '#C4209A',
          700: '#A81580'
        },
        purple: {
          DEFAULT: '#B41EDC',
          300: '#C947E8',
          400: '#BE32E2',
          500: '#B41EDC',
          600: '#9815B8',
          700: '#7D0F95'
        },
        pink: {
          DEFAULT: '#F05080',
          300: '#F47AA0',
          400: '#F26590',
          500: '#F05080',
          600: '#E03268',
          700: '#C82050'
        },
        // Legacy aliases mapped to new colors
        cyan: {
          DEFAULT: '#FF6432',
          400: '#FF8A5C',
          500: '#FF6432',
          600: '#E54D20'
        },
        lime: {
          DEFAULT: '#FF6432',
          400: '#FF8A5C',
          500: '#FF6432',
          600: '#E54D20'
        },
        electric: {
          DEFAULT: '#DC32B4',
          500: '#DC32B4',
          600: '#C4209A'
        },
        violet: {
          DEFAULT: '#B41EDC',
          500: '#B41EDC',
          600: '#9815B8'
        },
        coral: {
          DEFAULT: '#F05080',
          400: '#F47AA0',
          500: '#F05080',
          600: '#E03268'
        },
        amber: {
          DEFAULT: '#FF8A5C',
          400: '#FFA680',
          500: '#FF8A5C',
          600: '#E54D20'
        },
        charcoal: {
          DEFAULT: '#0D0D0D',
          50: '#1A1A1A',
          100: '#171717',
          200: '#141414',
          300: '#121212',
          400: '#0F0F0F',
          500: '#0D0D0D',
          600: '#0A0A0A',
          700: '#080808',
          800: '#050505',
          900: '#030303'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        'glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
