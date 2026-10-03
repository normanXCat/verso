/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          text: 'var(--color-text)',
          muted: 'var(--color-text-secondary)',
          border: 'var(--color-border)',
          accent: 'var(--color-accent)',
          'accent-hover': 'var(--color-accent-hover)',
          margin: 'var(--color-paper-margin)',
          line: 'var(--color-paper-line)',
        },
        verso: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          text: 'var(--color-text)',
          muted: 'var(--color-text-secondary)',
          border: 'var(--color-border)',
          accent: 'var(--color-accent)',
          'accent-hover': 'var(--color-accent-hover)',
        },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Geist Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'hero-clamp': 'clamp(3.5rem, 8vw, 7.5rem)',
        'hero-sub': 'clamp(1.125rem, 2.5vw, 1.5rem)',
      },
      borderRadius: {
        paper: '4px',
        card: '8px',
        panel: '12px',
      },
      boxShadow: {
        'paper-sm': 'var(--shadow-paper-sm)',
        'paper-md': 'var(--shadow-paper-md)',
        'paper-lg': 'var(--shadow-paper-lg)',
      },
      transitionTimingFunction: {
        paper: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        paper: '350ms',
      },
    },
  },
  plugins: [],
};
