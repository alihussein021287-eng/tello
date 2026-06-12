/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tello Brand — Lapis Lazuli + Iraqi Gold
        primary: {
          50:  "#eef3ff",
          100: "#dce8ff",
          200: "#b2caff",
          300: "#7ba3ff",
          400: "#4d7bff",
          500: "#1B4FD8", // Main brand blue (lapis)
          600: "#1540b8",
          700: "#103394",
          800: "#0d2878",
          900: "#091b5c",
        },
        gold: {
          400: "#e8c06a",
          500: "#D4A853", // Iraqi gold accent
          600: "#b8891f",
        },
        surface: {
          light: "#F7F7F8",
          dark:  "#1A1A1D",
        },
      },
      fontFamily: {
        arabic: ["IBM Plex Sans Arabic", "sans-serif"],
        sans:   ["Inter", "IBM Plex Sans Arabic", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "slide-up":   "slideUp 0.3s ease-out",
        "fade-in":    "fadeIn 0.2s ease-out",
        "shimmer":    "shimmer 1.5s infinite",
      },
      keyframes: {
        slideUp: {
          "0%":   { transform: "translateY(8px)", opacity: 0 },
          "100%": { transform: "translateY(0)",   opacity: 1 },
        },
        fadeIn: {
          "0%":   { opacity: 0 },
          "100%": { opacity: 1 },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
      },
    },
  },
  plugins: [],
}
