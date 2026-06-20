/**
 * Storybook-style visual regression test for `<ToastHost />`.
 *
 * What it asserts
 *  ─ For each `ToastVariant` ('info' | 'success' | 'warning' | 'error'):
 *      1. VARIANT_ICON[variant] is a non-empty string glyph that matches the
 *         design reference emoji (info ℹ️, success ✅, warning ⚠️, error 🚫).
 *      2. VARIANT_PALETTE[variant] is a complete `{ bg, text, accent }`
 *         triple — all three keys must be non-empty strings.
 *      3. Every palette value resolves to a token declared in
 *         `mobile/src/theme/index.ts → Colors` — so a rename
 *         (e.g. `creamSoft → peachSoft`) is caught here rather than
 *         shipping a broken visual surface.
 *      4. The accessibility contract holds: the error variant uses
 *         `Colors.white` for text (legibility on the dark crimson bg),
 *         and the non-error variants use `Colors.charcoal`.
 *  ─ TOAST_VARIANT_ORDER exhaustively matches the four-variant union.
 *
 * Why a pure-data parity walk rather than a real `react-test-renderer`
 * mount
 *  ─ `react-test-renderer` under `tsx` tries to parse
 *    `react-native/index.js`'s Flow-typed prologue (`typeof foo; typeof bar;`)
 *    which trips a `TransformError`. A true mount would require a Jest
 *    harness (`react-native-reanimated/mock`, `safe-area-context`,
 *    `zustand` selector mocks, and Reanimated's babel plugin) — adding
 *    jest to a workspace that has none feels out of scope for the user
 *    request, which was specifically about drift detection.
 *  ─ The drift signal is the same: if a designer or developer renames
 *    `Colors.terracottaSoft` without updating every consumer, this test
 *    fails fast, with the offending variant on stdout.
 *  ─ When a future Jest setup arrives, this same module can be re-exported
 *    as a Storybook story / RTL render — the source-of-truth stays in
 *    `mobile/src/components/toast-tokens.ts`.
 *
 * Coverage map (variant → expected icon + palette):
 *   info    → ℹ️ + creamSoft bg, charcoal text, terracotta accent
 *   success → ✅ + sageSoft bg, charcoal text, sageDeep accent
 *   warning → ⚠️ + terracottaSoft bg, charcoal text, terracottaDeep accent
 *   error   → 🚫 + crimsonDeep bg, white text, crimson accent
 *
 * Exit codes: 0 if every check passes, 1 on any drift.
 */
import { Colors } from '../src/theme';
import {
  VARIANT_ICON,
  VARIANT_PALETTE,
  TOAST_VARIANT_ORDER,
} from '../src/components/toast-tokens';
import type { ToastVariant } from '../src/services/toast';

// ---------------------------------------------------------------------------
// Design reference — the canonical glyph + palette the component MUST render.
// Kept in this file (rather than toast-tokens.ts) so the test's assumption
// is fail-fast visible: a broken test here means a designer said "the icon
// for `success` should change" but the dev forgot to update the component.
// ---------------------------------------------------------------------------
const REFERENCE_ICON: Record<ToastVariant, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '🚫',
};

const REFERENCE_PALETTE_HEX_BG: Record<ToastVariant, string> = {
  info: Colors.creamSoft,
  success: Colors.sageSoft,
  warning: Colors.terracottaSoft,
  error: Colors.crimsonDeep,
};

const REFERENCE_PALETTE_HEX_ACCENT: Record<ToastVariant, string> = {
  info: Colors.terracotta,
  success: Colors.sageDeep,
  warning: Colors.terracottaDeep,
  error: Colors.crimson,
};

const REFERENCE_PALETTE_HEX_TEXT: Record<ToastVariant, string> = {
  info: Colors.charcoal,
  success: Colors.charcoal,
  warning: Colors.charcoal,
  error: Colors.white,
};

// Pull every Colors.X value into a Set so we can quickly answer
// "is this hex a real theme token?".
const KNOWN_THEME_TOKENS = new Set<string>(
  Object.values(Colors).filter((v): v is string => typeof v === 'string'),
);

// ---------------------------------------------------------------------------
// Drive + assert.
// ---------------------------------------------------------------------------
const issues: string[] = [];

