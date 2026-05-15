/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#007AFF",
        danger: "#E53935",
        success: "#34C759",
        warning: "#FF9500",
        surface: "#FFFFFF",
        background: "#F8F8F8",
        muted: "#999999",
        border: "#E0E0E0",
      },
    },
  },
  plugins: [],
};
