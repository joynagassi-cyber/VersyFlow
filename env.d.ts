/// <reference types="vite/client" />

/**
 * Environment variables consumed by the app.
 *
 * VersyFlow has no backend: there is no server URL, no API key and no sync
 * endpoint to configure. The only variables left select the local data scope.
 */
interface ImportMetaEnv {
  /** `mock` (demo scope) or `live` (your own local data). Defaults to demo. */
  readonly VITE_DATA_MODE?: string;
  /** `off` / `live` opens directly on the real local data instead of the demo. */
  readonly VITE_DEMO_DEFAULT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
