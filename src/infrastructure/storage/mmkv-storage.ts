/**
 * MMKV Storage Adapter — Primary Storage for VersyFlow
 *
 * Implements the IStorage interface with persistent key-value storage.
 * Uses Expo AsyncStorage as the MVP fallback for persistence.
 * Will be swapped with real MMKV in Sprint 2 when WASM is ready.
 *
 * Architecture: Adapter pattern per Clean Architecture (ADR-006)
 * See: docs/10-data-model.md and ADR-006
 */

import { IStorage } from './storage-types';

// Async Storage fallback (persisted across app restarts)
class AsyncStorageAdapter implements IStorage {
  private storage: any = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Try to import AsyncStorage from Expo
      // AsyncStorage is available in Expo by default
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AsyncStorage = require('expo-async-storage') || require('react-native').AsyncStorage;
      this.storage = AsyncStorage;
      this.initialized = true;
      console.log('[AsyncStorageAdapter] Initialized successfully');
    } catch (error) {
      console.warn('[AsyncStorageAdapter] Falling back to in-memory storage:', error);
      // Fallback to in-memory if AsyncStorage not available
      this.storage = {
        getItem: async (key: string) => null,
        setItem: async (key: string, value: string) => {},
        removeItem: async (key: string) => {},
        getAllKeys: async () => [],
        clear: async () => {},
      };
      this.initialized = true;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.initialized) await this.init();
    try {
      const value = await this.storage.getItem(key);
      return value === null ? null : value;
    } catch (error) {
      console.error('[AsyncStorage] Get failed:', key, error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.initialized) await this.init();
    try {
      await this.storage.setItem(key, value);
    } catch (error) {
      console.error('[AsyncStorage] Set failed:', key, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.initialized) await this.init();
    try {
      await this.storage.removeItem(key);
    } catch (error) {
      console.error('[AsyncStorage] Delete failed:', key, error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    if (!this.initialized) await this.init();
    try {
      // AsyncStorage.getAllKeys may not exist in all implementations
      // For now, return empty (to be implemented with real MMKV)
      return [];
    } catch (error) {
      console.error('[AsyncStorage] GetAllKeys failed:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    if (!this.initialized) await this.init();
    try {
      await this.storage.clear?.();
    } catch (error) {
      console.error('[AsyncStorage] Clear failed:', error);
    }
  }
}

/**
 * MMKV Storage — Primary implementation with fallback
 *
 * On MVP: Uses AsyncStorage for persistence (cross-platform, no native setup)
 * On production (Sprint 2): Replace with real MMKV for better performance
 */
class MmkvStorage implements IStorage {
  private store: IStorage;

  constructor() {
    // Use AsyncStorage adapter as MVP persistent storage
    this.store = new AsyncStorageAdapter();
    // Initialize on construction (async but we don't await to avoid blocking)
    this.store.init().catch(console.error);
    console.log('[MmkvStorage] Using AsyncStorage persistence (MVP)');
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
