const LIBRARY_NAME = "react-native-screen-transitions";

const warnedKeys = new Set<string>();

export const logger = {
	error(message: string) {
		"worklet";
		console.error(`[${LIBRARY_NAME}] ${message}`);
	},
	warn(message: string) {
		"worklet";
		console.warn(`[${LIBRARY_NAME}] ${message}`);
	},
	/**
	 * Warns at most once per `key` for the lifetime of the JS context. Use for
	 * install/config-level conditions that would otherwise spam every render or
	 * every mounted instance. JS-thread only (not a worklet).
	 */
	warnOnce(key: string, message: string) {
		if (warnedKeys.has(key)) return;
		warnedKeys.add(key);
		console.warn(`[${LIBRARY_NAME}] ${message}`);
	},
};
