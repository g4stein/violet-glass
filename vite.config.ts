import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      output: {
        // Keep the Mux/HLS engine in its own cacheable chunk.
        manualChunks: (id) => (id.includes("mux") || id.includes("hls") ? "media" : undefined),
      },
    },
    chunkSizeWarningLimit: 900,
  },
});
