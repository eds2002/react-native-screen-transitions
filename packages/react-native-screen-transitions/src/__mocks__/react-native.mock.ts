import { mock } from "bun:test";

export const reactNativeMock = mock.module("react-native", () => ({
	useWindowDimensions: mock(() => ({ width: 375, height: 812 })),
	StyleSheet: {
		absoluteFillObject: {},
	},
}));
