import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const entry = (file) => fileURLToPath(new URL(file, import.meta.url))

export default defineConfig({
  root: entry('./web'),
  // Endpoints and keys live in the project's .env files, not inside web/.
  // Without this a dev server or APK build silently falls back to the public
  // devnet RPC and the Privacy Rings services are never reachable.
  envDir: entry('.'),
  // Relative asset URLs so the same build works from a web root AND from the
  // APK's bundled assets at https://appassets.androidplatform.net/assets/www/.
  base: './',
  plugins: [tailwindcss()],
  server: { port: 3100, strictPort: true },
  build: {
    outDir: entry('./dist'),
    emptyOutDir: true,
    // The only runtime is Chrome 137+ (Solana Mobile webshell) and current
    // mobile browsers, so shipping native classes is safe.
    target: 'esnext',
    rollupOptions: {
      input: {
        index: entry('./web/index.html'),
        onboarding: entry('./web/onboarding.html'),
      },
    },
  },
  resolve: {
    alias: {
      // The Zolana SDK's TEE attestation path pulls a CommonJS crypto shim.
      crypto: 'crypto-browserify',
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
})
