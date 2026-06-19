/**
 * Catalog-parity acceptance test.
 *
 * Walks the Greek catalog (`el.ts`) and the English mirror (`en.ts`)
 * recursively, then asserts:
 *
 *   1. Every leaf in the source-of-truth (Greek) has a matching leaf
 *      in the mirror (no orphan keys in `en.ts`).
 *   2. Every leaf in the mirror has a matching leaf in the source
 *      (no orphan keys in `el.ts` either — typos cut both ways).
 *   3. The leaf kind matches (string vs function) — wrecks the runtime
 *      if a translator swaps a function for a string by accident.
 *   4. For string leaves, the set of `{{var}}` placeholders matches —
 *      text drift is fine, placeholder drift is a real bug because the
 *      runtime substitutes exactly these vars.
 *   5. For function leaves, the parameter count (`arity`) matches —
 *      surface types so a translator doesn't silently drop a parameter
 *      that mobile screens pass via the t(key, vars) helper.
 *
 * Runs on `el + en` for both backend and mobile in a single pass.
 *
 * Why no test framework: the project doesn't ship jest/vitest. Reaching
 * for a heavyweight runner to test a plain object literal is overkill.
 *
 * Why ONE script (not one per workspace): `tsx` strips
 * `import type { Pane } from '@/locales/el'` cleanly because the
 * import is type-only, so the mobile locale files resolve without
 * needing mobile's tsconfig-paths aliases.
 *
 * Run:  npx tsx scripts/test-catalog-parity.ts
 *        (or `npm run test:catalog` from backend/)
 */
import { el as backendEl } from '../src/locales/el';
import { en as backendEn } from '../src/locales/en';
import { el as mobileEl } from '../../mobile/src/locales/el';
import { en as mobileEn } from '../../mobile/src/locales/en';

// ---------------------------------------------------------------------------
// Walker — recursively flattens a nested catalog into
// `{ "dotted.key": { kind: 'string'|'function', vars?, arity? } }`.
// ---------------------------------------------------------------------------
type Leaf =
  | { kind: 'string'; vars: string[] }
  | { kind: 'function'; arity: number };

const VAR_RE = /\{\{(\w+)\}\}/g;

export const walkCatalog = (
  obj: Record<string, unknown>,
  path: string[] = [],
  out: Record<string, Leaf> = {},
): Record<string, Leaf> => {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v == null) continue; // skip undefined / null leaves gracefully
    const next = path.concat(k);
    if (typeof v === 'string') {
      // flatMap keeps zero allocations and drops the unused `!` assertion
      // by simply filtering undefined captures (which shouldn't occur
      // because the regex has one named capture group, but this is safer).
      out[next.join('.')] = {
        kind: 'string',
        vars: Array.from(v.matchAll(VAR_RE), (m) => m[1]).filter(
          (s): s is string => typeof s === 'string',
        ),
      };
    } else if (typeof v === 'function') {
      out[next.join('.')] = { kind: 'function', arity: v.length };
    } else if (Array.isArray(v)) {
      // Catalog sections are plain object sections like `kindIcon`.
      // Arrays don't carry translation entries — skip them.
      continue;
    } else if (typeof v === 'object') {
      walkCatalog(v as Record<string, unknown>, next, out);
    }
  }
  return out;
};

