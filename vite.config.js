import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Drop all console.* and debugger statements in production build
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          redux:  ['@reduxjs/toolkit', 'react-redux'],
          ui:     ['framer-motion', 'react-icons'],
          utils:  ['axios', 'bootstrap'],
        },
      },
    },
  },
  // Strip console.* and debugger in the esbuild minification step
  esbuild: {
    drop: ['console', 'debugger'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      'axios',
      'framer-motion',
      'react-icons',
    ],
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
})
