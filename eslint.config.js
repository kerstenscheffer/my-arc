import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      // __APP_VERSIE__ zet Vite erin bij het bouwen (zie vite.config.js).
      globals: { ...globals.browser, __APP_VERSIE__: 'readonly', __APP_VERSIE_ANDROID__: 'readonly' },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // De serverless functies in /api draaien op Node, niet in de browser.
    // Zonder deze uitzondering meldt de linter `process is not defined` in elk
    // van die bestanden, en die ruis verbergt echte fouten.
    files: ['api/**/*.js', 'scripts/**/*.{js,mjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])
