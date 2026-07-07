import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Reheart/',  // GitHub Pages 路径
  server: {
    port: 3000,
    open: true
  }
})