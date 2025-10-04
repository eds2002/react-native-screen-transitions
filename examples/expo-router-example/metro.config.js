const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

// Ensure Metro resolves a single copy of React/React Native across the monorepo.

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.resolver ??= {};
config.resolver.extraNodeModules = {
	...(config.resolver.extraNodeModules || {}),
	react: path.join(workspaceRoot, "node_modules", "react"),
	"react-native": path.join(workspaceRoot, "node_modules", "react-native"),
};

config.watchFolders = [...(config.watchFolders || []), workspaceRoot];

module.exports = config;
