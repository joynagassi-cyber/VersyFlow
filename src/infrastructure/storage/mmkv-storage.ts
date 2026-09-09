/**
 * MMKV Storage Adapter — Primary Storage for VersyFlow
 *
 * Architecture: Adapter pattern per Clean Architecture (ADR-006)
 * Uses localStorage as web-compatible fallback
 */

import type { IStorage } from './storage-types';

class MmkvStorage implements IStorage {
  async get(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[MMKV/Storage] Get failed:', key, error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('[MMKV/Storage] Set failed:', key, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[MMKV/Storage] Delete failed:', key, error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('[MMKV/Storage] GetAllKeys failed:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('[MMKV/Storage] Clear failed:', error);
    }
  }

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

export default MmkvStorage;
