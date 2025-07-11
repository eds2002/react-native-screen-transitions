import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["cjs", "esm"],
	dts: true,
	sourcemap: true,
	clean: true,
	external: [
		"react",
		"react-native",
		"react-native-safe-area-context",
		"react-native-gesture-handler",
		"react-native-reanimated",
		"@react-navigation/native",
		"immer",
	],
});
