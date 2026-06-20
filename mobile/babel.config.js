module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      // Inline the plugins that nativewind/babel would load,
      // but skip react-native-worklets/plugin which is only
      // needed for react-native-reanimated v4+.
      require('react-native-css-interop/dist/babel-plugin').default,
      [
        '@babel/plugin-transform-react-jsx',
        {
          runtime: 'automatic',
          importSource: 'react-native-css-interop',
        },
      ],
      // Reanimated must remain last.
      'react-native-reanimated/plugin',
    ],
  };
};
