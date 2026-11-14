import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Inter", "sans-serif"],
      },
      colors: {
        primary: "#2a2a2a",
        primaryDark: "#111111",
        accent: "#e6e6e6",
        border: "#e2e2e2",
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f4f4f4",
        },
        ink: {
          900: "#151515",
          600: "#4a4a4a",
          200: "#dcdcdc",
          100: "#eeeeee",
          700: "#3c4657",
          500: "#65707d",
          400: "#8a94a6",
          300: "#b7bfc9",
        },
        success: "#1f8a4c",
        danger: "#c0392b",
        warning: "#b9770e",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.05)",
        panel: "0 1px 3px rgba(16,24,40,.08)",
      },
      spacing: {
        sidebar: "260px",
        "sidebar-collapsed": "72px",
      },
    },
  },
  plugins: [],
};

export default config;
