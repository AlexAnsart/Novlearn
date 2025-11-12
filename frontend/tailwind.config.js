/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs selon la charte graphique
        primary: {
          50: '#f0f9ff',
          100: '#dbeafe', // blue-100
          200: '#bfdbfe', // blue-200
          300: '#93c5fd', // blue-300
          400: '#38bdf8',
          500: '#3b82f6', // blue-500
          600: '#2563eb', // blue-600
          700: '#1e40af', // blue-700
          800: '#1e3a8a',
          900: '#0c4a6e',
          950: '#0c4a6e', // blue-950
        },
        purple: {
          300: '#d8b4fe',
          500: '#a855f7',
          700: '#7e22ce',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        slate: {
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
    },
  },
  plugins: [],
};

