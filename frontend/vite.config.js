import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite dev proxy
 * - For any request starting with /api, Vite will forward it to your backend on port 4000.
 * - This avoids CORS issues and lets your frontend keep using relative paths like "/api/kyc/upload-doc".
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // keep the dev server port (optional)
    proxy: {
      // forward /api/* to backend
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
        // rewrite keeps /api in the proxied path (you can also remove rewrite if backend expects no /api prefix)
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
});
