/**
 * react-native-web shim — patches missing UIManager methods that
 * react-native's internal modules expect (hasViewManagerConfig,
 * getViewManagerConfig) and fixes NativeWind dark mode for web.
 *
 * Metro redirects ALL `react-native` imports (including deep imports
 * like `react-native/Libraries/Utilities/codegenNativeCommands`) to
 * this file for web bundles.
 */
const RNW = require('react-native-web');

// Patch UIManager — react-native-web doesn't ship hasViewManagerConfig
// or getViewManagerConfig, but react-native's codegenNativeComponent
// and TextNativeComponent call them at module-evaluation time.
if (RNW.UIManager) {
  if (typeof RNW.UIManager.hasViewManagerConfig !== 'function') {
    RNW.UIManager.hasViewManagerConfig = () => false;
  }
  if (typeof RNW.UIManager.getViewManagerConfig !== 'function') {
    RNW.UIManager.getViewManagerConfig = (name) => ({
      name,
      directEventTypes: {},
      Commands: {},
    });
  }
}

// Patch NativeWind dark mode — react-native-web throws when trying
// to set color scheme with darkMode='media'. Switch to 'class' mode.
if (RNW.StyleSheet && typeof RNW.StyleSheet.setFlag === 'function') {
  try {
    RNW.StyleSheet.setFlag('darkMode', 'class');
  } catch {
    /* already set */
  }
}

// Provide stubs for react-native codegen utilities that native modules
// (react-native-maps, etc.) import at module-evaluation time.
// These are no-ops on web.
RNW.codegenNativeCommands = (config) => config;
RNW.codegenNativeComponent = (name) => name;
RNW.codegenNativeViewManagerSupport = () => ({});

module.exports = RNW;
