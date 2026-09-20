/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // The original code used classes like `px-4.5` / `mb-4.5`, which are not in
      // Tailwind's default scale and silently produced no CSS. Defining the value fixes them.
      spacing: { 4.5: "1.125rem" },
      colors: {
        canvas: "#DAD3BF",
        paper: "#F6F2E6",
        paperDark: "#EDE6D3",
        ink: "#221F1A",
        // darkened from #6B6458 so small text passes WCAG AA (4.5:1) on canvas too
        inkSoft: "#5A5448",
        // decorative dividers
        line: "#C9BFA6",
        // borders of form controls (WCAG 1.4.11 needs >= 3:1)
        lineStrong: "#857B66",
        stampRed: "#AD3B2C",
        stampBlue: "#2E4A6B",
        highlight: "#E4C73C",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Consolas", "Liberation Mono", "Menlo", "monospace"],
        serif: ["Georgia", "Iowan Old Style", "Palatino Linotype", "serif"],
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
