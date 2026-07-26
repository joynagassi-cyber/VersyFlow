/**
 * Jest Configuration
 * See docs/18-test-strategy.md for testing requirements
 */

export default {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|' +
    'expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|' +
    '@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|' +
    'react-native-svg)',
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
