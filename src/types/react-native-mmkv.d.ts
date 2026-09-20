/**
 * Type declarations for react-native-mmkv
 *
 * These stubs allow TypeScript to resolve the import before the package
 * is installed (npm install is handled by the build pipeline).
 * See docs/10-data-model.md §3 for the MMKV schema used at runtime.
 */
declare module 'react-native-mmkv' {
  export class MMKV {
    /** Initialize or open an MMKV instance with the given ID. */
    constructor(id?: string);
    /** Read a string value by key. Returns undefined if absent. */
    getString(key: string): string | undefined;
    /** Write a string value. */
    set(key: string, value: string): void;
    /** Delete a single key. */
    delete(key: string): void;
    /** Return all stored keys. */
    getAllKeys(): string[];
    /** Clear all key-value pairs. */
    clearAll(): void;
    /** Free native resources (call on unmount in React Native). */
    destroy(): void;
  }
}
