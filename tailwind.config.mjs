/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          peach: '#E8A598',
          'peach-light': '#FCEEEB',
          'peach-dark': '#C97768',
          cream: '#FFE5B4',
          'cream-light': '#FFF9F0',
          'cream-dark': '#F0CF92',
          green: '#2D5A27',
          'green-light': '#467B3E',
          'green-dark': '#1C3A18',
          'green-soft': '#EAF3E8',
        },
        surface: {
          light: '#FDFBF7',
          card: '#FFFFFF',
          dark: '#121A11',
          'dark-card': '#1B261A',
          'dark-border': '#2A3C28',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(45, 90, 39, 0.06), 0 2px 6px -1px rgba(45, 90, 39, 0.04)',
        'soft-lg': '0 12px 32px -4px rgba(45, 90, 39, 0.1), 0 4px 12px -2px rgba(45, 90, 39, 0.06)',
        'pastel': '0 10px 25px -5px rgba(232, 165, 152, 0.35)',
        'green-glow': '0 8px 24px -4px rgba(45, 90, 39, 0.25)',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
};
