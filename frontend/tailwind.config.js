/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f7f6f2",
        surface: "#ffffff",
        surface2: "#efeee8",
        ink: { DEFAULT: "#181817", soft: "#45443f" },
        muted: { DEFAULT: "#6f6e68", foreground: "hsl(var(--muted-foreground))" },
        faint: "#9b9991",
        line: "#dcdad2",
        brand: { DEFAULT: "#a84f35", dim: "#843b28", bright: "#d97757" },
        gold: { DEFAULT: "#b68a3a", bright: "#cfaa63", soft: "#f2ead9" },
        rose: "#a84f35",
        sage: "#657464",
        edge: "#dcdad2",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: { tightest: "-0.04em" },
      borderRadius: {
        xl2: "1.5rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      maxWidth: { content: "68rem" },
      boxShadow: {
        card: "0 1px 1px rgba(24,24,23,0.04), 0 16px 40px -28px rgba(24,24,23,0.28)",
        lift: "0 18px 55px -30px rgba(24,24,23,0.38)",
        seal: "0 9px 24px -14px rgba(168,79,53,0.7)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%,100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        sheen: {
          "0%": { transform: "translateX(-130%)" },
          "100%": { transform: "translateX(240%)" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        drift: {
          "0%,100%": { transform: "translate3d(0,0,0) rotate(0deg)" },
          "50%": { transform: "translate3d(14px,-26px,0) rotate(7deg)" },
        },
        draw: {
          to: { strokeDashoffset: "0" },
        },
        flowX: {
          "0%": { left: "0%", opacity: "0" },
          "12%": { opacity: "1" },
          "88%": { opacity: "1" },
          "100%": { left: "100%", opacity: "0" },
        },
      },
      animation: {
        rise: "rise 0.65s cubic-bezier(0.16,1,0.3,1) both",
        pulseSoft: "pulseSoft 2.6s ease-in-out infinite",
        sheen: "sheen 3s ease-in-out infinite",
        floaty: "floaty 6s ease-in-out infinite",
        marquee: "marquee 34s linear infinite",
        spinSlow: "spinSlow 7s linear infinite",
        drift: "drift 16s ease-in-out infinite",
        draw: "draw 2.2s ease-out forwards",
        flowX: "flowX 3.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
