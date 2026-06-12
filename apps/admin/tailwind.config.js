/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#eef3ff",
          100: "#dce8ff",
          400: "#4d7bff",
          500: "#1B4FD8",
          600: "#1540b8",
          700: "#103394",
        },
        gold: {
          500: "#D4A853",
        },
      },
      fontFamily: {
        sans: ["Inter", "IBM Plex Sans Arabic", "sans-serif"],
      },
    },
  },
  plugins: [],
}
