import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          base: 'var(--surface-base)',
          elevated: 'var(--surface-elevated)',
          card: 'var(--surface-card)',
          glass: 'var(--surface-glass)',
          input: 'var(--surface-input)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      ringOffsetColor: {
        DEFAULT: 'var(--surface-base)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
