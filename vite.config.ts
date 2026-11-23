import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Vite configuration for VersyFlow.
 *
 * The app is a single-page frontend with no backend: everything it needs is
 * bundled (Bible JSON, themes, icons) and every write lands in the browser's
 * localStorage. The only "server" is the optional local test collector,
 * proxied under the app origin so the browser never has to reach `localhost`
 * directly (which also works behind an HTTPS preview host).
 */

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/domains': resolve(__dirname, 'src/domains'),
      '@/services': resolve(__dirname, 'src/services'),
      '@/store': resolve(__dirname, 'src/store'),
      '@/tokens': resolve(__dirname, 'src/tokens/index'),
      '@/i18n': resolve(__dirname, 'src/i18n/index'),
      '@/infrastructure': resolve(__dirname, 'src/infrastructure'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/hooks': resolve(__dirname, 'src/hooks'),
      '@/app': resolve(__dirname, 'app'),
      '@/data': resolve(__dirname, 'data'),
    },
  },
  build: {
    outDir: 'www',
    target: 'esnext',
    minify: true,
    chunkSizeWarningLimit: 500,
    // Explicit single entry (index.html) so entry discovery is deterministic.
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    // Local test API + its dashboard. Both are proxied under the app origin so
    // the browser never has to reach `localhost` directly (works behind the
    // HTTPS sandbox preview as well as on a normal dev machine).
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
      '/mock-dashboard': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/mock-dashboard/, '') || '/',
      },
    },
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:4000', changeOrigin: true },
      '/mock-dashboard': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/mock-dashboard/, '') || '/',
      },
    },
  },
});
