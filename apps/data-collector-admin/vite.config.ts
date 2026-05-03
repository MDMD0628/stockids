import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "apps/data-collector-admin",
  build: {
    outDir: "../../dist/data-collector-admin",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    fs: {
      allow: ["../.."],
    },
  },
});
