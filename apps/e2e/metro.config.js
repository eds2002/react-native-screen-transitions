const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const expoRouterNavigationPackages = new Set([
	"bottom-tabs",
	"core",
	"drawer",
	"elements",
	"material-top-tabs",
	"native",
	"native-stack",
	"routers",
	"stack",
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
	const match = /^@react-navigation\/([^/]+)(\/.*)?$/.exec(moduleName);

	if (match && expoRouterNavigationPackages.has(match[1])) {
		return context.resolveRequest(
			context,
			`expo-router/build/react-navigation/${match[1]}${match[2] ?? ""}`,
			platform,
		);
	}

	return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
