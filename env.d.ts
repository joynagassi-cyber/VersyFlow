/// <reference types="vite/client" />

/**
 * Environment variables used across the app.
 * - VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY : Supabase project + publishable key.
 * - VITE_POWERSYNC_URL : PowerSync Cloud endpoint (e.g. https://app.powersync.com).
 * The non-VITE_ names are read as a fallback for tooling / non-client code.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_POWERSYNC_URL?: string;
  readonly SUPABASE_URL?: string;
  readonly SUPABASE_ANON_KEY?: string;
  readonly POWERSYNC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.tsx' {
  const content: React.ComponentType<any>;
  export default content;
}

declare module '*.ts' {
  const content: any;
  export default content;
}
