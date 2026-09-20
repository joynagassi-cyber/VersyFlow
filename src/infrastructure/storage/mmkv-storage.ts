/**
 * MmkvStorage — MMKV-backed storage with localStorage fallback for web
 *
 * Architecture: Adapter pattern per ADR-006
 * - Native (Capacitor): uses `react-native-mmkv` / `@capacitor-community/mmkv`
 *   for high-performance storage. The `react-native-mmkv` JS binding is
 *   resolved lazily; the native implementation is bridged by the Capacitor
 *   plugin installed on the Android/iOS shell (see package.json devDeps note
 *   below). On a pure web/WebView target without the native bridge, the
 *   dynamic import throws and we transparently fall back to localStorage.
 * - Web: falls back to localStorage
 *
 * Implements IStorage interface.
 *
 * NOTE (deployment): for the Capacitor shell to actually get the MMKV
 * native engine, install `@capacitor-community/mmkv` and bridge it into
 * `react-native-mmkv` via its recommended JS-interop layer (or keep the
 * localStorage fallback, which is fully functional for MVP-scale data).
 * Storage key schema (see docs/10-data-model.md):
 *   versyflow:settings                          → JSON UserSettings
 *   versyflow:bible:{id}                        → JSON BibleBook[]
 *   versyflow:user:memorized:{recordHash}       → JSON MemorizationRecord
 *   versyflow:user:review:{uuid}                → JSON ReviewLog
 *   versyflow:cache:{key}                       → temp data
 *   versyflow:app:{key}                         → app metadata
 */

import type { IStorage } from './storage-types';

// Lazy-loaded MMKV instance. Imported dynamically to avoid bundling
// react-native-mmkv on web builds where it is unavailable.
let _mmkv: any = null;
let _resolved = false;

/**
 * Attempt a one-shot dynamic import of react-native-mmkv.
 * Returns true if the native MMKV instance was created successfully.
 * On web the dynamic import throws and we return false.
 */
async function resolveMmkv(): Promise<boolean> {
  if (_resolved) return _mmkv !== null;
  _resolved = true;
  try {
    const mod = await import('react-native-mmkv');
    _mmkv = new mod.MMKV();
    return true;
  } catch {
    _mmkv = null;
    return false;
  }
}

export class MmkvStorage implements IStorage {
  // -- IStorage implementation ----------------------------------------------

  async get(key: string): Promise<string | null> {
    const native = await resolveMmkv();
    if (native && _mmkv) {
      try {
        return _mmkv.getString(key) ?? null;
      } catch (error) {
        console.error('[MmkvStorage] get failed:', key, error);
        return null;
      }
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[MmkvStorage] get (localStorage) failed:', key, error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    const native = await resolveMmkv();
    if (native && _mmkv) {
      try {
        _mmkv.set(key, value);
        return;
      } catch (error) {
        console.error('[MmkvStorage] set failed:', key, error);
        throw error;
      }
    }
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('[MmkvStorage] set (localStorage) failed:', key, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const native = await resolveMmkv();
    if (native && _mmkv) {
      try {
        _mmkv.delete(key);
        return;
      } catch (error) {
        console.error('[MmkvStorage] delete failed:', key, error);
      }
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[MmkvStorage] delete (localStorage) failed:', key, error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    const native = await resolveMmkv();
    if (native && _mmkv) {
      try {
        return _mmkv.getAllKeys();
      } catch (error) {
        console.error('[MmkvStorage] getAllKeys failed:', error);
        return [];
      }
    }
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('[MmkvStorage] getAllKeys (localStorage) failed:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    const native = await resolveMmkv();
    if (native && _mmkv) {
      try {
        _mmkv.clearAll();
        return;
      } catch (error) {
        console.error('[MmkvStorage] clear failed:', error);
      }
      return;
    }
    try {
      localStorage.clear();
    } catch (error) {
      console.error('[MmkvStorage] clear (localStorage) failed:', error);
    }
  }

  // -- Static helpers (from LocalStorageAdapter legacy) --------------------

  static prefixedKey(profileId: string, key: string): string {
    return `versyflow:${profileId}:${key}`;
  }

  static isProfileKey(key: string, profileId: string): boolean {
    return key.startsWith(`versyflow:${profileId}:`);
  }

  static extractProfileId(key: string): string | null {
    const prefix = 'versyflow:';
    if (!key.startsWith(prefix)) return null;
    const rest = key.slice(prefix.length);
    const parts = rest.split(':');
    return parts.length > 1 ? parts[0] : null;
  }
}
