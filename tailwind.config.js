/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#ffffff',
        'accent-red': '#ff4444',
        'accent-blue': '#4444ff',
        'accent-yellow': '#ffcc44',
        'accent-pink': '#ff99cc',
        background: '#f5f5f5',
        'text-dark': '#1a1a1a',
        'text-light': '#666666',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

