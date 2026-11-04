// Resolve every package from this app and the workspace root only, so the
// library (whose own node_modules holds dev copies of React Navigation)
// shares this app's React, Reanimated and React Navigation.
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules"), path.resolve(workspaceRoot, "node_modules")];
config.resolver.disableHierarchicalLookup = true;
