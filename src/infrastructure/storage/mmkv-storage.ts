/**
 * MmkvStorage — localStorage-backed storage adapter
 *
 * Architecture: Adapter pattern per ADR-006
 * - Web / Capacitor WebView: uses localStorage (primary path)
 * - Native MMKV: optional Capacitor native enhancement via
 *   `@capacitor-community/mmkv`. When available, the app can be
 *   extended to bridge MMKV for higher-performance persistence.
 *   Until then, localStorage provides fully functional MVP-scale
 *   persistence for all stored entities.
 *
 * Implements IStorage interface.
 *
 * Storage key schema (see docs/10-data-model.md):
 *   versyflow:settings                          → JSON UserSettings
 *   versyflow:bible:{id}                        → JSON BibleBook[]
 *   versyflow:user:memorized:{recordHash}       → JSON MemorizationRecord
 *   versyflow:user:review:{uuid}                → JSON ReviewLog
 *   versyflow:cache:{key}                       → temp data
 *   versyflow:app:{key}                         → app metadata
 */

import type { IStorage } from './storage-types';

export class MmkvStorage implements IStorage {
  // -- IStorage implementation ----------------------------------------------

  async get(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[MmkvStorage] get failed:', key, error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('[MmkvStorage] set failed:', key, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[MmkvStorage] delete failed:', key, error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('[MmkvStorage] getAllKeys failed:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('[MmkvStorage] clear failed:', error);
    }
  }

  // -- Static helpers -------------------------------------------------------

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
