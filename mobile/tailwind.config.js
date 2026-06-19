/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Pet-Match & Care design tokens
        terracotta: {
          DEFAULT: '#E07A5F',
          soft: '#F2A287',
          deep: '#C25B3F',
        },
        sage: {
          DEFAULT: '#81B29A',
          soft: '#A8C9B7',
          deep: '#5A8F77',
        },
        crimson: {
          DEFAULT: '#E63946',
          soft: '#F26B76',
          deep: '#B82A35',
        },
        cream: {
          DEFAULT: '#F4F1DE',
          soft: '#FBF8E8',
          deep: '#E8E4C9',
        },
        charcoal: {
          DEFAULT: '#2F3E46',
          soft: '#4A5C66',
          deep: '#1A242A',
        },
      },
      borderRadius: {
        '4xl': '32px',
        '5xl': '40px',
      },
      fontFamily: {
        // System defaults — Expo doesn't ship a typeface by default.
        sans: ['sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 24px rgba(47, 62, 70, 0.06)',
        hush: '0 2px 8px rgba(47, 62, 70, 0.04)',
      },
    },
  },
  plugins: [],
};
