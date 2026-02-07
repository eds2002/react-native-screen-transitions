import { useFocusEffect } from "@react-navigation/native";
import { type ReactNode, useCallback, useMemo, useRef } from "react";
import type { View } from "react-native";
import {
	type AnimatedRef,
	measure,
	runOnJS,
	runOnUI,
	type StyleProps,
	useAnimatedReaction,
	useSharedValue,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated/lib/typescript/commonTypes";
import useStableCallback from "../hooks/use-stable-callback";
import useStableCallbackValue from "../hooks/use-stable-callback-value";
import { AnimationStore } from "../stores/animation.store";
import { BoundStore } from "../stores/bounds.store";
import { prepareStyleForBounds } from "../utils/bounds/helpers/styles";
import createProvider from "../utils/create-provider";
import { useLayoutAnchorContext } from "./layout-anchor.provider";
import { type BaseDescriptor, useKeys } from "./screen/keys.provider";

interface MaybeMeasureAndStoreParams {
	onPress?: ((...args: unknown[]) => void) | undefined;
	shouldSetSource?: boolean;
	shouldSetDestination?: boolean;
	shouldUpdateSource?: boolean;
}

interface RegisterBoundsRenderProps {
	handleInitialLayout: () => void;
	captureActiveOnPress: () => void;
}

interface RegisterBoundsProviderProps {
	sharedBoundTag?: string;
	animatedRef: AnimatedRef<View>;
	style: StyleProps;
	onPress?: ((...args: unknown[]) => void) | undefined;
	remeasureOnFocus?: boolean;
	children: (props: RegisterBoundsRenderProps) => ReactNode;
}

interface RegisterBoundsContextValue {
	updateSignal: SharedValue<number>;
}

/**
 * Builds the full ancestor key chain for nested navigators.
 * Returns an array of screen keys from immediate parent to root.
 * [parentKey, grandparentKey, greatGrandparentKey, ...]
 */
const getAncestorKeys = (current: BaseDescriptor): string[] => {
	const ancestors: string[] = [];
	const nav = current.navigation as any;

	// Safety check for navigators without getParent
	if (typeof nav?.getParent !== "function") {
		return ancestors;
	}

	let parent = nav.getParent();

	while (parent) {
		const state = parent.getState();
		if (state?.routes && state.index !== undefined) {
			const focusedRoute = state.routes[state.index];
			if (focusedRoute?.key) {
				ancestors.push(focusedRoute.key);
			}
		}
		parent = parent.getParent();
	}

	return ancestors;
};

/**
 * Handles initial layout measurement for destination elements.
 * Only measures if an animation is in progress (local or parent).
 */
const useInitialLayoutHandler = (params: {
	sharedBoundTag?: string;
	currentScreenKey: string;
	ancestorKeys: string[];
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		sharedBoundTag,
		currentScreenKey,
		ancestorKeys,
		maybeMeasureAndStore,
	} = params;

	const isAnimating = AnimationStore.getAnimation(
		currentScreenKey,
		"animating",
	);

	// Check if any ancestor is animating
	const ancestorAnimations = ancestorKeys.map((key) =>
		AnimationStore.getAnimation(key, "animating"),
	);

	const hasMeasuredOnLayout = useSharedValue(false);

	return useCallback(() => {
		"worklet";
		if (!sharedBoundTag || hasMeasuredOnLayout.get()) return;

		// Check if current or any ancestor is animating
		let isAnyAnimating = isAnimating.get();
		for (let i = 0; i < ancestorAnimations.length; i++) {
			if (ancestorAnimations[i].get()) {
				isAnyAnimating = 1;
				break;
			}
		}

		if (!isAnyAnimating) return;

		maybeMeasureAndStore({
			shouldSetSource: false,
			shouldSetDestination: true,
		});

		hasMeasuredOnLayout.set(true);
	}, [
		sharedBoundTag,
		hasMeasuredOnLayout,
		isAnimating,
		ancestorAnimations,
		maybeMeasureAndStore,
	]);
};

/**
 * Measures non-pressable elements when screen becomes blurred.
 * Captures bounds right before transition starts.
 */
/**
 * Measures non-pressable elements when screen becomes blurred.
 * Captures bounds right before transition starts.
 */
const useBlurMeasurement = (params: {
	sharedBoundTag?: string;
	remeasureOnFocus?: boolean;
	ancestorKeys: string[];
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const { current } = useKeys();
	const {
		sharedBoundTag,
		remeasureOnFocus,
		ancestorKeys,
		maybeMeasureAndStore,
	} = params;
	const hasCapturedSource = useRef(false);

	const ancestorClosing = [current.route.key, ...ancestorKeys].map((key) =>
		AnimationStore.getAnimation(key, "closing"),
	);

	const maybeMeasureOnBlur = useStableCallbackValue(() => {
		"worklet";

		//.some doesnt work here apparently... :-(
		for (const closing of ancestorClosing) {
			if (closing.get()) return;
		}

		maybeMeasureAndStore({ shouldSetSource: true });
	});

	useFocusEffect(
		useCallback(() => {
			if (sharedBoundTag && remeasureOnFocus) {
				runOnUI(maybeMeasureAndStore)({ shouldUpdateSource: true });
			}

			hasCapturedSource.current = false;

			return () => {
				if (!sharedBoundTag || hasCapturedSource.current) return;
				runOnUI(maybeMeasureOnBlur)();
			};
		}, [
			sharedBoundTag,
			remeasureOnFocus,
			maybeMeasureOnBlur,
			maybeMeasureAndStore,
		]),
	);

	return {
		markSourceCaptured: () => {
			hasCapturedSource.current = true;
		},
	};
};

/**
 * Syncs child measurements when parent updates.
 */
const useParentSyncReaction = (params: {
	parentContext: RegisterBoundsContextValue | null;
	maybeMeasureAndStore: (options?: MaybeMeasureAndStoreParams) => void;
}) => {
	const { parentContext, maybeMeasureAndStore } = params;

	useAnimatedReaction(
		() => parentContext?.updateSignal.get(),
		(value) => {
			"worklet";
			if (value === 0 || value === undefined) return;
			maybeMeasureAndStore();
		},
	);
};

const { RegisterBoundsProvider, useRegisterBoundsContext } = createProvider(
	"RegisterBounds",
	{ guarded: false },
)<RegisterBoundsProviderProps, RegisterBoundsContextValue>(
	({
		style,
		onPress,
		sharedBoundTag,
		animatedRef,
		remeasureOnFocus,
		children,
	}) => {
		const { current } = useKeys();
		const currentScreenKey = current.route.key;
		const ancestorKeys = useMemo(() => getAncestorKeys(current), [current]);
		const layoutAnchor = useLayoutAnchorContext();

		// Context & signals
		const parentContext: RegisterBoundsContextValue | null =
			useRegisterBoundsContext();

		const ownSignal = useSharedValue(0);
		const updateSignal: SharedValue<number> =
			parentContext?.updateSignal ?? ownSignal;

		const isAnimating = AnimationStore.getAnimation(
			currentScreenKey,
			"animating",
		);
		const preparedStyles = useMemo(() => prepareStyleForBounds(style), [style]);

		const emitUpdate = useStableCallbackValue(() => {
			"worklet";
			const isRoot = !parentContext;
			if (isRoot) updateSignal.set(updateSignal.get() + 1);
		});

		const maybeMeasureAndStore = useStableCallbackValue(
			({
				onPress,
				shouldSetSource,
				shouldSetDestination,
				shouldUpdateSource,
			}: MaybeMeasureAndStoreParams = {}) => {
				"worklet";
				if (!sharedBoundTag) return;

				const measured = measure(animatedRef);
				if (!measured) return;

				// Correct for parent transforms (e.g., when parent screen is animating)
				const correctedMeasured = layoutAnchor
					? layoutAnchor.correctMeasurement(measured)
					: measured;

				emitUpdate();

				BoundStore.registerSnapshot(
					sharedBoundTag,
					currentScreenKey,
					correctedMeasured,
					preparedStyles,
					ancestorKeys,
				);

				if (shouldSetSource) {
					if (isAnimating.get()) {
						// If animation is already in progress,
						// lets use the existing measuremenets.
						const existing = BoundStore.getSnapshot(
							sharedBoundTag,
							currentScreenKey,
						);
						if (existing) {
							BoundStore.setLinkSource(
								sharedBoundTag,
								currentScreenKey,
								existing.bounds,
								preparedStyles,
								ancestorKeys,
							);
						}
						return;
					}
					BoundStore.setLinkSource(
						sharedBoundTag,
						currentScreenKey,
						correctedMeasured,
						preparedStyles,
						ancestorKeys,
					);
				}

				if (shouldUpdateSource) {
					BoundStore.updateLinkSource(
						sharedBoundTag,
						currentScreenKey,
						correctedMeasured,
						preparedStyles,
						ancestorKeys,
					);
				}

				// Set as destination (on mount during animation)
				if (shouldSetDestination) {
					BoundStore.setLinkDestination(
						sharedBoundTag,
						currentScreenKey,
						correctedMeasured,
						preparedStyles,
						ancestorKeys,
					);
				}

				if (onPress) runOnJS(onPress)();
			},
		);

		const handleInitialLayout = useInitialLayoutHandler({
			sharedBoundTag,
			currentScreenKey,
			ancestorKeys,
			maybeMeasureAndStore,
		});

		// Side effects
		const { markSourceCaptured } = useBlurMeasurement({
			sharedBoundTag,
			remeasureOnFocus,
			maybeMeasureAndStore,
			ancestorKeys,
		});

		useParentSyncReaction({ parentContext, maybeMeasureAndStore });

		const captureActiveOnPress = useStableCallback(() => {
			if (!sharedBoundTag) {
				onPress?.();
				return;
			}
			runOnUI(maybeMeasureAndStore)({ onPress, shouldSetSource: true });
			markSourceCaptured();
		});

		return {
			value: { updateSignal },
			children: children({ handleInitialLayout, captureActiveOnPress }),
		};
	},
);

export { RegisterBoundsProvider };
