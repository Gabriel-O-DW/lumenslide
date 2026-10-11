import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Para deploy no GitHub Pages, troque o `base` para "/lumenslide/"
  base: "/",
  // As credenciais do Supabase usam o prefixo NEXT_PUBLIC_ no .env.local
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Mesma origem no browser → sem CORS. O preview server reusa esta config.
      "/api-liturgia": {
        target: "https://api-liturgia-diaria.vercel.app",
        changeOrigin: true,
        rewrite: (p) => {
          const stripped = p.replace(/^\/api-liturgia/, "");
          return stripped === "" ? "/" : stripped;
        },
      },
    },
  },
});
