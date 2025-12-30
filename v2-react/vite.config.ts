import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',
  base: '/v2-react/',
  publicDir: 'public',
  build: {
    outDir: '../v2-react-build',
    emptyOutDir: true
  }
})
