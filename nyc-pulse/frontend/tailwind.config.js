/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pulse: {
          bg: "#0f0f1a",
          card: "#1a1a2e",
          border: "#2a2a4a",
          accent: "#e63946",
          gold: "#ffd700",
          teal: "#06d6a0",
          purple: "#7b2d8b",
          blue: "#4361ee",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
