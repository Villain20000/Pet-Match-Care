/**
 * postinstall script — patches react-native-web and react-native-css-interop
 * so the app can run on web. These patches are needed because:
 *
 * 1. react-native-web's UIManager doesn't ship hasViewManagerConfig /
 *    getViewManagerConfig, but react-native's internal modules
 *    (codegenNativeComponent, TextNativeComponent) call them at
 *    module-evaluation time.
 *
 * 2. react-native-css-interop's color-scheme module throws when
 *    darkMode='media' and someone tries to set the color scheme
 *    (NativeWind triggers this on web).
 *
 * Run automatically via `npm postinstall` hook.
 */
const fs = require('fs');
const path = require('path');

function patchFile(filePath, find, replace) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`[patch-web-deps] file not found: ${filePath}`);
      return false;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes(find)) {
      // Already patched or pattern not found
      return false;
    }
    fs.writeFileSync(filePath, content.replace(find, replace));
    console.log(`[patch-web-deps] patched: ${filePath}`);
    return true;
  } catch (err) {
    console.warn(`[patch-web-deps] error patching ${filePath}:`, err.message);
    return false;
  }
}

const root = path.resolve(__dirname, '..');

// 1. Patch UIManager (CJS version)
patchFile(
  path.join(root, 'node_modules/react-native-web/dist/cjs/exports/UIManager/index.js'),
  '  setLayoutAnimationEnabledExperimental() {}\n};',
  '  setLayoutAnimationEnabledExperimental() {},\n  // Patches for react-native internal modules\n  hasViewManagerConfig() { return false; },\n  getViewManagerConfig(name) { return { name, directEventTypes: {}, Commands: {} }; }\n};'
);

// 1b. Patch UIManager (ESM version)
patchFile(
  path.join(root, 'node_modules/react-native-web/dist/exports/UIManager/index.js'),
  '  setLayoutAnimationEnabledExperimental() {}\n};\nexport default UIManager;',
  '  setLayoutAnimationEnabledExperimental() {},\n  // Patches for react-native internal modules\n  hasViewManagerConfig() { return false; },\n  getViewManagerConfig(name) { return { name, directEventTypes: {}, Commands: {} }; }\n};\nexport default UIManager;'
);

// 2. Patch color-scheme (no-throw on darkMode='media')
patchFile(
  path.join(root, 'node_modules/react-native-css-interop/dist/runtime/web/color-scheme.js'),
  "throw new Error(\"Cannot manually set color scheme, as dark mode is type 'media'. Please use StyleSheet.setFlag('darkMode', 'class')\");",
  '// Patched: silently ignore instead of throwing on web.\n            return;'
);

console.log('[patch-web-deps] done');
