/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        has: {
          dark: "#020617",
          card: "#0F172A",
          primary: "#0D9488",
          danger: "#E11D48",
          warning: "#F59E0B",
          success: "#10B981",
        },
        primary: {
          DEFAULT: "#1E3A8A",
          light: "#3B82F6",
          dark: "#1E40AF",
        },
        secondary: {
          DEFAULT: "#0F766E",
          light: "#14B8A6",
          dark: "#115E59",
        },
        accent: {
          DEFAULT: "#6D28D9",
          light: "#8B5CF6",
          dark: "#5B21B6",
        },
        background: "#F8FAFC",
        surface: "#FFFFFF",
        border: "#E2E8F0",
        text: {
          main: "#0F172A",
          muted: "#475569",
        },
        status: {
          success: "#16A34A",
          warning: "#D97706",
          error: "#DC2626",
          info: "#2563EB",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08)",
        panel: "0 4px 12px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
      },
    },
  },
  plugins: [],
};
