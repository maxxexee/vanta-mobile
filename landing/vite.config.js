import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The wallet app runs on its own Vite server; the marketing site takes :3002.
// The app link is resolved in src/config.js (APP_URL) rather than proxied: Vite's
// HTML fallback claims `/app/` before a proxy would, and serving this page for it
// is the bug that made the button look like a reload.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3002 },
  preview: { port: 3002 },
})
