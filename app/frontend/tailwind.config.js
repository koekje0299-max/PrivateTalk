/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1A1F2E',
        secondary: '#2D3548',
        accent: '#00D4AA',
        warning: '#FF6B6B'
      }
    }
  },
  plugins: []
};