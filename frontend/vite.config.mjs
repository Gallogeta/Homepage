// Vite config for React + Tailwind
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow access from LAN
    proxy: {
      // LOCAL DEV: Points to local backend
      // PRODUCTION: Change to VM IP (e.g., 'http://192.168.0.90')
      '/api': 'http://localhost:8000'
    }
  },
});
