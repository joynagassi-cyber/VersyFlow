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
      // Assumption: expo-async-storage getAllKeys exists
      // Si ce n'est pas le cas, implementez une tracking separate des keys
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
}

export default MmkvStorage;
