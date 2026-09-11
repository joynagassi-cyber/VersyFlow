/**
 * ESLint Configuration — VersyFlow
 */

module.exports = {
  root: true,
  ignorePatterns: ['node_modules', '.expo', 'www', 'coverage', 'dist'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'eslint:recommended',
  ],
  plugins: ['@typescript-eslint', 'import'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.app.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
  env: {
    // `globalThis`, `crypto`, `Math`, etc. — the Web + Node runtime globals
    // our shared code references. Without these, `no-undef` fires on every
    // bare global lookup (a common source of false positives in RN projects).
    es2022: true,
    node: true,
    browser: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': ['warn', { ignoreRestArgs: true }],
    '@typescript-eslint/consistent-type-imports': ['error'],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
    '@typescript-eslint/no-floating-promises': ['warn'],
    '@typescript-eslint/restrict-template-expressions': ['warn'],
    'import/no-cycle': ['error', { maxDepth: Infinity }],
    'import/no-unresolved': 'off',
    'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
    'no-debugger': 'error',
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.app.json',
      },
    },
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx', '*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
      },
    },
  ],
};
