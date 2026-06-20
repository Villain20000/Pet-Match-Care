/**
 * Stub for react-native codegen utilities on web.
 * These are no-ops — they just return their argument or an empty object.
 */
function codegenNativeCommands(config) {
  return config;
}
function codegenNativeComponent(name) {
  return name;
}
function codegenNativeViewManagerSupport() {
  return {};
}

// Support both named imports and __importDefault(.default)
module.exports = codegenNativeCommands;
module.exports.default = codegenNativeCommands;
module.exports.codegenNativeCommands = codegenNativeCommands;
module.exports.codegenNativeComponent = codegenNativeComponent;
module.exports.codegenNativeViewManagerSupport = codegenNativeViewManagerSupport;
