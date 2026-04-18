import { mock } from "bun:test";
import React from "react";

/**
 * Shared test setup for mocking React Native dependencies.
 * This file is preloaded before all tests via bunfig.toml.
 */

// Track all mutable objects with their initial values for reset
const mutableObjects: Array<{ obj: { value: unknown }; initial: unknown }> = [];

const cloneMutableInitialValue = <T>(value: T): T => {
	return typeof value === "object" && value !== null
		? JSON.parse(JSON.stringify(value))
		: value;
};

const createTestMutable = <T>(initial: T) => {
	const mutable = {
		value: cloneMutableInitialValue(initial),
		modify(fn: (v: T) => T) {
			this.value = fn(this.value);
		},
		get() {
			return this.value;
		},
		set(v: T) {
			this.value = v;
		},
	};

	mutableObjects.push({
		obj: mutable as { value: unknown },
		initial: cloneMutableInitialValue(initial),
	});

	return mutable;
};

// Expose reset function globally for tests that need isolated mutable state
declare global {
	var resetMutableRegistry: () => void;
	var __reanimatedMeasureSpy:
		| ((ref: { current?: { tag?: string } }) => void)
		| undefined;
	var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.resetMutableRegistry = () => {
	for (const { obj, initial } of mutableObjects) {
		obj.value = cloneMutableInitialValue(initial);
	}
};

mock.module("react-native", () => ({
	Platform: {
		OS: "ios",
		select: <T>(obj: { ios?: T; android?: T; default?: T }) =>
			obj.ios ?? obj.default,
	},
}));
mock.module("react-native-gesture-handler", () => ({}));
mock.module("react-native-worklets", () => ({
	runOnUISync: <T, A extends unknown[]>(
		worklet: (...args: A) => T,
		...args: A
	): T => worklet(...args),
	scheduleOnRN: <A extends unknown[]>(
		callback: (...args: A) => void,
		...args: A
	) => callback(...args),
}));
mock.module("react-native-reanimated", () => ({
	makeMutable: createTestMutable,
	createAnimatedComponent: <T>(component: T) => component,
	Extrapolation: { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" },
	interpolate: (
		value: number,
		inputRange: number[],
		outputRange: number[],
		extrapolation?: string,
	) => {
		if (inputRange.length < 2 || outputRange.length < 2)
			return outputRange[0] ?? 0;
		// Find segment
		let i = 0;
		for (; i < inputRange.length - 1; i++) {
			if (value <= inputRange[i + 1]) break;
		}
		i = Math.min(i, inputRange.length - 2);
		const inputMin = inputRange[i];
		const inputMax = inputRange[i + 1];
		const outputMin = outputRange[i];
		const outputMax = outputRange[i + 1];
		const range = inputMax - inputMin;
		if (range === 0) return outputMin;
		let t = (value - inputMin) / range;
		if (extrapolation === "clamp") {
			t = Math.min(Math.max(t, 0), 1);
		}
		return outputMin + t * (outputMax - outputMin);
	},
	cancelAnimation: () => {},
	isWorkletFunction: () => true,
	clamp: (value: number, lower: number, upper: number) =>
		Math.min(Math.max(value, lower), upper),
	measure: (ref: { current?: { measurement?: unknown; tag?: string } }) => {
		globalThis.__reanimatedMeasureSpy?.(ref);
		return ref.current?.measurement ?? null;
	},
	runOnJS: <T extends (...args: any[]) => any>(callback: T) => callback,
	runOnUI: <T extends (...args: any[]) => any>(callback: T) => callback,
	useAnimatedReaction: (
		prepare: () => unknown,
		react: (value: unknown, previousValue: unknown) => void,
	) => {
		const previousValue = React.useRef<unknown>(null);

		React.useEffect(() => {
			const nextValue = prepare();
			react(nextValue, previousValue.current);
			previousValue.current = nextValue;
		});
	},
	useSharedValue: <T>(initial: T) =>
		React.useRef(createTestMutable(initial)).current,
	withTiming: (
		toValue: number,
		config?: { __finished?: boolean },
		callback?: (finished?: boolean) => void,
	) => {
		callback?.(config?.__finished ?? true);
		return toValue;
	},
	withDelay: (_delayMs: number, value: unknown) => value,
	withSpring: (
		toValue: number,
		config?: { __finished?: boolean },
		callback?: (finished?: boolean) => void,
	) => {
		callback?.(config?.__finished ?? true);
		return toValue;
	},
	// Mock executeOnUIRuntimeSync - in tests, just execute the worklet directly
	executeOnUIRuntimeSync: <T, A extends unknown[]>(
		worklet: (...args: A) => T,
	) => {
		return (...args: A): T => worklet(...args);
	},
}));
