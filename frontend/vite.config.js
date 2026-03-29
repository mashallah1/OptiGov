import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['genlayer-js', 'genlayer-js/chains', 'genlayer-js/types'],
  },
  build: {
    commonjsOptions: {
      include: ['genlayer-js', 'genlayer-js/chains', 'genlayer-js/types'],
    },
  },
})