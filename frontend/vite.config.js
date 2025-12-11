// Vite config for React + Tailwind
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow access from LAN
  },
  build: {
    sourcemap: false, // disable source maps for production to avoid exposing source
  },
});
