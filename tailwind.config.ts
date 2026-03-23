import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#e8eefc',
        panel: '#12182a',
        void: '#070b16',
        accent: '#6fe7ff',
        aurora: '#9b7bff',
        pulse: '#36f1cd'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(111,231,255,0.12), 0 20px 60px rgba(54,241,205,0.12)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)'
      }
    },
  },
  plugins: [],
} satisfies Config
