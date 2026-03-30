import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['genlayer-js', 'genlayer-js/chains', 'genlayer-js/types'],
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    commonjsOptions: {
      include: ['genlayer-js', 'genlayer-js/chains', 'genlayer-js/types'],
    },
  },
})