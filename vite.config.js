import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// base: "./" makes the build work on Netlify, Vercel and GitHub Pages sub-paths.
export default defineConfig({
  base: "./",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.js"],
  },
});
