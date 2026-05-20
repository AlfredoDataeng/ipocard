/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#000c3b',    // deep dark blue
          royal: '#0f2b92',   // main royal blue
          medium: '#1c45c9',  // brighter blue
          cyan: '#06b6d4',    // cyan accent
          teal: '#14b8a6',    // teal accent
          light: '#e0f2fe',   // light blue background
          cardBg: 'rgba(255, 255, 255, 0.95)' // card front white background
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        cursive: ['Caveat', 'cursive'],
        handwritten: ['Architects Daughter', 'cursive']
      },
      boxShadow: {
        neon: '0 0 20px rgba(15, 43, 146, 0.3)',
        neonCyan: '0 0 15px rgba(6, 182, 212, 0.4)'
      }
    },
  },
  plugins: [],
}
