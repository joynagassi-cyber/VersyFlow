/**
 * MMKV Storage Adapter — Primary Storage for VersyFlow
 *
 * Utilise AsyncStorage comme persistance MVP. Sera remplacé par MMKV natif
 * lors de l'intégration finale du stockage optimisé.
 *
 * Architecture: Adapter pattern per Clean Architecture (ADR-006)
 * See: docs/10-data-model.md et ADR-006
 */

import { IStorage } from './storage-types';
import * as Asyncexpo from 'expo-async-storage';

/**
 * MMKV Storage — Implémentation avec AsyncStorage
 *
 * Note: Pour la version MVP, nous utilisons AsyncStorage qui est
 * inclus dans Expo et offre une persistance cross-platform.
 * Dans la version finale, ceci sera remplacé par MMKV natif.
 */
class MmkvStorage implements IStorage {
  private storage = Asyncexpo;

  async get(key: string): Promise<string | null> {
    try {
      const value = await this.storage.getItem(key);
      return value === null ? null : value;
    } catch (error) {
      console.error('[MMKV/AsyncStorage] Get failed:', key, error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.storage.setItem(key, value);
    } catch (error) {
      console.error('[MMKV/AsyncStorage] Set failed:', key, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.storage.removeItem(key);
    } catch (error) {
      console.error('[MMKV/AsyncStorage] Delete failed:', key, error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await this.storage.getAllKeys?.() || [];
    } catch (error) {
      console.error('[MMKV/AsyncStorage] GetAllKeys failed:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      await this.storage.clear?.();
    } catch (error) {
      console.error('[MMKV/AsyncStorage] Clear failed:', error);
    }
  }

  /**
   * Generate a namespaced storage key for a specific learner profile.
   * Format: versyflow:{profileId}:{originalKey}
   */
  static prefixedKey(profileId: string, key: string): string {
    return `versyflow:${profileId}:${key}`;
  }

  /**
   * Check if a key belongs to a specific profile.
   */
  static isProfileKey(key: string, profileId: string): boolean {
    return key.startsWith(`versyflow:${profileId}:`);
  }

  /**
   * Extract profile ID from a namespaced key.
   * Returns null if the key is not namespaced.
   */
  static extractProfileId(key: string): string | null {
    const prefix = 'versyflow:';
    if (!key.startsWith(prefix)) return null;
    const rest = key.slice(prefix.length);
    const parts = rest.split(':');
    return parts.length > 1 ? parts[0] : null;
  }
}

export default MmkvStorage;
