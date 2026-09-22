import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Same-origin proxy: the httpOnly session cookie and /api live on one origin.
    proxy: { '/api': `http://127.0.0.1:${process.env.API_PORT || 5000}` },
  },
})
