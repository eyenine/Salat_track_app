/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#10b981',
        secondary: '#059669',
        background: '#f8fafc',
        card: '#ffffff',
        text: '#0f172a',
        muted: '#64748b',
      }
    },
  },
  plugins: [],
}
