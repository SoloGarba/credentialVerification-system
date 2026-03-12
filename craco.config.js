const { ProvidePlugin } = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        assert: require.resolve('assert/'),
        buffer: require.resolve('buffer/'),
        crypto: false,
        stream: false,
        os: false,
        path: false,
      };

      webpackConfig.plugins.push(
        new ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );

      return webpackConfig;
    }
  }
};