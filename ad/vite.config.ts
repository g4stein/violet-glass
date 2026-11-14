import { defineConfig } from "vite";
import { resolve } from "node:path";

// Builds the demo-video pages (not part of the showcase site).
export default defineConfig({
  root: resolve(__dirname, ".."),
  base: "./",
  build: {
    outDir: resolve(__dirname, "../../.adwork/dist"),
    emptyOutDir: true,
    rollupOptions: { input: { capture: resolve(__dirname, "capture.html") } },
    chunkSizeWarningLimit: 2000,
  },
});
