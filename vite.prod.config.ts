import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// When building for Electron, convert the output HTML to use a plain <script>
// tag (not type="module") so it loads from file:// without any CORS/ES-module
// restrictions. The IIFE bundle has no dynamic imports so this is safe.
const electronHtmlPlugin = (): Plugin => ({
  name: 'electron-html',
  transformIndexHtml(html: string) {
    return html
      // Remove module preloads — not needed for IIFE
      .replace(/<link rel="modulepreload"[^>]*>\s*/gi, '')
      // Change <script type="module" to plain <script defer.
      // type="module" is implicitly deferred (waits for DOM); removing it without
      // adding defer makes the script synchronous, so it runs before <body> is
      // parsed — getElementById('root') and document.body are both null at that
      // point. The defer attribute restores the original deferred execution.
      .replace(/<script type="module"/gi, '<script defer')
      // Strip any crossorigin attributes
      .replace(/\s+crossorigin(?:="[^"]*")?/gi, '')
  },
})

const isElectron = !!process.env.ELECTRON

export default defineConfig({
  base: './',   // always relative — works for both Electron file:// and Android
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '1.0.39'),
    __GIT_COMMIT__:  JSON.stringify(process.env.VITE_GIT_COMMIT ?? 'local'),
    __BUILD_DATE__:  JSON.stringify(new Date().toISOString().slice(0, 10)),
    // Bake Supabase creds into the bundle so they are always present even when
    // CI secrets are not configured. The fallback strings match src/lib/supabase.ts.
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      process.env.VITE_SUPABASE_URL || 'https://tzvlavmaaummnufibgkt.supabase.co'
    ),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dmxhdm1hYXVtbW51ZmliZ2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MDU1MjUsImV4cCI6MjEwMDQ4MTUyNX0.6YyJbc9FTBiCaIhbFwJB49XZi4peXq29Ek8pXnyVMvY'
    ),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    // For Electron: single IIFE bundle — no ES modules, no dynamic imports,
    // no CORS issues. Plain <script src="..."> loads from file:// perfectly.
    // For web/Android: normal chunked ESM output.
    ...(isElectron ? {
      rollupOptions: {
        output: {
          format: 'iife' as const,
          inlineDynamicImports: true,
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
    } : {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor'
            if (id.includes('node_modules/recharts')) return 'charts'
            if (id.includes('node_modules/@supabase')) return 'supabase'
          },
        },
      },
    }),
  },
  plugins: [
    react(),
    tailwindcss(),
    ...(isElectron ? [electronHtmlPlugin()] : []),
  ],
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
