import { mock } from "bun:test";
import type { Any } from "@/types";

export const reanimatedMock = mock.module("react-native-reanimated", () => ({
	makeMutable: mock((initialValue: number) => ({ value: initialValue })),
	cancelAnimation: mock(() => {}),
	runOnJS: mock((fn: Any) => fn),
	SharedValue: {},
	withSpring: mock((value: number) => value),
	withTiming: mock((value: number) => value),
}));
