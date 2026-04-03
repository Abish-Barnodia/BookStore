import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Listen on 0.0.0.0 so phone can reach via http://192.168.1.36:5173
    port: 5173,
    proxy: {
      // Forward API calls to the backend to avoid hard-coded ports/CORS issues in dev.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
