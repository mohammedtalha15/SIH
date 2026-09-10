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
        /* ---- Semantic surface + ink scale (neutral, data-first) ---- */
        canvas: 'var(--canvas)',
        surface: {
          DEFAULT: 'var(--surface)',
          muted: 'var(--surface-muted)',
          sunken: 'var(--surface-sunken)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          secondary: 'var(--ink-secondary)',
          muted: 'var(--ink-muted)',
          inverted: 'var(--ink-inverted)',
        },
        hairline: 'var(--hairline)',
        'hairline-strong': 'var(--hairline-strong)',

        /* ---- Status: reserved, never used as a series colour ---- */
        status: {
          good: 'var(--status-good)',
          warning: 'var(--status-warning)',
          serious: 'var(--status-serious)',
          critical: 'var(--status-critical)',
        },

        /* ---- Data-viz series slots (fixed order, never cycled) ---- */
        series: {
          1: 'var(--series-1)',
          2: 'var(--series-2)',
          3: 'var(--series-3)',
        },

        /* ---- Legacy ANA aliases -------------------------------------
         * DEPRECATED. Retained only so components not yet migrated pick
         * up the neutral palette automatically. Do not use in new code —
         * reach for the semantic tokens above. See context/design-context.md
         */
        'ana-blue': 'var(--ink)',
        'ana-light-blue': 'var(--ink-secondary)',
        'ana-sky': 'var(--surface-muted)',
        'ana-red': 'var(--status-critical)',
        'ana-gray': 'var(--surface-sunken)',
        'ana-soft-gray': 'var(--hairline)',
        'ana-dark': 'var(--ink)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        /* compact label scale for dense dashboard chrome */
        label: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
        metric: ['1.75rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(11 11 11 / 0.04), 0 1px 3px 0 rgb(11 11 11 / 0.03)',
        raised: '0 2px 4px -1px rgb(11 11 11 / 0.06), 0 4px 12px -2px rgb(11 11 11 / 0.06)',
        overlay: '0 8px 24px -4px rgb(11 11 11 / 0.10), 0 2px 6px -2px rgb(11 11 11 / 0.06)',
      },
    },
  },
  plugins: [],
}

export default config
