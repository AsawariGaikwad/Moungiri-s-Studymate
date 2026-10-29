/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8eb4ff',
          400: '#3d7dff',
          500: '#1e4da8',
          600: '#163a86',
          700: '#123a7a',
          800: '#0f2c5c',
          900: '#0b1f4a',
        },
        accent: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 18px 50px -24px rgb(11 31 74 / 0.45)',
      },
    },
  },
  plugins: [],
}
