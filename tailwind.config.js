/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      },
      colors: {
        background: '#F2F6F8',
        foreground: '#0E242D',
        primary: {
          DEFAULT: '#1F4554',
          hover: '#0E242D',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F7F1E8',
          foreground: '#0E242D',
        },
        muted: {
          DEFAULT: '#F7F1E8',
          foreground: '#475569',
        },
        accent: {
          DEFAULT: '#D12B2C',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0E242D',
        },
        ink: '#0E242D',
        petrol: '#1F4554',
        crimson: '#D12B2C',
        warm: '#F7F1E8',
      },
    },
  },
  plugins: [],
}
