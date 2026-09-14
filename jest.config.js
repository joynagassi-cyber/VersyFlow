/**
 * Jest Configuration
 * See docs/18-test-strategy.md for testing requirements
 */

export default {
  // Jest est obsolète — le runner actif est Vitest (voir vitest.config.ts)
  // Ce fichier est conservé uniquement pour compatibilité si des plugins en dépendent.
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/i18n/locales/**/*', // locale files don't need test coverage
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
