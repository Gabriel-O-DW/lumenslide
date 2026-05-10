import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Para deploy no GitHub Pages, troque o `base` para "/lumenslide/"
  base: "/",
  server: {
    port: 5173,
    open: true,
  },
});
