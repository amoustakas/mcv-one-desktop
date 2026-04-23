import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Phase-0 safety rule (2026-04-23): block reads of `import.meta.env.VITE_*_API_KEY`
// for LLM / voice provider keys. Vite bundles any `VITE_*` env var into the
// public browser JS, so reading one from client code silently publishes it.
// If a feature genuinely needs a provider key in the browser, go through a
// server proxy (`/api/claude`, `/api/gemini`, `/api/_embeddings`,
// `/api/elevenlabs`) or mint a short-lived ephemeral token from
// `/api/live-ephemeral-token`. See CLAUDE.md "ENVIRONMENT VARIABLES".
const BANNED_VITE_KEYS_IMPORT_META = {
  selector:
    "MemberExpression[property.name=/^VITE_(ANTHROPIC|GOOGLE_AI|CLAUDE|ELEVENLABS|DEEPGRAM|OPENAI)_API_KEY$/]",
  message:
    'Phase-0 safety: VITE_*_API_KEY for LLM/voice providers is banned - Vite bundles these into the browser JS. Use a server proxy or ephemeral token. See CLAUDE.md.',
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-syntax': ['error', BANNED_VITE_KEYS_IMPORT_META],
    },
  },
])
