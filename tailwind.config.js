/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cockpit: {
          bg: '#090d16',
          card: '#111827',
          surface: '#1e293b',
          border: '#334155',
          text: '#f8fafc',
          muted: '#94a3b8'
        },
        hangar: {
          bg: '#f8fafc',
          card: '#ffffff',
          surface: '#f1f5f9',
          border: '#cbd5e1',
          text: '#0f172a',
          muted: '#64748b'
        },
        avionics: {
          ok: '#10b981',      // Emerald Green (OK)
          danger: '#ef4444',  // Alert Red
          warning: '#f59e0b', // Amber Flag
          horizon: '#0284c7'  // Sky Blue Horizon
        }
      }
    },
  },
  plugins: [
    function({ addVariant }) {
      addVariant('light', ':is(.light &)');
    }
  ],
}
