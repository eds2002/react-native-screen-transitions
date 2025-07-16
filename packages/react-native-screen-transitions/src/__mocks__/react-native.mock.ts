import { mock } from "bun:test";

export const reactNativeMock = mock.module("react-native", () => ({
	useWindowDimensions: mock(() => ({ width: 375, height: 812 })),
	StyleSheet: {
		absoluteFillObject: {},
	},
	Platform: {
		OS: "ios",
	},
	useSafeAreaInsets: mock(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));
