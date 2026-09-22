import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal typing for the one Node global used here (avoids adding @types/node).
declare const process: { env: Record<string, string | undefined> }

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Same-origin proxy: the httpOnly session cookie and /api live on one origin.
    proxy: { '/api': `http://127.0.0.1:${process.env.API_PORT || 5000}` },
  },
})
