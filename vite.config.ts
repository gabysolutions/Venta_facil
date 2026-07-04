// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ["defaults", "iOS >= 12", "Safari >= 12"],
      modernPolyfills: true,
      renderLegacyChunks: true,
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
    }),
  ],


  esbuild: {
    target: "es2015",
  },

  build: {
    target: "es2015",
    cssTarget: "safari13",
    chunkSizeWarningLimit: 1200,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("html2canvas") || id.includes("html-to-image") || id.includes("jspdf")) {
            return "capture";
          }
          if (id.includes("sweetalert2")) return "sweetalert";
          if (id.includes("lucide-react")) return "icons";

          return "vendor";
        },
      },
    },
  },

  server: {
    proxy: {
      "/api": {
       
        target: "https://puntoventa-production-a1c6.up.railway.app",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});