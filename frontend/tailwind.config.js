/** @type {import('tailwindcss').Config} */
export default {
  // Keep Tailwind scanning narrow so production CSS contains only classes used by the app.
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
          panel: 'rgb(var(--color-panel) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
          contrast: 'rgb(var(--color-brand-contrast) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
