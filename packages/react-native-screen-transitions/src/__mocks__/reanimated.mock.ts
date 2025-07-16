import { mock } from "bun:test";
import type { Any } from "../types";

export const reanimatedMock = mock.module("react-native-reanimated", () => ({
	useSharedValue: (initialValue: number) => ({ value: initialValue }),
	useDerivedValue: mock(() => ({ value: 0 })),
	useAnimatedStyle: mock(() => ({})),
	withTiming: mock((toValue: number) => toValue),
	withSpring: mock((toValue: number) => toValue),
	interpolate: mock(
		(value: number, inputRange: number[], outputRange: number[]) => value,
	),
	makeMutable: mock((value: Any) => ({ value })),
	runOnJS: mock((fn: Any) => fn),
	cancelAnimation: mock(() => {}),
}));
