import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// v12: sin «singlefile». El JS y el CSS van en archivos con huella (assets/…) que el navegador
// guarda un año; el HTML queda ligero y se prerenderiza (scripts/prerender.mjs).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { assetsInlineLimit: 0 }
});
