/**
 * Shared `randomUUID` helper for PowerSync repositories.
 *
 * `crypto.randomUUID` is a Web / Node 19+ global. In the browser bundle it is
 * exposed by the platform; in headless Node it lives on `globalThis.crypto`.
 * The project's ESLint `env` declares both `node` and `browser`, so the
 * bare global lookup is linter-clean.
 */

const platformCrypto:
  | { randomUUID?: () => string }
  | undefined =
  typeof globalThis !== 'undefined' &&
  typeof globalThis.crypto !== 'undefined'
    ? globalThis.crypto
    : undefined;

export const randomUUID: () => string =
  typeof platformCrypto?.randomUUID === 'function'
    ? platformCrypto.randomUUID.bind(platformCrypto)
    : () => {
        // Non-cryptographic v4-shaped fallback. Sufficient for a row id that
        // Postgres will not collide on; never used where the value feeds a
        // security decision (e.g. an invitation token uses a separate path).
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };
