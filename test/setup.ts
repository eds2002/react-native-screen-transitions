import { mock } from "bun:test";

/**
 * Shared test setup for mocking React Native dependencies.
 * This file is preloaded before all tests via bunfig.toml.
 */

// Track all mutable objects with their initial values for reset
const mutableObjects: Array<{ obj: { value: unknown }; initial: unknown }> = [];

// Expose reset function globally for tests that need isolated mutable state
declare global {
	var resetMutableRegistry: () => void;
}
globalThis.resetMutableRegistry = () => {
	for (const { obj, initial } of mutableObjects) {
		// Deep copy the initial value to reset
		obj.value =
			typeof initial === "object" && initial !== null
				? JSON.parse(JSON.stringify(initial))
				: initial;
	}
};

mock.module("react-native", () => ({}));
mock.module("react-native-gesture-handler", () => ({}));
mock.module("react-native-reanimated", () => ({
	makeMutable: <T>(initial: T) => {
		const mutable = {
			value: initial,
			modify(fn: (v: T) => T) {
				this.value = fn(this.value);
			},
		};
		mutableObjects.push({ obj: mutable as { value: unknown }, initial });
		return mutable;
	},
	clamp: (value: number, lower: number, upper: number) =>
		Math.min(Math.max(value, lower), upper),
}));
