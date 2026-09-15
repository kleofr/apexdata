/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        f1: {
          dark: '#0D0E12',
          panel: '#141720',
          card: '#191D28',
          border: '#242A3A',
          borderSubtle: 'rgba(255, 255, 255, 0.08)',
          gray: '#8E95A5',
          orange: '#FF6A00',
          cyan: '#00F0FF',
          green: '#00E676',
          red: '#FF1744',
          yellow: '#FFD600',
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        titillium: ['Titillium Web', 'sans-serif'],
      },
      boxShadow: {
        'neon-orange': '0 0 15px rgba(255, 106, 0, 0.35)',
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.35)',
        'neon-green': '0 0 15px rgba(0, 230, 118, 0.35)',
        'hud': 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 20px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
}
