import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Stuurt /api verzoeken naar je backend
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
