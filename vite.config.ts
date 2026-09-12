import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Vite configuration for VersyFlow.
 *
 * PowerSync web worker handling
 * -----------------------------
 * `@powersync/web/lib/worker/client.js` historically shipped
 * `new Worker(new URL('./worker.js', import.meta.url), ...)` — a pattern
 * Vite's worker plugin rewrites by bundling `./worker.js` as a separate
 * worker entry. With a code-splitting main build (multiple chunks) and the
 * default `iife` worker format, Rollup refuses:
 *   "Invalid value iife for option worker.format - UMD and IIFE output
 *    formats are not supported for code-splitting builds."
 *
 * The fix (applied at install time, see package.json `postinstall`):
 *   - `client.js` is patched so `spawnDefaultPowerSyncWorker` uses a plain
 *     string URL (`powersync-worker.js`) instead of `new URL(...)` — Vite's
 *     worker plugin only intercepts the `new URL('./...', import.meta.url)`
 *     form, so the default worker is no longer a bundling target.
 *   - `powersync-database.ts` always passes `sync.worker` pointing at the
 *     pre-bundled ES-module worker in `public/worker/powersync-worker.js`
 *     (copied from `@powersync/web/dist/worker/worker.js`), so the SDK
 *     takes the `customWorker` branch and the internal default worker is
 *     never actually invoked at runtime.
 *
 * `worker.format: 'es'` is kept so any other module worker the graph does
 * pull in (none expected after the patch) is emitted as an ES module that
 * Rollup tolerates under code splitting.
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
  },
  worker: {
    format: 'es',
  },
  server: {
    port: 3000,
  },
});
