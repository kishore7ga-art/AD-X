import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Same `@/` convention as xite-F and xite-B, so ported files keep their
    // imports.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5174,
    /**
     * Fixed, not "whatever is free".
     *
     * The API decides who may call it from `CORS_ORIGINS`, which names an
     * origin including its port. Vite's default is to shrug and take 5175 when
     * 5174 is busy — and the resulting failure is a CORS rejection on every
     * request, which reads as a cookie problem and is nothing of the kind.
     * Better to refuse to start and say the port is taken.
     */
    strictPort: true,
  },
});
