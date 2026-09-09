/**
 * Capacitor Storage Adapter
 * Uses localStorage for web compatibility
 */

import type { IStorage } from './storage-types';

export class CapacitorStorage implements IStorage {
  async get(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[CapacitorStorage] Get failed:', key, error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('[CapacitorStorage] Set failed:', key, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[CapacitorStorage] Delete failed:', key, error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('[CapacitorStorage] GetAllKeys failed:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('[CapacitorStorage] Clear failed:', error);
    }
  }
}

export const capacitorStorage = new CapacitorStorage();
export default CapacitorStorage;
