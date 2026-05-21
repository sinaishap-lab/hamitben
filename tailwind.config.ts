import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Spec §10 palette
        primary: {
          DEFAULT: "#4A7C59", // ירוק כהה – צמחייה
          50: "#EDF3EF",
          100: "#D6E3DA",
          200: "#AEC7B6",
          300: "#86AB92",
          400: "#5E8F6E",
          500: "#4A7C59",
          600: "#3B6347",
          700: "#2C4A35",
          800: "#1D3124",
          900: "#0E1812",
        },
        secondary: {
          DEFAULT: "#8B5E3C", // חום – אדמה
          50: "#F3ECE5",
          100: "#E2D1BF",
          200: "#C5A37E",
          300: "#A87F58",
          400: "#8B5E3C",
          500: "#6F4B30",
          600: "#533824",
          700: "#382518",
          800: "#1C130C",
        },
        accent: {
          DEFAULT: "#D4A843", // זהב – שיבולים
          50: "#FBF5E3",
          100: "#F5E7B7",
          200: "#EBD085",
          300: "#E2BB5F",
          400: "#D4A843",
          500: "#B68B2E",
          600: "#8A6822",
          700: "#5D4617",
        },
        bg: {
          DEFAULT: "#F7F3ED", // שמנת
          surface: "#FFFFFF",
        },
        text: {
          DEFAULT: "#2C2416", // חום כהה
          muted: "#6B6354",
          inverse: "#FFFFFF",
        },
        success: "#3D8B37",
        warning: "#E6992C",
        error: "#C0392B",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['"Heebo"', "system-ui", "sans-serif"],
      },
      maxWidth: {
        screen: "480px", // mobile-first content cap
      },
    },
  },
  plugins: [],
};
export default config;
