import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // When the Express/Oracle backend is running, uncomment below
      // to proxy /api requests to it during development.
      // '/api': 'http://localhost:4000'
    }
  }
})
