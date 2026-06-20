const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add web to the list of platforms so Metro resolves `.web.js` extensions.
config.resolver.platforms = [...config.resolver.platforms, 'web'];

// Apply NativeWind FIRST so its resolver is innermost.
const nativeWindConfig = withNativeWind(config, { input: './global.css' });

// NOW install our web resolver as the outermost layer.
const rnWebShimPath = require.resolve('./rn-web-shim.js');

const innerResolveRequest = nativeWindConfig.resolver.resolveRequest;
nativeWindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'react-native' || moduleName.startsWith('react-native/')) {
      console.log(`[SHIM] redirecting "${moduleName}" (platform=${platform}) → rn-web-shim.js`);
      return {
        filePath: rnWebShimPath,
        type: 'sourceFile',
      };
    }
  }
  if (innerResolveRequest) {
    return innerResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = nativeWindConfig;
