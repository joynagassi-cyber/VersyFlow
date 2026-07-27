module.exports = {
  root: true,
  ignorePatterns: ['node_modules', '.expo'],
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
    project: ['./tsconfig.json'],
    tsParseOn: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: true }],
    '@typescript-eslint/consistent-type-imports': ['error'],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnoreType: true, ignoreRestSiblings: true }],
    '@typescript-eslint/no-floating-promises': ['error'],
    '@typescript-eslint/restrict-template-expressions': ['error'],
    'import/no-cycle': ['error', { maxDepth: 3 }],
    'import/no-unresolved': ['error'],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
  },
  settings: {
    'import/resolver': {
      alias: {
        root: './src',
      },
    },
  },
};