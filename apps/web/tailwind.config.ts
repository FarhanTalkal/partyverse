import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        mist: "var(--color-mist)",
        foam: "var(--color-foam)",
        coral: "var(--color-coral)",
        teal: "var(--color-teal)",
        amber: "var(--color-amber)",
        slate: "var(--color-slate)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "var(--card-shadow)",
        glow: "0 10px 28px var(--glow)",
      },
      backgroundImage: {
        "hero-wash": "transparent",
        "panel-wash": "var(--surface)",
      },
    },
  },
  plugins: [],
};

export default config;
