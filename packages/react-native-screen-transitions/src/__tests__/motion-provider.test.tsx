import { afterEach, beforeEach, expect, it, mock } from "bun:test";
import { Activity, useLayoutEffect } from "react";
import { useInterpolatorState } from "../providers/screen/orchestrator/helpers/use-interpolator-state";
import { hydrateTransitionState } from "../providers/screen/motion/animation/helpers/hydrate-transition-state";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { ScrollStore } from "../stores/scroll.store";
import { useTransitionValues } from "../providers/screen/motion/hooks/use-transition-values";

// Capture native callbacks while running the real options and gesture hooks.
function gesture() {
	const callbacks: Record<string, (...args: any[]) => void> = {};
	const result: Record<string, any> = { callbacks };
	for (const name of [
		"enabled",
		"manualActivation",
		"averageTouches",
		"onTouchesDown",
		"onTouchesMove",
		"onStart",
		"onUpdate",
		"onEnd",
	]) {
		result[name] = (value: any) => {
			if (name.startsWith("on")) callbacks[name] = value;
			return result;
		};
	}
	return result;
}
const nativeGestures = await import("react-native-gesture-handler");
mock.module("react-native-gesture-handler", () => ({
	...nativeGestures,
	Gesture: {
		...nativeGestures.Gesture,
		Pan: gesture,
		Pinch: gesture,
		Simultaneous: (...gestures: unknown[]) => gestures,
	},
}));

const key = "motion-provider-test";
const route = { key, name: key };
const routes = [{ key: "previous", name: "previous" }, route];
const navigation = { getState: () => ({ routes }) };
let options = {
	gestureEnabled: true,
	gestureDirection: "horizontal" as const,
	gestureSensitivity: 1,
};
mock.module("../providers/stack/blank-stack.provider", () => ({
	useBlankStackStore: () => {
		throw new Error("Motion must not read Blank Stack");
	},
}));
let dismissRequest: (() => void) | undefined;
let animationState: ReturnType<typeof useTransitionValues>;
mock.module("../providers/screen/builder", () => ({
	useBuilderStore: (selector: (store: any) => unknown) =>
		selector({
			options,
			derivations: { currentScreenKey: key, isFirstKey: false },
			descriptors: { current: { route, navigation, options } },
		}),
}));
const {
	MotionProvider,
	useMotionStore,
	useOptionalMotionStore,
	getMotionStore,
} = await import("../providers/screen/motion/motion.provider");
type Motion = ReturnType<typeof useMotionStore>;
let local: Motion;
let remote: Motion | null;
let renderer: ReactTestRenderer | undefined;
let readerA: NonNullable<ReturnType<typeof useInterpolatorState>>;
let readerB: NonNullable<ReturnType<typeof useInterpolatorState>>;
function Probe() {
	local = useMotionStore();
	animationState = local.state;
	readerA = useInterpolatorState(local.state)!;
	readerB = useInterpolatorState(local.state)!;
	return null;
}
function RemoteProbe() {
	remote = useOptionalMotionStore(key);
	return null;
}
function Host() {
	return (
		<MotionProvider onDismissRequest={dismissRequest}>
			<Probe />
		</MotionProvider>
	);
}
function tree(mode: "visible" | "hidden" = "visible") {
	return (
		<>
			<RemoteProbe />
			<Activity mode={mode}>
				<Host />
			</Activity>
		</>
	);
}
const originalRaf = globalThis.requestAnimationFrame;
beforeEach(() => {
	globalThis.IS_REACT_ACT_ENVIRONMENT = true;
	options = {
		...options,
		gestureSensitivity: 1,
		gestureDirection: "horizontal",
	};
	dismissRequest = undefined;
	globalThis.requestAnimationFrame = (callback) => {
		callback(0);
		return 1;
	};
});
afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
	ScrollStore.clearBag(key);
	globalThis.requestAnimationFrame = originalRaf;
});

