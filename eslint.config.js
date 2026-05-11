import js from '@eslint/js'
import mcvReact from '@mcv/eslint-config/react'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// Phase-0 safety rule (BANNED_VITE_KEYS_IMPORT_META) is now enforced
// upstream by @mcv/eslint-config/react with a wider provider regex
// covering ANTHROPIC | GOOGLE_AI | CLAUDE | ELEVENLABS | DEEPGRAM |
// OPENAI | GROQ | OPENROUTER | MISTRAL. See CLAUDE.md "ENVIRONMENT
// VARIABLES" + project_adk_phase0_landed.md memory for context.
//
// `tseslint.configs.recommended` is intentionally NOT extended here —
// the shared @mcv/eslint-config/react already registers the
// @typescript-eslint plugin, and adding the umbrella's recommended set
// triggers a duplicate-plugin error (different plugin instances under
// pnpm link:). The shared config carries the four core TS rules
// (no-unused-vars, no-explicit-any, consistent-type-imports,
// no-console). Restoring the rest of `tseslint.configs.recommended`
// happens in a Phase C.1 follow-up PR that widens the shared package.

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      mcvReact,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // js.configs.recommended enables the base `no-unused-vars` rule,
      // and @mcv/eslint-config/react enables `@typescript-eslint/no-unused-vars`.
      // Both fire on every unused TS variable. Standard typescript-eslint
      // configs disable the base rule for TS files; the shared config
      // doesn't yet — disable locally as a Phase C.1 follow-up bait.
      'no-unused-vars': 'off',
    },
  },
])
