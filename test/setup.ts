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
		set(v: T | ((value: T) => T)) {
			this.value = typeof v === "function" ? v(this.value) : v;
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
}
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
mock.module("react-native-worklets", () => ({
	scheduleOnRN: <T extends (...args: any[]) => any>(
		callback: T,
		...args: Parameters<T>
	) => callback(...args),
	scheduleOnUI: <T extends (...args: any[]) => any>(
		callback: T,
		...args: Parameters<T>
	) => callback(...args),
}));
mock.module("react-native-smooth-clip-view", () => {
	let nextSmoothClipControllerId = 1;
	let nextSmoothClipRunId = 1;
	const canonicalizeClipPresentation = (presentation: any) => {
		const clip = presentation?.clip;
		const radius = clip?.radius ?? 0;
		const values = [
			clip?.x,
			clip?.y,
			clip?.width,
			clip?.height,
			clip?.topLeftRadius ?? radius,
			clip?.topRightRadius ?? radius,
			clip?.bottomRightRadius ?? radius,
			clip?.bottomLeftRadius ?? radius,
			presentation?.contentTranslateX ?? 0,
			presentation?.contentTranslateY ?? 0,
			presentation?.contentScale ?? 1,
		];
		if (values.some((value) => !Number.isFinite(value)) || values[10] <= 0) {
			return null;
		}
		return {
			clip: {
				x: values[0],
				y: values[1],
				width: values[2],
				height: values[3],
				topLeftRadius: values[4],
				topRightRadius: values[5],
				bottomRightRadius: values[6],
				bottomLeftRadius: values[7],
				curve: clip?.curve ?? "circular",
			},
			contentTranslateX: values[8],
			contentTranslateY: values[9],
			contentScale: values[10],
			...(presentation.boxShadow === undefined
				? {}
				: {
						boxShadow: {
							color: presentation.boxShadow.color ?? 0x000000ff,
							offsetX: presentation.boxShadow.offsetX ?? 0,
							offsetY: presentation.boxShadow.offsetY ?? 0,
							blurRadius: Math.max(0, presentation.boxShadow.blurRadius ?? 0),
							spreadDistance: presentation.boxShadow.spreadDistance ?? 0,
						},
					}),
		};
	};
	return {
		SmoothClipView: "SmoothClipView",
		canonicalizeClipPresentation,
		getSmoothClipCapabilities: () => ({
			autonomousComplexPathAnimation: false,
		}),
		useSmoothClipController: (initial: any) => {
			const state = React.useRef<any>(null);
			if (state.current === null) {
				let frame = canonicalizeClipPresentation(initial);
				const ref = { id: nextSmoothClipControllerId++ };
				const completion = (status: "finished" | "interrupted") => ({
					status,
					frame,
				});
				state.current = {
					ref,
					ui: {
						beginInteraction: () => frame,
						setFrame: (next: any) => {
							frame = canonicalizeClipPresentation(next);
						},
						animateTo: (target: any, _animation: any, onComplete?: any) => {
							frame = canonicalizeClipPresentation(target);
							onComplete?.(completion("finished"));
							return { id: nextSmoothClipRunId++ };
						},
						cancel: () => frame,
					},
					react: {
						animateTo: (target: any) => {
							frame = canonicalizeClipPresentation(target);
							return {
								finished: Promise.resolve(completion("finished")),
								cancel: async () => completion("interrupted"),
							};
						},
					},
				};
			}
			return state.current;
		},
		useSmoothClipGroup: () => {
			const group = React.useRef<any>(null);
			if (group.current === null) {
				const frames = new Map<number, any>();
				const snapshots = (refs: readonly { id: number }[]) =>
					refs.map((clip) => ({ clip, frame: frames.get(clip.id), ready: true }));
				group.current = {
					ui: {
						beginInteraction: snapshots,
						setFrames: (entries: readonly any[]) => {
							for (const entry of entries) {
								frames.set(entry.clip.id, canonicalizeClipPresentation(entry.frame));
							}
						},
					},
					react: {
						snapshot: async (refs: readonly { id: number }[]) => snapshots(refs),
						animateTo: (entries: readonly any[]) => {
							for (const entry of entries) {
								frames.set(entry.clip.id, canonicalizeClipPresentation(entry.target));
							}
							const result = {
								status: "finished" as const,
								snapshots: snapshots(entries.map((entry) => entry.clip)),
							};
							return {
								finished: Promise.resolve(result),
								cancel: async () => ({ ...result, status: "interrupted" as const }),
							};
						},
					},
				};
			}
			return group.current;
		},
	};
});
mock.module("react-native-gesture-handler", () => ({}));
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
