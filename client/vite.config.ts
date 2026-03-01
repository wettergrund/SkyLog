import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:7001',  // MyFlightbook.Api HTTPS — avoids redirect that drops Authorization header
        changeOrigin: true,
        secure: false,  // accept the self-signed dev cert
      },
    },
  },
  build: {
    outDir: '../MyFlightbook.Web/Public/spa',
    emptyOutDir: true,
  },
});
