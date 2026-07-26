/**
 * AsyncStorage Fallback Adapter
 * Secondary storage when MMKV is unavailable
 * See docs/09-architecture.md (Adapter Pattern)
 */

import { IStorage } from './storage-types';

class AsyncStorageAdapter implements IStorage {
  private storage: any;

  constructor() {
    // Lazy import - won't work without actual AsyncStorage injected
    this.storage = {
      getItem: async (_key: string) => null,
      setItem: async (_key: string, _value: string) => {},
      removeItem: async (_key: string) => {},
      getAllKeys: async () => [],
      clear: async () => {},
    };
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.storage.getItem(key);
    } catch (error) {
      console.error('[AsyncStorage] Get failed:', key, error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.storage.setItem(key, value);
    } catch (error) {
      console.error('[AsyncStorage] Set failed:', key, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.storage.removeItem(key);
    } catch (error) {
      console.error('[AsyncStorage] Delete failed:', key, error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await this.storage.getAllKeys();
    } catch (error) {
      console.error('[AsyncStorage] GetAllKeys failed:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      await this.storage.clear();
    } catch (error) {
      console.error('[AsyncStorage] Clear failed:', error);
    }
  }
}

export default AsyncStorageAdapter;
