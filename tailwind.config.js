/**
 * tailwind.config.js
 * ------------------------------------------------------------------
 * Tokens del sistema de diseño LIVO (ver DESIGN_SYSTEM-LIVO.md, sección 11).
 * No modificar estos valores sin actualizar también el markdown fuente.
 * ------------------------------------------------------------------
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        livo: {
          blue: {
            50: "#F2F2FD",
            100: "#E5E5FC",
            200: "#CCCCF9",
            300: "#A6A6F4",
            400: "#6666ED",
            500: "#0000E1", // Electric Blue — base
            600: "#0000BF",
            700: "#00009D",
            800: "#000071",
            900: "#000044",
          },
          lime: {
            50: "#FDFFF2",
            100: "#FCFFE5",
            200: "#F8FFCC",
            300: "#F3FFA6",
            400: "#EBFF66",
            500: "#DEFF00", // Lime — base
            600: "#BDD900",
            700: "#9BB200",
            800: "#6F8000",
            900: "#434D00",
          },
          orange: {
            50: "#FFF6F2",
            100: "#FFEDE5",
            200: "#FEDCCC",
            300: "#FEC1A6",
            400: "#FD9566",
            500: "#FC4F00", // Vivid Orange — base
            600: "#D64300",
            700: "#B03700",
            800: "#7E2800",
            900: "#4C1800",
          },
          pink: {
            50: "#FDF4F9",
            100: "#FBEAF4",
            200: "#F7D5E8",
            300: "#F2B6D7",
            400: "#E881BB",
            500: "#D92D8E", // Pink — base
            600: "#B82679",
            700: "#982063",
            800: "#6D1747",
            900: "#410E2B",
          },
          sand: "#AB8F68",
          gray: "#F0F0F0",
        },
      },
      fontFamily: {
        display: ["Ballinger", "sans-serif"], // Headings & Display
        body: ["Poppins", "sans-serif"], // Body & UI
        mono: ["Carbon", "monospace"], // Numbers & Prices (T29 Carbon)
      },
      borderRadius: {
        btn: "9999px", // Buttons
        input: "8px", // Inputs
        badge: "9999px", // Badges
        card: "12px", // Cards
        "card-lg": "16px", // Large cards
      },
      boxShadow: {
        "focus-primary": "0px 0px 0px 3px rgba(0, 0, 225, 0.5)",
        "focus-input": "0px 0px 0px 3px rgba(0, 0, 225, 0.2)",
        "focus-secondary": "0px 0px 0px 3px rgba(222, 255, 0, 0.5)",
        "focus-toggle": "0px 0px 0px 3px rgba(0, 0, 225, 0.4)",
        "slider-hover": "0px 0px 0px 4px rgba(0, 0, 225, 0.3)",
        tooltip: "0px 4px 8px -2px rgba(0, 0, 0, 0.14)",
        thumb: "0px 1px 3px 0px rgba(0, 0, 0, 0.15)",
      },
      letterSpacing: {
        btn: "0.5px",
      },
    },
  },
  plugins: [],
};
