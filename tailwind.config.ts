import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ANA Airline Theme Colors
        'ana-blue': '#00467F',
        'ana-light-blue': '#0072CE',
        'ana-sky': '#E8F4FC',
        'ana-red': '#E60012',
        'ana-gray': '#F5F7FA',
        'ana-soft-gray': '#E5E7EB',
        'ana-dark': '#1F2937',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
