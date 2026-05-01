import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F4F4F6',
        surface: '#FFFFFF',
        'surface-raised': '#FAFAFA',
        border: '#E4E4E7',
        'border-focus': '#059669',
        text: '#18181B',
        'text-muted': '#71717A',
        'text-subtle': '#A1A1AA',
        accent: '#059669',
        'accent-dark': '#047857',
        'accent-subtle': '#ECFDF5',
        'accent-light': '#D1FAE5',
        'accent-fg': '#065F46',
      },
      fontFamily: {
        syne: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(450%)' },
        },
        gentlePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out both',
        'scan': 'scan 2s ease-in-out infinite',
        'pulse-slow': 'gentlePulse 2.4s ease-in-out infinite',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05)',
        'card-md': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05)',
        'accent-ring': '0 0 0 3px rgba(5,150,105,0.12)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}

export default config
