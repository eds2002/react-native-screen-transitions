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
	var __DEV__: boolean;
	var RN$Bridgeless: boolean;
	var __reanimatedModuleProxy: Record<string, unknown>;
	var resetMutableRegistry: () => void;
	var __reanimatedMeasureSpy:
		| ((ref: { current?: { tag?: string } }) => void)
		| undefined;
}
globalThis.__DEV__ = true;
globalThis.RN$Bridgeless = true;
globalThis.__reanimatedModuleProxy = new Proxy(
	{},
	{
		get: () => () => false,
	},
);
globalThis.resetMutableRegistry = () => {
	for (const { obj, initial } of mutableObjects) {
		obj.value = cloneMutableInitialValue(initial);
	}
};

mock.module("react-native", () => ({
	View: "View",
	Text: "Text",
	Image: "Image",
	Pressable: "Pressable",
	ScrollView: "ScrollView",
	FlatList: "FlatList",
	TextInput: "TextInput",
	Switch: "Switch",
	RefreshControl: "RefreshControl",
	Platform: {
		OS: "ios",
		select: <T>(obj: { ios?: T; android?: T; default?: T }) =>
			obj.ios ?? obj.default,
	},
	StyleSheet: {
		absoluteFill: {},
		absoluteFillObject: {},
		create: <T>(styles: T) => styles,
	},
	findNodeHandle: () => null,
	TurboModuleRegistry: {
		get: () => null,
		getEnforcing: () => ({}),
	},
}));

let gestureHandlerTag = 1;
const createGesture = (type: string, config: Record<string, unknown> = {}) => ({
	handlerTag: gestureHandlerTag++,
	type,
	config,
	detectorCallbacks: {},
	gestureRelations: {
		simultaneousHandlers: [],
		waitFor: [],
		blocksHandlers: [],
	},
});

mock.module("react-native-gesture-handler", () => ({
	GestureDetector: ({ children }: { children: React.ReactNode }) => children,
	GestureHandlerRootView: ({ children }: { children: React.ReactNode }) =>
		children,
	GestureStateManager: {
		activate: () => {},
		fail: () => {},
		deactivate: () => {},
	},
	usePanGesture: (config: Record<string, unknown> = {}) =>
		createGesture("PanGestureHandler", config),
	usePinchGesture: (config: Record<string, unknown> = {}) =>
		createGesture("PinchGestureHandler", config),
	useNativeGesture: (config: Record<string, unknown> = {}) =>
		createGesture("NativeViewGestureHandler", config),
	useTapGesture: (config: Record<string, unknown> = {}) =>
		createGesture("TapGestureHandler", config),
	useCompetingGestures: (...gestures: Array<{ handlerTag: number }>) => ({
		handlerTags: gestures.map((gesture) => gesture.handlerTag),
		type: "RaceGesture",
		config: {},
		detectorCallbacks: {},
		externalSimultaneousHandlers: [],
		gestures,
	}),
	useSimultaneousGestures: (...gestures: Array<{ handlerTag: number }>) => ({
		handlerTags: gestures.map((gesture) => gesture.handlerTag),
		type: "SimultaneousGesture",
		config: {},
		detectorCallbacks: {},
		externalSimultaneousHandlers: [],
		gestures,
	}),
	useExclusiveGestures: (...gestures: Array<{ handlerTag: number }>) => ({
		handlerTags: gestures.map((gesture) => gesture.handlerTag),
		type: "ExclusiveGesture",
		config: {},
		detectorCallbacks: {},
		externalSimultaneousHandlers: [],
		gestures,
	}),
}));

const workletsMock = {
	runOnJS: <T extends (...args: any[]) => any>(callback: T) => callback,
	scheduleOnRN: <T extends (...args: any[]) => any>(
		callback: T,
		...args: Parameters<T>
	) => {
		callback(...args);
	},
};

const reanimatedMock = {
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
};

mock.module("react-native-worklets", () => workletsMock);
mock.module("react-native-reanimated", () => reanimatedMock);
mock.module(
	`${process.cwd()}/packages/react-native-screen-transitions/node_modules/react-native-worklets/lib/module/index.js`,
	() => workletsMock,
);
mock.module(
	`${process.cwd()}/packages/react-native-screen-transitions/node_modules/react-native-reanimated/lib/module/index.js`,
	() => reanimatedMock,
);
