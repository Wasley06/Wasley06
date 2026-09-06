import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

/**
 * Production build config — used by GitHub Actions and Electron builder.
 * Does not include Figma Make dev-only plugins.
 */
export default defineConfig({
  base: process.env.ELECTRON ? './' : '/',
  /* ── Build metadata — same values available in Figma Make dev mode ── */
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '1.0.9'),
    __GIT_COMMIT__: JSON.stringify(process.env.VITE_GIT_COMMIT ?? 'local'),
    __BUILD_DATE__: JSON.stringify(process.env.VITE_BUILD_DATE ?? new Date().toISOString().slice(0, 10)),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor'
          if (id.includes('node_modules/recharts')) return 'charts'
          if (id.includes('node_modules/@supabase')) return 'supabase'
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
