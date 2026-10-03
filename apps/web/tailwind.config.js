/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        verso: {
          dark: '#0f0f12',
          light: '#fdfdfd',
        },
      },
    },
  },
  plugins: [],
};
