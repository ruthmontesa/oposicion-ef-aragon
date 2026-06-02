import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f9f0',
          100: '#dcf0dc',
          200: '#bbe3bb',
          300: '#8ecf8e',
          400: '#5cb35c',
          500: '#3a9a3a',
          600: '#2a7d2a',
          700: '#246324',
          800: '#204f20',
          900: '#1c421c',
        },
        aragon: {
          red:    '#CF1920',
          yellow: '#F5C518',
          gold:   '#C8922A',
        }
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body:    ['var(--font-body)'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
