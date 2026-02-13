import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Vercel deployment config
export default defineConfig({
  plugins: [react(),tailwindcss()],
  build: {
    outDir: 'dist',
    // Reduce large single chunks by splitting vendor files
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('framer-motion')) return 'vendor-framer-motion';
            if (id.includes('@tanstack')) return 'vendor-tanstack';
            if (id.includes('axios')) return 'vendor-axios';
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://youtubeclone-5hae.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
