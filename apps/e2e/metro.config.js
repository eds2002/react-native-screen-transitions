// The app consumes the package as workspace source, so Expo Router's SDK 56
// app-code check misclassifies library peer imports as local app imports.
process.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK ??= "1";

const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver.resolveRequest;

const reactNavigationAliases = new Map([
	["@react-navigation/core", "expo-router/react-navigation"],
	["@react-navigation/elements", "expo-router/react-navigation"],
	["@react-navigation/native", "expo-router/react-navigation"],
	["@react-navigation/routers", "expo-router/react-navigation"],
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
	const targetModuleName = reactNavigationAliases.get(moduleName) ?? moduleName;
	const resolveRequest = defaultResolveRequest ?? context.resolveRequest;

	return resolveRequest(context, targetModuleName, platform);
};

module.exports = config;
