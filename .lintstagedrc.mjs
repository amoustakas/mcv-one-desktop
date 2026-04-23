// .lintstagedrc.mjs
//
// Lint-ratchet — per feedback_lint_ratchet.md memory, ESLint enforcement on
// pre-commit is scoped to NEWLY-ADDED files only. Modified files bypass
// pre-commit lint so a targeted change to a legacy file (e.g., a safety
// hotfix that touches one line) does not trigger a full-file lint pass
// over pre-existing debt that is out-of-scope for the change.
//
// Full-tree lint remains available via `npm run lint` and in CI.
//
// Migrated 2026-04-23 from .lintstagedrc.json (`eslint --max-warnings 0 --fix`
// against every staged ts/tsx) during the ADK Phase-0 safety hotfix. The
// prior config blocked one-line VITE_* key removals on pre-existing
// `@typescript-eslint/no-unused-vars` errors + useCallback dep warnings in
// the touched files — exactly the friction Tony's ratchet policy calls out.

import { execFileSync } from 'node:child_process';
import path from 'node:path';

export default {
  '*.{ts,tsx}': (files) => {
    // Use execFileSync (arg array, no shell) so the git command is not
    // subject to shell injection — per security hook recommendation.
    const raw = execFileSync('git', ['diff', '--diff-filter=A', '--cached', '--name-only'], {
      encoding: 'utf8',
    });
    const added = new Set(
      raw
        .split('\n')
        .filter(Boolean)
        .map((p) => path.resolve(process.cwd(), p)),
    );
    const toLint = files.filter((f) => added.has(path.resolve(f)));
    if (toLint.length === 0) {
      // Nothing newly-added in this commit — skip lint entirely.
      return [];
    }
    return [`eslint --max-warnings 0 --fix ${toLint.map((f) => `"${f}"`).join(' ')}`];
  },
};
