import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:5000',
      '/admin': 'http://localhost:5000',
      '/artifacts': 'http://localhost:5000',
      '/recovered': 'http://localhost:5000',
      '/cases': 'http://localhost:5000',
      '/stats': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
      '/api': 'http://localhost:5000'
    }
  }
});
