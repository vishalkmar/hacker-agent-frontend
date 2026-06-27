/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Phase 10: premium LIGHT theme, primary blue (docs/PLATFORM-UPGRADE.md).
        bg: {
          primary: '#F8FAFC',   // app background (slate-50)
          secondary: '#FFFFFF', // surfaces: sidebar, cards, composer
          tertiary: '#F1F5F9',  // inputs, hover fills (slate-100)
        },
        txt: {
          primary: '#0F172A',   // slate-900
          secondary: '#475569', // slate-600
          muted: '#64748B',     // slate-500
        },
        // Brand primary (blue) — use `primary` for CTAs/focus going forward.
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          tint: '#EFF6FF',
          ring: '#93C5FD',
        },
        accent: {
          green: '#16A34A',
          red: '#DC2626',
          orange: '#D97706',
          yellow: '#CA8A04',
          blue: '#2563EB',
          purple: '#7C3AED',
          cyan: '#2563EB', // mapped to brand blue so existing CTAs read as primary
        },
        terminal: '#15803D',
        line: '#E2E8F0',        // slate-200 borders
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)',
        lift: '0 4px 16px rgba(15,23,42,0.10)',
      },
    },
  },
  plugins: [],
};
