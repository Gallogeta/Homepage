// Vite config for React + Tailwind
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow access from LAN
    proxy: {
      // PRODUCTION: VM backend
      // LOCAL DEV: Change back to 'http://localhost:8000'
      '/api': 'http://192.168.0.90:8000'
    }
  },
});
