/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#DAD3BF",
        paper: "#F6F2E6",
        paperDark: "#EDE6D3",
        ink: "#221F1A",
        inkSoft: "#6B6458",
        line: "#C9BFA6",
        stampRed: "#AD3B2C",
        stampBlue: "#2E4A6B",
        highlight: "#E4C73C",
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Consolas",
          "Liberation Mono",
          "Menlo",
          "monospace",
        ],
        serif: ["Georgia", "Iowan Old Style", "Palatino Linotype", "serif"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
