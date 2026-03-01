import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: ["defaults", "iOS >= 12", "Safari >= 12"],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
      modernPolyfills: true,
    }),
  ],

  build: {
    target: "es2015",


    chunkSizeWarningLimit: 1200,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

     
          if (id.includes("html2canvas") || id.includes("html-to-image")) return "capture";

          
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
        target: "https://puntoventa-production-a1c6.up.railway.app/",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});