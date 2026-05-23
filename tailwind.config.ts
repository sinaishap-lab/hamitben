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
        // Brand palette — drawn from the "ציון" logo (lion + hourglass)
        // Primary: deep teal — the lion + Hebrew lettering
        primary: {
          DEFAULT: "#1F4A5C",
          50: "#EAF1F4",
          100: "#CDDDE3",
          200: "#A0BCC8",
          300: "#6E96A6",
          400: "#467685",
          500: "#2D5C6E",
          600: "#1F4A5C",
          700: "#163848",
          800: "#0F2832",
          900: "#091921",
        },
        // Secondary: mid teal — the lion's mid stroke (softer)
        secondary: {
          DEFAULT: "#3D7A8B",
          50: "#EDF4F6",
          100: "#CFE0E5",
          200: "#9DC0CB",
          300: "#6BA0B0",
          400: "#4E8898",
          500: "#3D7A8B",
          600: "#2F606F",
          700: "#234852",
          800: "#172F36",
        },
        // Accent: warm gold — the hourglass / wheat
        accent: {
          DEFAULT: "#B88528",
          50: "#FBF6E8",
          100: "#F5E8BD",
          200: "#EBCE7E",
          300: "#DEB446",
          400: "#CFA033",
          500: "#B88528",
          600: "#946A20",
          700: "#704F18",
          800: "#4C3611",
          900: "#2A1E09",
        },
        bg: {
          DEFAULT: "#F8F6F1", // warm off-white — pairs with deep teal
          surface: "#FFFFFF",
          muted: "#F1EDE5", // subtle section background
        },
        text: {
          DEFAULT: "#1A2832", // cool ink — complements teal
          muted: "#5C6B75",
          inverse: "#FFFFFF",
        },
        success: "#2E7D5B",
        warning: "#D97706",
        error: "#B91C1C",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['"Heebo"', "system-ui", "sans-serif"],
      },
      maxWidth: {
        screen: "480px",
      },
      boxShadow: {
        soft: "0 2px 12px -2px rgb(31 74 92 / 0.10)",
        glow: "0 6px 24px -6px rgb(31 74 92 / 0.25)",
        "accent-glow": "0 6px 20px -4px rgb(184 133 40 / 0.40)",
        card: "0 1px 3px 0 rgb(31 74 92 / 0.06), 0 1px 2px -1px rgb(31 74 92 / 0.04)",
      },
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, #2D5C6E 0%, #1F4A5C 100%)",
        "gradient-accent":
          "linear-gradient(135deg, #CFA033 0%, #B88528 100%)",
        "gradient-hero":
          "linear-gradient(180deg, #F8F6F1 0%, #EAF1F4 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
