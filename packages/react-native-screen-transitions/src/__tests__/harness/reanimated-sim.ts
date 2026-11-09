/**
 * A frame-accurate stand-in for Reanimated and Worklets, for tests that need
 * transitions to actually run over time (the global test setup finishes every
 * animation instantly).
 *
 * - Shared values hold Reanimated animation objects (the library's own spring,
 *   `withTiming`, `withDelay`) and step them on a fake frame clock: an animation
 *   assigned between frames starts on the next frame, like Reanimated's value
 *   setter (onStart, then onFrame, at that frame's timestamp).
 * - Reactions re-run every frame (until no reaction changes anything), and call
 *   `react` when their prepared value changed.
 * - Animated styles and props are handles the renderer passes through; the
 *   trace recorder resolves them against the current shared values.
 * - `scheduleOnRN` callbacks queue for the JS thread and run when the harness
 *   flushes them (inside React's `act`), after the frame that queued them.
 *
 * Install it per test file with `mock.module` (see `installReanimatedSim`).
 */
import * as React from "react";

type AnimationObject = {
	onStart: (
		animation: AnimationObject,
		value: unknown,
		timestamp: number,
		previous: AnimationObject | undefined,
	) => void;
	onFrame: (animation: AnimationObject, timestamp: number) => boolean;
	current: unknown;
	toValue?: unknown;
	callback?: (finished?: boolean) => void;
	[key: string]: unknown;
};

type AnimationDefinition = (() => AnimationObject) & {
	__isAnimationDefinition?: true;
};

const SHARED = Symbol("sim.shared");
const ANIMATED = Symbol("sim.animated");

export type SimMutable<T = unknown> = {
	[SHARED]: true;
	_value: T;
	value: T;
	get(): T;
	set(value: T | ((value: T) => T)): void;
	modify(modifier?: (value: T) => T, forceUpdate?: boolean): void;
	addListener(id: number, listener: (value: T) => void): void;
	removeListener(id: number): void;
};

export type AnimatedHandle = {
	[ANIMATED]: "style" | "props";
	factory: () => Record<string, unknown>;
};

type Reaction = {
	prepare: () => unknown;
	react: (value: unknown, previous: unknown) => void;
	previous: unknown;
	started: boolean;
};

const isAnimation = (value: unknown): value is AnimationObject =>
	typeof value === "object" &&
	value !== null &&
	typeof (value as AnimationObject).onFrame === "function" &&
	typeof (value as AnimationObject).onStart === "function";

const isDefinition = (value: unknown): value is AnimationDefinition =>
	typeof value === "function" &&
	(value as AnimationDefinition).__isAnimationDefinition === true;

const resolveAnimation = (value: unknown): AnimationObject | undefined => {
	if (isDefinition(value)) return value();
	if (isAnimation(value)) return value;
	return undefined;
};

/** Structural equality for reaction inputs (plain data: numbers, strings, arrays, objects). */
export const deepEqual = (a: unknown, b: unknown): boolean => {
	if (Object.is(a, b)) return true;
	if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;
	const ka = Object.keys(a);
	const kb = Object.keys(b);
	if (ka.length !== kb.length) return false;
	for (const k of ka) {
		if (!deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
			return false;
	}
	return true;
};

// Reanimated's default timing easing: Easing.inOut(Easing.quad).
const inOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

const resolveEasing = (easing: unknown): ((t: number) => number) => {
	if (typeof easing === "function") return easing as (t: number) => number;
	if (easing && typeof (easing as { factory?: unknown }).factory === "function") {
		return (easing as { factory: () => (t: number) => number }).factory();
	}
	return inOutQuad;
};

const interpolate = (
	value: number,
	inputRange: readonly number[],
	outputRange: readonly number[],
	extrapolation?: unknown,
) => {
	if (inputRange.length < 2 || outputRange.length < 2) return outputRange[0] ?? 0;
	const clampLeft =
		extrapolation === "clamp" ||
		(typeof extrapolation === "object" &&
			(extrapolation as { extrapolateLeft?: string })?.extrapolateLeft === "clamp");
	const clampRight =
		extrapolation === "clamp" ||
		(typeof extrapolation === "object" &&
			(extrapolation as { extrapolateRight?: string })?.extrapolateRight === "clamp");
	let i = 0;
	for (; i < inputRange.length - 1; i++) {
		if (value <= inputRange[i + 1]) break;
	}
	i = Math.min(i, inputRange.length - 2);
	const range = inputRange[i + 1] - inputRange[i];
	if (range === 0) return outputRange[i];
	let t = (value - inputRange[i]) / range;
	if (t < 0 && clampLeft) t = 0;
	if (t > 1 && clampRight) t = 1;
	return outputRange[i] + t * (outputRange[i + 1] - outputRange[i]);
};

const parseColor = (color: string): [number, number, number, number] => {
	const rgba = color.match(/rgba?\(([^)]+)\)/);
	if (rgba) {
		const [r, g, b, a = 1] = rgba[1].split(",").map((v) => Number.parseFloat(v));
		return [r, g, b, a];
	}
	const hex = color.replace("#", "");
	const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
	const n = Number.parseInt(full.slice(0, 6), 16);
	const alpha = full.length === 8 ? Number.parseInt(full.slice(6, 8), 16) / 255 : 1;
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255, alpha];
};

