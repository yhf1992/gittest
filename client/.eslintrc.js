module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: false,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
};