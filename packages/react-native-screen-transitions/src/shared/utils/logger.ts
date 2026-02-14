const LIBRARY_NAME = "react-native-screen-transitions";

export const logger = {
	error(message: string) {
		"worklet";
		console.error(`[${LIBRARY_NAME}] ${message}`);
	},
	warn(message: string) {
		"worklet";
		console.warn(`[${LIBRARY_NAME}] ${message}`);
	},
};

export const error = (message: string) =>
	new Error(`[${LIBRARY_NAME}] ${message}`);
