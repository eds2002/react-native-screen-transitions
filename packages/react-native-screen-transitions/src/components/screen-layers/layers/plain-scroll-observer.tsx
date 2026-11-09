import { type ComponentType, memo, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import Animated, { type SharedValue, useEvent } from "react-native-reanimated";
import type {
	NativeProps,
	ScrollObservedEvent,
} from "../../../native/RNSTScrollObserverNativeComponent";
import { useGestureScrollCoordination } from "../../../providers/motion/gestures/ownership/use-gesture-scroll-coordination";
import { updateScrollGestureAxisState } from "../../../providers/motion/gestures/scroll-coordination/update-scroll-gesture-state";
import type { ScrollGestureState } from "../../../providers/motion/gestures/types";
import { useMotionStore } from "../../../providers/motion/motion.store";

const NATIVE_NAME = "RNSTScrollObserver";

/** Whether this binary has the native observer (iOS, built with the library; not Expo Go). */
export const hasNativeScrollObserver = (() => {
	try {
		// Read lazily: test environments and other platforms may not define these.
		const { Platform, UIManager } = require("react-native");
		if (Platform?.OS !== "ios") return false;
		const hasComponent = (
			globalThis as {
				__nativeComponentRegistry__hasComponent?: (name: string) => boolean;
			}
		).__nativeComponentRegistry__hasComponent;
		if (typeof hasComponent === "function") return hasComponent(NATIVE_NAME);
		return UIManager.hasViewManagerConfig?.(NATIVE_NAME) ?? false;
	} catch {
		return false;
	}
})();

type ObserverProps = Omit<NativeProps, "onScrollObserved"> & {
	onScrollObserved?: unknown;
};

let AnimatedObserver: ComponentType<ObserverProps> | null = null;
/** Loaded on first use, so nothing touches the native spec where the observer isn't built. */
const getAnimatedObserver = () => {
	if (!AnimatedObserver) {
		const NativeObserver =
			require("../../../native/RNSTScrollObserverNativeComponent").default;
		AnimatedObserver = Animated.createAnimatedComponent(
			NativeObserver,
		) as unknown as ComponentType<ObserverProps>;
	}
	return AnimatedObserver;
};

const writeObserved = (
	states: readonly SharedValue<ScrollGestureState | null>[],
	event: ScrollObservedEvent,
) => {
	"worklet";
	const axis = event.horizontal ? "horizontal" : "vertical";
	for (let i = 0; i < states.length; i++) {
		states[i].modify(<T extends ScrollGestureState | null>(state: T): T => {
			"worklet";
			return updateScrollGestureAxisState(state, axis, {
				offset: event.offset,
				contentSize: event.contentSize,
				layoutSize: event.layoutSize,
				isTouched: event.isTouched,
			}) as T;
		});
	}
};

/**
 * Plain scroll views (not Transition.ScrollView) hand gestures to the screen: the native observer
 * reports the ones under a finger and makes them wait on the screen's gestures; this writes what it
 * reports into the scroll states the screen's gestures read, as Transition.ScrollView's handler does.
 */
export const PlainScrollObserver = memo(function PlainScrollObserver() {
	const routeKey = useMotionStore((store) => store.gestures.routeKey);
	const vertical = useGestureScrollCoordination(routeKey, "vertical");
	const horizontal = useGestureScrollCoordination(routeKey, "horizontal");

	const waitFor = useMemo(() => {
		const tags: number[] = [];
		for (const gesture of [
			...vertical.panGestures,
			...horizontal.panGestures,
		]) {
			const tag = (gesture as { handlerTag?: number }).handlerTag;
			if (typeof tag === "number" && !tags.includes(tag)) tags.push(tag);
		}
		return tags;
	}, [vertical.panGestures, horizontal.panGestures]);

	const verticalStates = vertical.scrollStates;
	const horizontalStates = horizontal.scrollStates;
	// The screen's gestures register after this mounts, and useEvent keeps its first handler
	// unless told to rebuild, so it rebuilds whenever the states it writes change.
	const lastStates = useRef<unknown[] | null>(null);
	const statesChanged =
		lastStates.current?.[0] !== verticalStates ||
		lastStates.current?.[1] !== horizontalStates;
	lastStates.current = [verticalStates, horizontalStates];
	const onScrollObserved = useEvent<ScrollObservedEvent>(
		(event) => {
			"worklet";
			writeObserved(
				event.horizontal ? horizontalStates : verticalStates,
				event,
			);
		},
		["onScrollObserved"],
		statesChanged,
	);

	const Observer = getAnimatedObserver();
	return (
		<Observer
			pointerEvents="none"
			style={styles.observer}
			waitFor={waitFor}
			onScrollObserved={onScrollObserved}
		/>
	);
});

const styles = StyleSheet.create({
	observer: { position: "absolute", width: 0, height: 0 },
});
