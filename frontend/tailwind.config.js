/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        ink: "#0B0D12",
        bone: "#F2EFE9",
        violet: {
          DEFAULT: "#7C5CFC",
          soft: "#A594FF",
          deep: "#5B3FE0",
        },
        amber: {
          DEFAULT: "#FF8A3D",
          soft: "#FFB37A",
        },
        slate: {
          soft: "#565B66",
        },
      },
      backgroundImage: {
        "glyph-gradient": "linear-gradient(135deg, #7C5CFC 0%, #FF8A3D 100%)",
      },
    },
  },
  plugins: [],
};