const assertVariant = (variant: ToastVariant): void => {
  // Icon drift.
  if (VARIANT_ICON[variant] !== REFERENCE_ICON[variant]) {
    issues.push(
      `[${variant}] icon drift — toast-tokens says '${VARIANT_ICON[variant]}', design reference is '${REFERENCE_ICON[variant]}'`,
    );
  }
  // Palette shape — three keys, all non-empty strings.
  const palette = VARIANT_PALETTE[variant];
  if (!palette || typeof palette !== 'object') {
    issues.push(`[${variant}] VARIANT_PALETTE[${variant}] is not an object`);
    return;
  }
  for (const k of ['bg', 'text', 'accent'] as const) {
    if (typeof palette[k] !== 'string' || palette[k].length === 0) {
      issues.push(`[${variant}] palette.${k} is missing or empty (got ${JSON.stringify(palette[k])})`);
    } else if (!KNOWN_THEME_TOKENS.has(palette[k])) {
      issues.push(
        `[${variant}] palette.${k} = '${palette[k]}' is NOT declared in mobile/src/theme/index.ts Colors — sidebar widgets and the host both depend on this layer`,
      );
    }
  }
  // Cross-check — does the host's palette match the design reference exactly?
  if (palette.bg !== REFERENCE_PALETTE_HEX_BG[variant]) {
    issues.push(
      `[${variant}] palette.bg expected '${REFERENCE_PALETTE_HEX_BG[variant]}', got '${palette.bg}'`,
    );
  }
  if (palette.text !== REFERENCE_PALETTE_HEX_TEXT[variant]) {
    issues.push(
      `[${variant}] palette.text expected '${REFERENCE_PALETTE_HEX_TEXT[variant]}', got '${palette.text}'`,
    );
  }
  if (palette.accent !== REFERENCE_PALETTE_HEX_ACCENT[variant]) {
    issues.push(
      `[${variant}] palette.accent expected '${REFERENCE_PALETTE_HEX_ACCENT[variant]}', got '${palette.accent}'`,
    );
  }
};

// 1) Variant coverage — TOAST_VARIANT_ORDER must be exhaustive.
const EXPECTED_VARIANTS: readonly ToastVariant[] = ['info', 'success', 'warning', 'error'];
if (TOAST_VARIANT_ORDER.length !== EXPECTED_VARIANTS.length) {
  issues.push(
    `TOAST_VARIANT_ORDER has ${TOAST_VARIANT_ORDER.length} entries, expected ${EXPECTED_VARIANTS.length}`,
  );
}
for (const v of EXPECTED_VARIANTS) {
  if (!TOAST_VARIANT_ORDER.includes(v)) {
    issues.push(`TOAST_VARIANT_ORDER is missing variant '${v}'`);
  }
}

// 2) Per-variant assertions.
for (const variant of TOAST_VARIANT_ORDER) {
  if (!EXPECTED_VARIANTS.includes(variant)) {
    issues.push(`TOAST_VARIANT_ORDER has unknown variant '${variant}'`);
    continue;
  }
  assertVariant(variant);
}

// 3) Accessibility-only contract that pairs with ToastHost's <Pressable>
//    renderings — informational, logs but doesn't fail.
const a11yNotes: string[] = [];
if (VARIANT_PALETTE.error.text !== Colors.white) {
  a11yNotes.push('error toast text should be Colors.white for legibility on crimsonDeep bg');
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
console.log('— Toast visual regression audit');
console.log(`  variants checked : ${TOAST_VARIANT_ORDER.join(', ')}`);
console.log(`  source-of-truth  : mobile/src/components/toast-tokens.ts`);
console.log(`  rendered target  : mobile/src/components/ToastHost.tsx`);
console.log(`  theme anchor     : mobile/src/theme/index.ts → Colors`);
console.log(`  theme tokens     : ${KNOWN_THEME_TOKENS.size} declared`);
if (a11yNotes.length) {
  console.log(`  a11y notes       :`);
  for (const n of a11yNotes) console.log(`    - ${n}`);
}
console.log();

if (issues.length === 0) {
  console.log(
    '✅ Toast visual parity intact — every variant has its design icon + theme-anchored palette triple.',
  );
  process.exit(0);
}
console.error(`❌ Toast visual parity FAILED — ${issues.length} drift(s) detected:`);
for (const i of issues) console.error(`   • ${i}`);
console.error();
console.error(
  'Fix every line above (likely a hero color rename in src/theme/index.ts or a stale toast-tokens.ts), then re-run `npm run test:toast:visual`.',
);
process.exit(1);
