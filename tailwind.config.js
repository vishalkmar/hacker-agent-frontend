/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Jarvis / hacker theme — deep navy-black with glowing cyan.
        bg: {
          primary: '#070b12',   // app background (deep space navy-black)
          secondary: '#0c131f', // panels, sidebar, cards
          tertiary: '#141d2c',  // inputs, hover fills
        },
        txt: {
          primary: '#e3edf7',   // soft blue-white
          secondary: '#90a4bd', // dim
          muted: '#5d7188',     // muted
        },
        // Brand primary = Jarvis cyan glow.
        primary: {
          DEFAULT: '#22d3ee',
          hover: '#38e0f5',
          tint: 'rgba(34,211,238,0.12)',
          ring: 'rgba(34,211,238,0.45)',
        },
        accent: {
          green: '#22c55e',
          red: '#f43f5e',
          orange: '#f59e0b',
          yellow: '#eab308',
          blue: '#3b82f6',
          purple: '#a855f7',
          cyan: '#22d3ee',
        },
        terminal: '#22ff9e',     // matrix green for the console
        line: '#1b2a3e',         // subtle blue-grey border
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0,0,0,0.45)',
        lift: '0 8px 28px rgba(0,0,0,0.55)',
        glow: '0 0 0 1px rgba(34,211,238,0.25), 0 0 22px rgba(34,211,238,0.14)',
        'glow-strong': '0 0 0 1px rgba(34,211,238,0.45), 0 0 30px rgba(34,211,238,0.30)',
      },
    },
  },
  plugins: [],
};
