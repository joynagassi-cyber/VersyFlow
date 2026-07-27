/**
 * MMKV Storage Adapter
 * Primary storage for VersyFlow — key-value persistent store
 *
 * For MVP: Uses in-memory storage as fallback until MMKV is properly wired.
 * In production, this would use the real MMKV native module.
 * See docs/10-data-model.md for storage schema
 */

import { IStorage } from './storage-types';

/**
 * InMemoryStorage — Simple key-value store for MVP development
 * Persists only during app session (reset on reload)
 * Swappable replacement for real MMKV implementation
 */
class InMemoryStorage implements IStorage {
  private data: Record<string, string> = {};

  async get(key: string): Promise<string | null> {
    return this.data[key] !== undefined ? this.data[key] : null;
  }

  async set(key: string, value: string): Promise<void> {
    this.data[key] = value;
  }

  async delete(key: string): Promise<void> {
    delete this.data[key];
  }

  async getAllKeys(): Promise<string[]> {
    return Object.keys(this.data);
  }

  async clear(): Promise<void> {
    this.data = {};
  }
}

/**
 * MmkvStorage — Adapter implementing the IStorage interface
 *
 * This is the primary storage for settings and user preferences.
 * Currently using InMemoryStorage as MVP fallback.
 * To enable real MMKV: install @callstack/react-native-mmkv or expo-mmkv and update constructor.
 */
class MmkvStorage implements IStorage {
  private store: IStorage;

  constructor() {
    // MVP Fallback: Use in-memory storage
    // This will be wired to real MMKV in Sprint 1 (Anvil task S0-13B)
    this.store = new InMemoryStorage();

    console.log('[MmkvStorage] Using MVP fallback (in-memory)');

    // Attempt to load real MMKV if available
    try {
      // Try to import MMKV module dynamically
      // This will fail gracefully if not installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const MMKV = require('mmkv');
      const mmkvInstance = new MMKV();

      // Wrap MMKV API into IStorage interface
      this.createMMKVAdapter(mmvkInstance);
      console.log('[MmkvStorage] Successfully wired real MMKV');
    } catch (error) {
      console.warn('[MmkvStorage] MMKV not available, using in-memory fallback:', error.message);
    }
  }

  /**
   * Creates an adapter wrapper around the real MMKV instance
   */
  private createMMKVAdapter(mmvk: any): void {
    this.store = {
      async get(key: string): Promise<string | null> {
        try {
          const value = mmkv.getStringForKey(key, '');
          return value === '' ? null : value;
        } catch (e) {
          console.error('MMKV get failed:', e);
          return null;
        }
      },

      async set(key: string, value: string): Promise<void> {
        try {
          mmkv.setKeyString(key, value);
        } catch (e) {
          console.error('MMKV set failed:', e);
          throw e;
        }
      },

      async delete(key: string): Promise<void> {
        try {
          mmkv.deleteForkey(key);
        } catch (e) {
          console.error('MMKV delete failed:', e);
        }
      },

      async getAllKeys(): Promise<string[]> {
        try {
          // MMKV doesn't have a direct getAllKeys method
          // We'll need to track keys separately or use a different approach
          // For now, return empty array (to be implemented with real MMKV)
          return [];
        } catch (e) {
          console.error('MMKV getAllKeys failed:', e);
          return [];
        }
      },

      async clear(): Promise<void> {
        try {
          // Clear all data (MMKV has clearAll method)
          mmkv.clearAll();
        } catch (e) {
          console.error('MMKV clear failed:', e);
        }
      },
    };
  }

  async get(key: string): Promise<string | null> {
    return await this.store.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.store.delete(key);
  }

  async getAllKeys(): Promise<string[]> {
    return await this.store.getAllKeys();
  }

  async clear(): Promise<void> {
    await this.store.clear();
  }
}

export default MmkvStorage;
