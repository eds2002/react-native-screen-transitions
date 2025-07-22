import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
	return {
		...config,

		name: "e2e",
		slug: "e2e",
		version: "1.0.0",
		orientation: "portrait",
		scheme: "e2e",
		userInterfaceStyle: "automatic",
		newArchEnabled: true,
		splash: {
			resizeMode: "contain",
			backgroundColor: "#ffffff",
		},
		ios: {
			supportsTablet: true,
			bundleIdentifier: "com.dev.e2e",
		},
		android: {
			adaptiveIcon: {
				backgroundColor: "#ffffff",
			},
			edgeToEdgeEnabled: true,
			package: "com.dev.e2e",
		},
		web: {
			bundler: "metro",
			output: "static",
		},
		plugins: ["expo-router"],
		experiments: {
			typedRoutes: true,
		},
	};
};
