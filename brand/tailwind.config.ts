import type { Config } from "tailwindcss";

/**
 * Jogo da Maria — Tailwind Config
 * Brand: Galáxia Encantada
 * Gerado por: MAXWELL (pipeline /brand)
 */
const config: Config = {
  content: ["./*.{html,js}", "./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Primitivos de marca ──
        void:       "#0d001a",
        cosmos:     "#2a0050",
        "cosmos-glow": "#3d0070",
        magenta:    "#ff88ff",
        "pink-hot": "#ee44cc",
        violet:     "#8833ff",
        gold:       "#ffe066",
        "gold-glow":"#ffee00",
        lavender:   "#ccaaff",
        ice:        "#ddc8ff",
        "blue-brand":  "#2288cc",
        "blue-dark":   "#0055aa",

        // ── Aliases semânticos ──
        brand: {
          DEFAULT: "#ee44cc",
          light:   "#ff88ff",
          dark:    "#8833ff",
        },
        reward:    "#ffe066",
        subtle:    "#ccaaff",
        surface:   "rgba(255,255,255,0.07)",
      },

      fontFamily: {
        game: [
          "Segoe UI",
          "system-ui",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Noto Color Emoji",
          "sans-serif",
        ],
      },

      fontWeight: {
        title: "900",
        cta:   "700",
        ui:    "600",
        body:  "400",
      },

      borderRadius: {
        game:   "8px",
        card:   "12px",
        canvas: "16px",
        pill:   "9999px",
      },

      spacing: {
        "4.5": "18px",
        "7":   "28px",
      },

      boxShadow: {
        canvas:    "0 0 40px rgba(255,136,255,0.40), 0 0 80px rgba(136,68,255,0.20)",
        cta:       "0 4px 18px rgba(238,68,204,0.40)",
        "cta-lg":  "0 6px 28px rgba(238,68,204,0.60)",
        share:     "0 4px 18px rgba(34,136,204,0.40)",
        toast:     "0 4px 20px rgba(255,68,255,0.27)",
        title:     "0 0 20px #ff44ff, 0 0 50px rgba(255,0,255,0.27)",
      },

      backdropBlur: {
        game: "10px",
        toast: "12px",
      },

      backgroundImage: {
        "cosmic": "radial-gradient(ellipse at center, #2a0050 0%, #0d001a 100%)",
        "cta":    "linear-gradient(135deg, #ee44cc, #8833ff)",
        "share":  "linear-gradient(135deg, #2288cc, #0055aa)",
        "overlay":"linear-gradient(135deg, #2a0050ee, #0d001aee)",
        "install":"linear-gradient(135deg, #ee44cc44, #8833ff44)",
      },

      animation: {
        "toast-in":  "toast-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "toast-out": "toast-out 0.3s ease forwards",
        "pulse-glow":"pulse-glow 2s ease-in-out infinite",
      },

      keyframes: {
        "toast-in":  { from: { transform: "translateX(-50%) translateY(-120px)" }, to: { transform: "translateX(-50%) translateY(0)" } },
        "toast-out": { from: { opacity: "1" }, to: { opacity: "0", transform: "translateX(-50%) translateY(-120px)" } },
        "pulse-glow":{ "0%, 100%": { opacity: "0.7" }, "50%": { opacity: "1" } },
      },
    },
  },
  plugins: [],
};

export default config;
