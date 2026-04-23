// scripts/foundation/_lib/git — minimal git operations for the naming-scanner's
// apply/rollback flow. Zero-dep (child_process) so we avoid pulling simple-git
// just for these three commands.

import { execFileSync } from 'node:child_process';

function git(args: string[]): string {
  try {
    return execFileSync('git', args, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    const e = err as { stderr?: Buffer | string; message: string };
    const stderr = e.stderr
      ? (typeof e.stderr === 'string' ? e.stderr : e.stderr.toString('utf-8'))
      : '';
    throw new Error(`git ${args.join(' ')} failed: ${stderr.trim() || e.message}`);
  }
}

/** HEAD commit SHA. */
export function headSha(): string {
  return git(['rev-parse', 'HEAD']);
}

/** Current branch name, or empty string if detached HEAD. */
export function currentBranch(): string {
  try {
    return git(['rev-parse', '--abbrev-ref', 'HEAD']);
  } catch {
    return '';
  }
}

/** Refuse to operate when the working tree has uncommitted work the script didn't create. */
export function workingTreeIsClean(): { clean: boolean; dirtyPaths: string[] } {
  const out = git(['status', '--porcelain']);
  if (!out) return { clean: true, dirtyPaths: [] };
  const dirtyPaths = out
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[ MADRCU?!]{1,2}\s+/, ''));
  return { clean: false, dirtyPaths };
}

export function stagePaths(paths: string[]): void {
  if (paths.length === 0) return;
  git(['add', '--', ...paths]);
}

export function commit(message: string): string {
  git(['commit', '-m', message]);
  return headSha();
}

/** Reset the working tree + index to a prior SHA. Destructive — caller confirms. */
export function resetHard(sha: string): void {
  git(['reset', '--hard', sha]);
}

/** Create a revert commit for a target SHA. Returns the new commit SHA. */
export function revert(sha: string, message: string): string {
  git(['revert', '--no-edit', sha]);
  git(['commit', '--amend', '-m', message, '--allow-empty']);
  return headSha();
}
