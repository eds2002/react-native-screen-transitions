import { afterEach, beforeEach, expect, it, mock } from "bun:test";
import { Activity } from "react";
import { useInterpolatorState } from "../providers/screen/orchestrator/helpers/use-interpolator-state";
import { hydrateTransitionState } from "../providers/screen/motion/animation/helpers/hydrate-transition-state";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { AnimationStore } from "../stores/animation.store";
import { GestureStore } from "../stores/gesture.store";
import { ScrollStore } from "../stores/scroll.store";
import { useBuilderAnimationState } from "../providers/screen/builder/hooks/use-builder-animation-state";

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
	useBlankStackStore: (selector: (store: any) => unknown) => {
		const scene = {
			route,
			activity: "active",
			descriptor: { route, navigation, options },
		};
		return selector({
			scenesByKey: { [key]: scene },
			scenes: [scene],
			focusedIndex: 0,
			navigatorKey: "motion-test-stack",
			requestDismiss: () => true,
		});
	},
}));
let animationState: ReturnType<typeof useBuilderAnimationState>;
mock.module("../providers/screen/builder", () => ({
	useBuilderStore: (selector: (store: any) => unknown) =>
		selector({
			options,
			animationState,
			derivations: { currentScreenKey: key, isFirstKey: false },
			descriptors: { current: { route, navigation, options } },
		}),
}));
const { MotionProvider, useMotionStore, useOptionalMotionStore } = await import(
	"../providers/screen/motion/motion.provider"
);
type Motion = ReturnType<typeof useMotionStore>;
let local: Motion;
let remote: Motion | null;
let renderer: ReactTestRenderer | undefined;
let readerA: NonNullable<ReturnType<typeof useInterpolatorState>>;
let readerB: NonNullable<ReturnType<typeof useInterpolatorState>>;
function Probe() {
	local = useMotionStore();
	readerA = useInterpolatorState(local.animations)!;
	readerB = useInterpolatorState(local.animations)!;
	return null;
}
function RemoteProbe() {
	remote = useOptionalMotionStore(key);
	return null;
}
function Host() {
	animationState = useBuilderAnimationState();
	return (
		<MotionProvider>
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
	options = { ...options, gestureSensitivity: 1 };
	globalThis.requestAnimationFrame = (callback) => {
		callback(0);
		return 1;
	};
});
afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
	AnimationStore.clearBag(key);
	GestureStore.clearBag(key);
	ScrollStore.clearBag(key);
	globalThis.requestAnimationFrame = originalRaf;
});

it("updates live gesture options without replacing animation values or resetting an active drag", () => {
	act(() => {
		renderer = create(tree());
	});
	const sharedOptions = local.options;
	const animations = local.animations;
	expect(remote).toBe(local);
	expect(animations.transitionProgress).toBe(
		AnimationStore.getValue(key, "transitionProgress"),
	);
	expect(animations.gesture).toBe(GestureStore.getBag(key));
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
	expect(GestureStore.getValue(key, "x").get()).toBe(10);

	options = { ...options, gestureSensitivity: 2 };
	act(() => {
		renderer!.update(tree());
	});
	expect(local.options).toBe(sharedOptions);
	expect(sharedOptions.get().gestureSensitivity).toBe(2);
	expect(local.animations.options.gestureSensitivity).toBe(2);
	expect(remote?.animations).toBe(local.animations);
	expect(local.animations.transitionProgress).toBe(
		animations.transitionProgress,
	);
	expect(animations.transitionProgress.get()).toBe(0.7);
	// A callback retained by the native recognizer must see the latest options.
	pan.callbacks.onUpdate({
		translationX: 20,
		translationY: 0,
		velocityX: 0,
		velocityY: 0,
	});
	expect(GestureStore.getValue(key, "x").get()).toBe(30);

	act(() => {
		renderer!.update(tree("hidden"));
	});
	expect(remote).toBeNull();
	act(() => {
		renderer!.update(tree());
	});
	expect(local.options).toBe(sharedOptions);
	expect(local.animations.transitionProgress).toBe(
		animations.transitionProgress,
	);
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
	expect(local.animations.options.gestureEnabled).toBe(true);
});