// ---------------------------------------------------------------------------
// Comparator — returns a list of human-readable ledger lines describing
// every drift found between a source-of-truth catalog and a mirror.
// ---------------------------------------------------------------------------
export const diffCatalogs = (
  surfacePrefix: string,
  source: Record<string, Leaf>,
  mirror: Record<string, Leaf>,
): string[] => {
  const issues: string[] = [];

  // 1) Source → Mirror: every key in the source must exist in the mirror.
  for (const k of Object.keys(source)) {
    if (!mirror[k]) {
      issues.push(
        `[${surfacePrefix}] \`${k}\`: present in source-of-truth (Greek) but missing from mirror (English). Add it to en.ts.`,
      );
    }
  }
  // 2) Mirror → Source: every key in the mirror must exist in the source.
  for (const k of Object.keys(mirror)) {
    if (!source[k]) {
      issues.push(
        `[${surfacePrefix}] \`${k}\`: present in mirror (English) but missing from source-of-truth (Greek). Either drop the English entry or add the Greek counterpart.`,
      );
    }
  }

  // 3) Type + value parity on present-in-both leaves.
  for (const k of Object.keys(source)) {
    const src = source[k];
    const mir = mirror[k];
    if (!mir) continue;

    if (src.kind !== mir.kind) {
      issues.push(
        `[${surfacePrefix}] \`${k}\`: leaf type mismatch — source is ${src.kind}, mirror is ${mir.kind}.`,
      );
      continue;
    }

    if (src.kind === 'string' && mir.kind === 'string') {
      const srcVars = new Set(src.vars);
      const mirVars = new Set(mir.vars);
      const missing = [...srcVars].filter((v) => !mirVars.has(v));
      const extra = [...mirVars].filter((v) => !srcVars.has(v));
      if (missing.length) {
        issues.push(
          `[${surfacePrefix}] \`${k}\`: source interpolates {{${missing.join(
            ', ',
          )}}} but the mirror doesn't. Wire the variable into the English copy.`,
        );
      }
      if (extra.length) {
        issues.push(
          `[${surfacePrefix}] \`${k}\`: mirror interpolates {{${extra.join(
            ', ',
          )}}} but the source doesn't. Drop the extra {{var}} from the English copy.`,
        );
      }
    } else if (src.kind === 'function' && mir.kind === 'function') {
      // Surface arity drift — mobile screens pass positional args via
      // t(key, vars), so a translator that quietly drops one argument
      // would only fail at call time, not at the catalog diff.
      if (src.arity !== mir.arity) {
        issues.push(
          `[${surfacePrefix}] \`${k}\`: function arity mismatch — source takes ${src.arity} arg(s), mirror takes ${mir.arity}.`,
        );
      }
    }
  }
  return issues;
};

// ---------------------------------------------------------------------------
// Drive the diff over both surfaces (backend + mobile).
// ---------------------------------------------------------------------------
const backendSource = walkCatalog(backendEl as unknown as Record<string, unknown>);
const backendMirror = walkCatalog(backendEn as unknown as Record<string, unknown>);
const mobileSource = walkCatalog(mobileEl as unknown as Record<string, unknown>);
const mobileMirror = walkCatalog(mobileEn as unknown as Record<string, unknown>);

const issues = [
  ...diffCatalogs('backend', backendSource, backendMirror),
  ...diffCatalogs('mobile', mobileSource, mobileMirror),
];

const totalLeaves =
  Object.keys(backendSource).length +
  Object.keys(mobileSource).length +
  Object.keys(backendMirror).length +
  Object.keys(mobileMirror).length;

console.log('— Catalog parity audit');
console.log(`  backend — Greek leaves: ${Object.keys(backendSource).length}`);
console.log(`  backend —  EN leaves : ${Object.keys(backendMirror).length}`);
console.log(`  mobile  — Greek leaves: ${Object.keys(mobileSource).length}`);
console.log(`  mobile  —  EN leaves : ${Object.keys(mobileMirror).length}`);
console.log(`  total surface area    : ${totalLeaves}`);
console.log();

if (issues.length === 0) {
  console.log(
    `✅ Catalog parity is intact — every Greek leaf has an English counterpart, leaf kinds agree, no placeholder or arity drift.`,
  );
  process.exit(0);
}

console.error(`❌ Catalog parity FAILED — ${issues.length} drift(s) found:`);
for (const i of issues) console.error(`   • ${i}`);
console.error();
console.error('Fix every line above, then re-run `npm run test:catalog`.');
process.exit(1);
