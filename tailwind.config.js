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
          bg: '#09090b',
          card: '#18181b',
          surface: '#27272a',
          border: '#3f3f46',
          text: '#f4f4f5',
          muted: '#a1a1aa'
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
          horizon: '#f59e0b'  // Aviation Amber (Zero-Blue)
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
