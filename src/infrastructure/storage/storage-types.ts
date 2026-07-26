/**
 * IStorage Interface
 * Port for storage abstraction - enables swapping implementations
 * See docs/09-architecture.md (Adapter Pattern)
 */

export interface IStorage {
  /** Get value by key, returns null if not found */
  get(key: string): Promise<string | null>;

  /** Store value with key */
  set(key: string, value: string): Promise<void>;

  /** Delete a key */
  delete(key: string): Promise<void>;

  /** Get all stored keys */
  getAllKeys(): Promise<string[]>;

  /** Clear all stored data */
  clear(): Promise<void>;
}
