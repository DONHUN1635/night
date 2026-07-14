import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Éjszakai alaptónusok
        night: {
          950: '#0a0e1f',
          900: '#0f1530',
          800: '#161d3f',
          700: '#1f2a52',
        },
        // Indigó / lila kiemelések
        dusk: {
          400: '#8b7cf6',
          500: '#7c5cf0',
          600: '#6a3fd8',
        },
        // Halvány holdfény
        moonlight: {
          100: '#eef1fb',
          200: '#d6ddf5',
          300: '#aab4e0',
        },
        // Visszafogott világoskék
        skyline: {
          400: '#7dd3fc',
          500: '#5cb8ef',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      animation: {
        drift: 'drift 60s linear infinite',
        twinkle: 'twinkle 4s ease-in-out infinite',
      },
      keyframes: {
        drift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-1000px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.9' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
