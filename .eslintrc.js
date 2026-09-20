/**
 * ESLint Configuration — VersyFlow
 */

module.exports = {
  root: true,
  ignorePatterns: [
    'node_modules',
    '.expo',
    'www',
    'coverage',
    'dist',
    // Stale generated artifact, kept out of the lint graph.
    'vite.config.d.ts',
    // Legacy (InsForge-era) code kept for reference.
    'docs/legacy',
  ],
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
    // tsconfig.eslint.json extends tsconfig.app.json and additionally covers
    // scripts/** (node tooling) so typed rules resolve for every linted file.
    project: ['./tsconfig.eslint.json'],
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
  // NOTE: no `import/resolver` override — `eslint-import-resolver-typescript`
  // is NOT a dependency, and configuring it emits
  // "Resolve error: typescript with invalid interface loaded as resolver"
  // on every linted file. The default node resolver is used instead
  // (import/no-cycle still checks relative imports; alias imports are
  // skipped by the rule, which is acceptable since import/no-unresolved is off).
  overrides: [
    {
      // `eslint:recommended` re-enables the base `no-undef` / `no-unused-vars`
      // on TS files, where they are false positives (types already handle
      // undefined checks) and are replaced by the typed rules above.
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off',
      },
    },
    {
      files: ['*.test.ts', '*.test.tsx', '*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
      },
    },
  ],
};
