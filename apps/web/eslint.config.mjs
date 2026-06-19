import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'wiki-legacy/', 'routeTree.gen.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  },
  {
    // Scripts are CLI tools — console.log is their output mechanism
    files: ['scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
)
