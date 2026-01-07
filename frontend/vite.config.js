import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss()],
  base: "/", 
  server: {
    proxy: {
      '/socket.io': {
        target: 'import.meta.env.VITE_REACT_APP_SERVER_URL',
        ws: true
      }
    }
  }
});