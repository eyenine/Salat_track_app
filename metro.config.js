// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude native android build directories inside node_modules to prevent file-watching crashes
config.resolver.blockList = [
  /.*\/android\/\.cxx\/.*/,
  /.*\/android\/build\/.*/,
];

module.exports = config;
