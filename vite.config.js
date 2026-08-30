import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The frontend lives in client/ and talks to the Express backend via /api.
// In dev, Vite (port 5173) proxies /api requests to the backend (port 8787),
// so the browser never sees the Anthropic API key.
export default defineConfig({
  root: "client",
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
