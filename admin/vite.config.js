import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on 0.0.0.0 so devices on LAN can reach via http://YOUR_IP:5174
    port: 5174,
  },
})