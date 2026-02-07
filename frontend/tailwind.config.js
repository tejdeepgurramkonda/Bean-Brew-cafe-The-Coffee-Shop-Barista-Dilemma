/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        espresso: {
          50: '#fdf8f3',
          100: '#f7ede3',
          200: '#ead7c3',
          300: '#ddbfa3',
          400: '#c99a6d',
          500: '#b47a3f',
          600: '#8f5620',
          700: '#6d4319',
          800: '#4a2e11',
          900: '#2c1c0e',
          950: '#1a100a'
        },
        coffee: {
          light: '#d4a574',
          DEFAULT: '#8b6f47',
          dark: '#3e2723',
          darker: '#2a1810'
        },
        cream: {
          50: '#fffcf5',
          100: '#fff8eb',
          200: '#ffefd1',
          300: '#ffe4b3',
          400: '#ffd88a',
          500: '#ffc857'
        },
        mocha: {
          50: '#faf6f3',
          100: '#f0e7dc',
          200: '#e0cfb9',
          300: '#c9a876',
          400: '#a67c52',
          500: '#7d5c3f'
        },
        latte: '#f5e6d3',
        caramel: '#c17817',
        roast: '#1a0f0a',
        ember: '#e07a2e',
        foam: '#fefdfb'
      },
      backgroundImage: {
        'coffee-gradient': 'linear-gradient(135deg, #6d4319 0%, #2c1c0e 100%)',
        'cream-gradient': 'linear-gradient(135deg, #fff8eb 0%, #ffe4b3 100%)',
        'warm-gradient': 'linear-gradient(135deg, #ffd88a 0%, #c99a6d 50%, #8f5620 100%)',
        'subtle-gradient': 'linear-gradient(180deg, #fdf8f3 0%, #ffffff 100%)'
      },
      boxShadow: {
        'glow': '0 20px 60px rgba(224, 122, 46, 0.25)',
        'coffee': '0 10px 40px rgba(141, 86, 32, 0.15)',
        'warm': '0 4px 20px rgba(193, 120, 23, 0.15)',
        'soft': '0 2px 10px rgba(0, 0, 0, 0.05)',
        'inner-glow': 'inset 0 2px 10px rgba(255, 248, 235, 0.5)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'steam': 'steam 2s ease-in-out infinite'
      },
      keyframes: {
        steam: {
          '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: 0.7 },
          '50%': { transform: 'translateY(-10px) scale(1.1)', opacity: 0.9 }
        }
      }
    }
  },
  plugins: []
}
