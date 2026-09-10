/**
 * Bible Infrastructure — JSON File Text Source
 *
 * Concrete `IBibleTextSource` implementation (LOCAL_ONLY data, no sync).
 *
 * - Web / Capacitor WebView: loads `<dataDir>/<translationId>.json` via
 *   `fetch` (Vite serves `public/` or the bundled `www/data/bible/`).
 * - Node (scripts, tests): reads from the filesystem via `fs`.
 *
 * This is the ONLY place in the codebase that reads Bible dataset files.
 * The domain repository consumes it through the `IBibleTextSource` port.
 */

import type { IBibleTextSource, BibleTranslationData } from '@/domains/bible';
import { parseTranslationData } from '@/domains/bible';

export interface BibleJsonSourceOptions {
  /**
   * Directory (web path or fs path) that holds `<translationId>.json` files.
   * - Web default: `data/bible`
   * - Node: resolved against the project root.
   */
  dataDir?: string;
  /** Override the fetch implementation (tests). */
  fetchImpl?: typeof fetch;
  /**
   * When true, load synchronously from the Node filesystem instead of fetch.
   * Auto-detected when `fetch` is undefined.
   */
  useNodeFs?: boolean;
}

export class BibleJsonFileSource implements IBibleTextSource {
  private readonly dataDir: string;
  private readonly useNodeFs: boolean;
  private readonly fetchImpl: typeof fetch | null;

  constructor(options: BibleJsonSourceOptions = {}) {
    this.dataDir = options.dataDir ?? 'data/bible';
    const hasFetch = typeof fetch === 'function' || options.fetchImpl != null;
    this.useNodeFs = options.useNodeFs ?? !hasFetch;
    this.fetchImpl = options.fetchImpl ?? (typeof fetch === 'function' ? fetch : null);
  }

  private resolvePath(translationId: string): string {
    // Guard against path traversal — only translation ids made of [a-z0-9_].
    if (!/^[a-z0-9_-]+$/.test(translationId)) {
      throw new Error(`Invalid translation id "${translationId}"`);
    }
    return `${this.dataDir}/${translationId}.json`;
  }

  async load(translationId: string): Promise<BibleTranslationData> {
    const path = this.resolvePath(translationId);
    const raw = await this.readFile(path);
    const data: unknown = JSON.parse(raw);
    return parseTranslationData(data);
  }

  private async readFile(path: string): Promise<string> {
    if (this.useNodeFs) {
      // Dynamic import keeps this module safe to bundle for the browser.
      const { readFile } = await import('node:fs/promises');
      const { resolve } = await import('node:path');
      const { cwd } = await import('node:process');
      const abs = path.startsWith('/') || path.includes('\\')
        ? path
        : resolve(cwd(), path);
      return await readFile(abs, 'utf-8');
    }
    if (!this.fetchImpl) {
      throw new Error('BibleJsonFileSource: no fetch implementation available');
    }
    const res = await this.fetchImpl(path);
    if (!res.ok) {
      throw new Error(
        `Failed to load Bible dataset "${path}" (HTTP ${res.status})`,
      );
    }
    return await res.text();
  }
}
