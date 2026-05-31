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
        brand: {
          50: '#f0fbfb',
          100: '#dcf5f6',
          200: '#beebee',
          300: '#90dbe0',
          400: '#5cc1cb',
          500: '#40a5b0',
          600: '#358692',
          700: '#306e7a',
          800: '#2d5c66',
          900: '#294e56',
          950: '#0c2227',
        },
        darkbg: {
          50: '#162226',
          100: '#111b1e',
          250: '#0b1315',
          300: '#070c0e',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-highlight': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
}