const interpolateColor = (value: number, inputRange: readonly number[], outputRange: readonly string[]) => {
	const channels = outputRange.map(parseColor);
	const mixed = [0, 1, 2, 3].map((c) =>
		interpolate(
			value,
			inputRange,
			channels.map((ch) => ch[c]),
			"clamp",
		),
	);
	return `rgba(${Math.round(mixed[0])}, ${Math.round(mixed[1])}, ${Math.round(mixed[2])}, ${mixed[3]})`;
};

export type ReanimatedSim = ReturnType<typeof createReanimatedSim>;

export const createReanimatedSim = ({ frameMs = 1000 / 60 }: { frameMs?: number } = {}) => {
	const clock = { now: 0, frame: 0, frameMs };
	const running = new Map<SimMutable, AnimationObject>();
	const pending = new Map<SimMutable, { animation: AnimationObject; previous?: AnimationObject }>();
	const reactions = new Set<Reaction>();
	const rnQueue: Array<() => void> = [];
	const uiQueue: Array<() => void> = [];
	let rafQueue: Array<(timestamp: number) => void> = [];
	const mutables: SimMutable[] = [];

	const finish = (animation: AnimationObject | undefined, finished: boolean) => {
		animation?.callback?.(finished);
	};

	const makeMutable = <T>(initial: T): SimMutable<T> => {
		const listeners = new Map<number, (value: T) => void>();
		const mutable: SimMutable<T> = {
			[SHARED]: true,
			_value: initial,
			get value() {
				return mutable._value;
			},
			set value(next: T) {
				mutable.set(next);
			},
			get() {
				return mutable._value;
			},
			set(next) {
				const resolved =
					typeof next === "function" && !isDefinition(next)
						? (next as (value: T) => T)(mutable._value)
						: next;
				const animation = resolveAnimation(resolved);
				const self = mutable as SimMutable;
				const previous = running.get(self) ?? pending.get(self)?.animation;
				if (animation) {
					running.delete(self);
					pending.set(self, { animation, previous });
					return;
				}
				if (previous) {
					running.delete(self);
					pending.delete(self);
					finish(previous, false);
				}
				mutable._value = resolved as T;
				for (const listener of listeners.values()) listener(mutable._value);
			},
			modify(modifier) {
				if (modifier) mutable._value = modifier(mutable._value);
				for (const listener of listeners.values()) listener(mutable._value);
			},
			addListener(id, listener) {
				listeners.set(id, listener);
			},
			removeListener(id) {
				listeners.delete(id);
			},
		};
		mutables.push(mutable as SimMutable);
		return mutable;
	};

	const cancelAnimation = (mutable: SimMutable) => {
		const animation = running.get(mutable) ?? pending.get(mutable)?.animation;
		running.delete(mutable);
		pending.delete(mutable);
		finish(animation, false);
	};

	const withTiming = (
		toValue: number,
		config?: { duration?: number; easing?: unknown },
		callback?: (finished?: boolean) => void,
	): AnimationObject => {
		const duration = config?.duration ?? 300;
		const easing = resolveEasing(config?.easing);
		return {
			toValue,
			current: toValue,
			callback,
			onStart(animation, value, timestamp) {
				animation.startTime = timestamp;
				animation.startValue = value;
				animation.current = value;
			},
			onFrame(animation, timestamp) {
				const elapsed = timestamp - (animation.startTime as number);
				const from = animation.startValue as number;
				if (elapsed >= duration - 1e-6 || duration <= 0) {
					animation.current = toValue;
					return true;
				}
				animation.current = from + (toValue - from) * easing(elapsed / duration);
				return false;
			},
		};
	};

	const withDelay = (delay: number, inner: unknown): AnimationObject => {
		const child = resolveAnimation(inner);
		const wrapper: AnimationObject = {
			toValue: child?.toValue,
			current: child?.current,
			callback: child?.callback,
			onStart(animation, value, timestamp, previous) {
				animation.startTime = timestamp;
				animation.startValue = value;
				animation.previous = previous;
				animation.started = false;
				animation.current = value;
			},
			onFrame(animation, timestamp) {
				if (!child) return true;
				if (!animation.started) {
					if (timestamp - (animation.startTime as number) < delay) return false;
					child.onStart(child, animation.current, timestamp, animation.previous as AnimationObject);
					animation.started = true;
				}
				const done = child.onFrame(child, timestamp);
				animation.current = child.current;
				return done;
			},
		};
		return wrapper;
	};

	// The library uses its own spring; `withSpring` is only for the rare direct use.
	const withSpring = (toValue: number, _config?: unknown, callback?: (finished?: boolean) => void) =>
		withTiming(toValue, { duration: 350 }, callback);

	const runReactions = () => {
		for (let pass = 0; pass < 10; pass++) {
			let changed = false;
			for (const reaction of reactions) {
				const next = reaction.prepare();
				if (reaction.started && deepEqual(next, reaction.previous)) continue;
				const previous = reaction.started ? reaction.previous : null;
				reaction.previous = next;
				reaction.started = true;
				reaction.react(next, previous);
				changed = true;
			}
			if (!changed) return;
		}
	};

	/** Advances the clock one frame: UI work queued since, animations, then reactions. */
	const frame = () => {
		clock.frame += 1;
		// From the frame count, not accumulated: no drift between long and short runs.
		clock.now = clock.frame * clock.frameMs;
		const now = clock.now;
		for (const task of uiQueue.splice(0)) task();
		const callbacks = rafQueue;
		rafQueue = [];
		for (const callback of callbacks) callback(now);
		for (const [mutable, { animation, previous }] of [...pending]) {
			pending.delete(mutable);
			animation.onStart(animation, mutable._value, now, previous);
			running.set(mutable, animation);
			if (previous && previous !== animation) finish(previous, false);
		}
		for (const [mutable, animation] of [...running]) {
			if (running.get(mutable) !== animation) continue;
			const done = animation.onFrame(animation, now);
			mutable._value = animation.current as never;
			if (done) {
				running.delete(mutable);
				finish(animation, true);
			}
		}
		runReactions();
	};

	const resolveAnimated = (value: unknown): unknown => {
		if (Array.isArray(value)) return value.map(resolveAnimated);
		if (value && typeof value === "object" && ANIMATED in (value as object)) {
			return (value as AnimatedHandle).factory();
		}
		return value;
	};

	// What each animated style held when the last frame was drawn. A device's measure() reads the
	// committed view (Reanimated commits animated props once per frame), not values changed since.
	const committed = new WeakMap<AnimatedHandle, unknown>();
	const handles = new Set<AnimatedHandle>();
	const commit = () => {
		for (const handle of handles) committed.set(handle, handle.factory());
	};
	const resolveCommitted = (value: unknown): unknown => {
		if (Array.isArray(value)) return value.map(resolveCommitted);
		if (value && typeof value === "object" && ANIMATED in (value as object)) {
			const handle = value as AnimatedHandle;
			return committed.has(handle) ? committed.get(handle) : handle.factory();
		}
		return value;
	};

	const isAnimatedHandle = (value: unknown): value is AnimatedHandle =>
		!!value && typeof value === "object" && ANIMATED in (value as object);

	const useAnimatedHandle = (kind: "style" | "props", factory: () => Record<string, unknown>) => {
		const ref = React.useRef<AnimatedHandle | null>(null);
		if (!ref.current) ref.current = { [ANIMATED]: kind, factory };
		ref.current.factory = factory;
		React.useEffect(() => {
			const handle = ref.current as AnimatedHandle;
			handles.add(handle);
			return () => {
				handles.delete(handle);
			};
		}, []);
		return ref.current;
	};

	const useAnimatedReaction = (
		prepare: () => unknown,
		react: (value: unknown, previous: unknown) => void,
	) => {
		const ref = React.useRef<Reaction | null>(null);
		if (!ref.current) ref.current = { prepare, react, previous: undefined, started: false };
		ref.current.prepare = prepare;
		ref.current.react = react;
		React.useEffect(() => {
			const reaction = ref.current as Reaction;
			reactions.add(reaction);
			// Reanimated runs a new mapper once when it is created.
			const next = reaction.prepare();
			if (!reaction.started || !deepEqual(next, reaction.previous)) {
				const previous = reaction.started ? reaction.previous : null;
				reaction.previous = next;
				reaction.started = true;
				reaction.react(next, previous);
			}
			return () => {
				reactions.delete(reaction);
			};
		}, []);
	};

	const reanimated = {
		makeMutable,
		isSharedValue: (value: unknown) => !!value && typeof value === "object" && SHARED in (value as object),
		useSharedValue: <T>(initial: T) => {
			const ref = React.useRef<SimMutable<T> | null>(null);
			if (!ref.current) ref.current = makeMutable(initial);
			return ref.current;
		},
		useDerivedValue: <T>(factory: () => T) => {
			const ref = React.useRef<{ factory: () => T; value: T; get: () => T } | null>(null);
			if (!ref.current) {
				const derived = {
					factory,
					get: () => derived.factory(),
					get value() {
						return derived.factory();
					},
				} as { factory: () => T; value: T; get: () => T };
				ref.current = derived;
			}
			ref.current.factory = factory;
			return ref.current;
		},
		useAnimatedReaction,
		useAnimatedStyle: (factory: () => Record<string, unknown>) => useAnimatedHandle("style", factory),
		useAnimatedProps: (factory: () => Record<string, unknown>) => useAnimatedHandle("props", factory),
		useAnimatedRef: () => {
			const ref = React.useRef<unknown>(null);
			return ref;
		},
		useAnimatedScrollHandler: <T>(handlers: T) => handlers,
		useComposedEventHandler: (handlers: unknown[]) => handlers.filter(Boolean),
		createAnimatedComponent: <T>(component: T) => component,
		default: {
			View: "AnimatedView",
			ScrollView: "AnimatedScrollView",
			FlatList: "AnimatedFlatList",
			createAnimatedComponent: <T>(component: T) => component,
		},
		Extrapolation: { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" },
		interpolate,
		interpolateColor,
		clamp: (value: number, lower: number, upper: number) => Math.min(Math.max(value, lower), upper),
		withTiming,
		withSpring,
		withDelay,
		cancelAnimation,
		// The harness resolves a measured view's on-screen box (see stack-harness `measureNode`).
		measure: (ref: { current?: { measurement?: unknown } }) =>
			(globalThis as { __harnessMeasure?: (instance: unknown) => unknown }).__harnessMeasure?.(ref?.current) ??
			ref?.current?.measurement ??
			null,
		runOnJS: <T extends (...args: never[]) => unknown>(callback: T) => callback,
		runOnUI: <T extends (...args: never[]) => unknown>(callback: T) => callback,
		executeOnUIRuntimeSync:
			<T, A extends unknown[]>(worklet: (...args: A) => T) =>
			(...args: A) =>
				worklet(...args),
		isWorkletFunction: () => true,
		Easing: {
			linear: (t: number) => t,
			quad: (t: number) => t * t,
			cubic: (t: number) => t * t * t,
			in: (easing: (t: number) => number) => easing,
			out: (easing: (t: number) => number) => (t: number) => 1 - easing(1 - t),
			inOut: (easing: (t: number) => number) => (t: number) =>
				t < 0.5 ? easing(t * 2) / 2 : 1 - easing((1 - t) * 2) / 2,
		},
	};

	const worklets = {
		runOnUISync: <T extends (...args: never[]) => unknown>(callback: T, ...args: Parameters<T>) =>
			callback(...args),
		scheduleOnRN: <T extends (...args: never[]) => unknown>(callback: T, ...args: Parameters<T>) => {
			rnQueue.push(() => callback(...args));
		},
		scheduleOnUI: <T extends (...args: never[]) => unknown>(callback: T, ...args: Parameters<T>) => {
			uiQueue.push(() => callback(...args));
		},
	};

	/** UI-thread requestAnimationFrame: runs at the start of the next frame. */
	const requestAnimationFrame = (callback: (timestamp: number) => void) => {
		rafQueue.push(callback);
		return rafQueue.length;
	};

	return {
		clock,
		reanimated,
		worklets,
		requestAnimationFrame,
		frame,
		runReactions,
		/** Runs JS-thread callbacks the UI side scheduled; returns how many ran. */
		flushRN: () => {
			const tasks = rnQueue.splice(0);
			for (const task of tasks) task();
			return tasks.length;
		},
		resolveAnimated,
		/** Animated values as the last committed frame drew them (see commit). */
		resolveCommitted,
		/** Ends a frame: what each animated style draws is what measure() reads until the next one. */
		commit,
		isAnimatedHandle,
		/** True when no animation runs or waits to start and no thread hop is queued. */
		isIdle: () =>
			running.size === 0 &&
			pending.size === 0 &&
			rnQueue.length === 0 &&
			uiQueue.length === 0 &&
			rafQueue.length === 0,
		runningCount: () => running.size + pending.size,
		/** Drops running animations and queued work (between independent mounts). */
		reset: () => {
			running.clear();
			pending.clear();
			rnQueue.length = 0;
			uiQueue.length = 0;
			rafQueue = [];
			reactions.clear();
		},
		mutables,
	};
};
