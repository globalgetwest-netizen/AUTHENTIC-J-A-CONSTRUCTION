// Metro config for the AUTHENTIC J.A. monorepo.
// Passing through Expo's default config enables automatic monorepo detection
// (root node_modules + workspace packages) for the Metro bundler.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;