it("updates live gesture options without replacing animation values or resetting an active drag", () => {
	act(() => {
		renderer = create(tree());
	});
	const sharedOptions = local.options;
	const animations = local.state;
	expect(remote).toBe(local);
	expect(local.screenReady.get()).toBe(1);
	expect(animations.transitionProgress).toBe(remote?.state.transitionProgress);
	expect(animations).toBe(remote?.state);
	expect(animations.targetProgress).toBe(animationState.targetProgress);
	expect(animations.route).toEqual(route);
	expect(animations.options.gestureSensitivity).toBe(1);
	animations.transitionProgress.set(0.7);
	const pan = local.gestures.panGesture as unknown as ReturnType<
		typeof gesture
	>;
	pan.callbacks.onStart();
	pan.callbacks.onUpdate({
		translationX: 10,
		translationY: 0,
		velocityX: 0,
		velocityY: 0,
	});
	expect(local.state.x.get()).toBe(10);

	options = { ...options, gestureSensitivity: 2 };
	act(() => {
		renderer!.update(tree());
	});
	expect(local.options).toBe(sharedOptions);
	expect(sharedOptions.get().gestureSensitivity).toBe(2);
	expect(local.state.options.gestureSensitivity).toBe(2);
	expect(remote?.state).toBe(local.state);
	expect(local.state.transitionProgress).toBe(animations.transitionProgress);
	expect(animations.transitionProgress.get()).toBe(0.7);
	// A callback retained by the native recognizer must see the latest options.
	pan.callbacks.onUpdate({
		translationX: 20,
		translationY: 0,
		velocityX: 0,
		velocityY: 0,
	});
	expect(local.state.x.get()).toBe(30);

	act(() => {
		renderer!.update(tree("hidden"));
	});
	expect(remote).toBeNull();
	act(() => {
		renderer!.update(tree());
	});
	expect(local.options).toBe(sharedOptions);
	expect(local.state.transitionProgress).toBe(animations.transitionProgress);
	expect(remote).toBe(local);
	expect(animations.transitionProgress.get()).toBe(0.7);
});

it("shares current-screen motion while isolating each orchestrator's output and overrides", () => {
	act(() => {
		renderer = create(tree());
	});
	expect(readerA.transitionProgress).toBe(readerB.transitionProgress);
	expect(readerA.gesture).toBe(readerB.gesture);
	const first = hydrateTransitionState(
		readerA,
		{ width: 390, height: 844 },
		{ gestureEnabled: false },
	);
	const second = hydrateTransitionState(
		readerB,
		{ width: 600, height: 900 },
		{ gestureEnabled: true },
	);
	expect(first).not.toBe(second);
	expect(first.options.gestureEnabled).toBe(false);
	expect(second.options.gestureEnabled).toBe(true);
	expect(first.layouts.screen.width).toBe(390);
	expect(second.layouts.screen.width).toBe(600);
	expect(first.gesture).not.toBe(second.gesture);
	expect(local.state.options.gestureEnabled).toBe(true);
});

it("calls the host on a dismissing pan release, but not a cancelled drag", () => {
	let calls = 0;
	dismissRequest = () => {
		calls++;
	};
	act(() => {
		renderer = create(tree());
	});
	local.state.transitionProgress.set(1);
	const pan = local.gestures.panGesture as unknown as ReturnType<
		typeof gesture
	>;
	const event = (translationX: number) => ({
		translationX,
		translationY: 0,
		velocityX: 0,
		velocityY: 0,
	});
	pan.callbacks.onStart();
	local.state.initiator.set("horizontal");
	pan.callbacks.onUpdate(event(10));
	pan.callbacks.onEnd(event(10));
	expect(calls).toBe(0);
	pan.callbacks.onStart();
	local.state.initiator.set("horizontal");
	pan.callbacks.onUpdate(event(350));
	pan.callbacks.onEnd(event(350));
	expect(calls).toBe(1);
});

it("releases keyed motion on unmount and creates fresh values on remount", () => {
	act(() => {
		renderer = create(tree());
	});
	const previous = local.state;
	previous.transitionProgress.set(0.8);
	previous.x.set(42);
	expect(getMotionStore(key).state).toBe(previous);
	act(() => {
		renderer!.update(<RemoteProbe />);
	});
	expect(remote).toBeNull();
	expect(() => getMotionStore(key)).toThrow();
	act(() => {
		renderer!.update(tree());
	});
	expect(local.state.transitionProgress).not.toBe(previous.transitionProgress);
	expect(local.state.x).not.toBe(previous.x);
	expect(local.state.transitionProgress.get()).toBe(0);
	expect(local.state.x.get()).toBe(0);
});

it("derives local readiness before the Motion store is registered", () => {
	let beforeRegistration: number | undefined;
	function BeforeRegistration() {
		const motion = useMotionStore();
		useLayoutEffect(() => {
			expect(() => getMotionStore(key)).toThrow();
			motion.state.closing.set(1);
			motion.state.animationProgress.set(0);
			beforeRegistration = motion.screenReady.get();
		}, [motion]);
		return null;
	}
	options = {
		...options,
		screenStyleInterpolator: () => ({}),
	} as typeof options;
	act(() => {
		renderer = create(
			<MotionProvider>
				<BeforeRegistration />
			</MotionProvider>,
		);
	});
	expect(beforeRegistration).toBe(0);
	expect(getMotionStore(key).screenReady.get()).toBe(0);
});
