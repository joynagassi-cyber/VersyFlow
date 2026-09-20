/**
 * Jest Configuration
 * See docs/18-test-strategy.md for testing requirements
 */

export default {
  // preset: 'jest-expo', // Disabled for node tests - use babel-jest instead
  // setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(@ionic|@capacitor|@powersync|zod|zustand|react-router-dom|i18next|react-i18next|lucide-react))',
  ],
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
