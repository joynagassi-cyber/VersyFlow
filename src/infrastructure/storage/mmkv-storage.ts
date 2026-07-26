/**
 * MMKV Storage Adapter
 * Primary storage for VersyFlow - fastest JS key-value store
 * See docs/10-data-model.md for storage schema
 */

import { IStorage } from './storage-types';

class MmkvStorage implements IStorage {
  private store: any;

  constructor() {
    // Lazy initialization - will be wired to actual MMKV in S0
    this.store = {
      getItem: async (key: string) => null,
      setItem: async (key: string, value: string) => {},
      removeItem: async (key: string) => {},
      getAllKeys: async () => [],
      clear: async () => {},
    };
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.store.getItem(key);
    } catch (error) {
      console.error('[MMKV] Get failed:', key, error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.store.setItem(key, value);
    } catch (error) {
      console.error('[MMKV] Set failed:', key, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.store.removeItem(key);
    } catch (error) {
      console.error('[MMKV] Delete failed:', key, error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await this.store.getAllKeys();
    } catch (error) {
      console.error('[MMKV] GetAllKeys failed:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      await this.store.clear();
    } catch (error) {
      console.error('[MMKV] Clear failed:', error);
    }
  }
}

export default MmkvStorage;
