// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import path from "path";

// const API_BASE_URL =
//   process.env.VITE_API_BASE_URL || "http://localhost:3000";

// export default defineConfig({
//   // if you really want your .env files in the ui package,
//   // but usually you'd point envDir at the root of this app:
//   // envDir: path.resolve(__dirname, "../../packages/ui"),
  
//   plugins: [react()],

//   resolve: {
//     alias: {
//       // your existing workspace-ui alias
//       "@repo/ui": path.resolve(__dirname, "../../packages/ui/src"),
//       // add this so "@/foo" → apps/web/src/foo
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },

//   server: {
//     host: "0.0.0.0",
//     port: 5173,
//     strictPort: true,
//     // hmr: { clientPort: 443 },
//     cors: true,

//     proxy: {
//       "/api": {
//         target: API_BASE_URL || "http://localhost:3000", // e.g., http://localhost:3000
//         changeOrigin: true,
//         secure: false,
//         rewrite: (p) => p, // don't strip `/api`
//       },
//     },
//   },
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const API_BASE_URL =
  process.env.VITE_API_BASE_URL || "https://api.deepfry.tech";

export default defineConfig({
  // if you really want your .env files in the ui package,
  // but usually you'd point envDir at the root of this app:
  // envDir: path.resolve(__dirname, "../../packages/ui"),
  
  plugins: [react()],

  resolve: {
    alias: {
      // your existing workspace-ui alias
      "@repo/ui": path.resolve(__dirname, "../../packages/ui/src"),
      // add this so "@/foo" → apps/web/src/foo
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: { clientPort: 443 },
    cors: true,

    proxy: {
      "/api": {
        target: API_BASE_URL,
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
