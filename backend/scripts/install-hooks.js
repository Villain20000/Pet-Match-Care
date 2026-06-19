#!/usr/bin/env node
/**
 * Install git hooks for the project.
 *
 * Run automatically via `npm prepare`. Registers `.githooks/` as the
 * local core.hooksPath so contributors get the pre-commit catalog
 * parity check on every commit. Idempotent — only writes git config
 * when the current value differs from `.githooks`.
 */
const path = require('path');
const { spawnSync } = require('node:child_process');

const HOOKS_DIR = path.resolve(__dirname, '../../.githooks');

const isGitRepo = spawnSync('git', ['rev-parse', '--git-dir'], {
  stdio: ['ignore', 'pipe', 'pipe'],
}).status === 0;
if (!isGitRepo) {
  // No git repo (e.g. CI runner without one) — nothing to do.
  process.exit(0);
}

const current = spawnSync('git', ['config', '--get', 'core.hooksPath'], {
  encoding: 'utf8',
}).stdout.trim();

if (current === HOOKS_DIR) {
  process.exit(0);
}

const set = spawnSync('git', ['config', 'core.hooksPath', HOOKS_DIR], {
  stdio: 'inherit',
});

// Bubble up real failures (git returned non-zero, or the spawn itself
// failed — `status` is `null` when spawn can't even start).
if (set.error || set.status === null) process.exit(1);
process.exit(set.status);
