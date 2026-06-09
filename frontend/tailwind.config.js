/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ff6b6b",
        secondary: "#4ecdc4",
        accent: "#ffe66d",
        background: "#f7f9fc",
        dark: "#2d3436"
      },
      fontFamily: {
        arabic: ['"Cairo"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
