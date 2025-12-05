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
import { type TransitionDescriptor, useKeys } from "./keys.provider";

interface MaybeMeasureAndStoreParams {
	onPress?: ((...args: unknown[]) => void) | undefined;
	shouldSetSource?: boolean;
	shouldSetDestination?: boolean;
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
const getAncestorKeys = (current: TransitionDescriptor): string[] => {
	const ancestors: string[] = [];
	let nav = current.navigation.getParent();

	while (nav) {
		const state = nav.getState();
		if (state?.routes && state.index !== undefined) {
			const focusedRoute = state.routes[state.index];
			if (focusedRoute?.key) {
				ancestors.push(focusedRoute.key);
			}
		}
		nav = nav.getParent();
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
	ancestorKeys: string[];
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const { current } = useKeys();
	const { sharedBoundTag, ancestorKeys, maybeMeasureAndStore } = params;
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
			hasCapturedSource.current = false;

			return () => {
				if (!sharedBoundTag || hasCapturedSource.current) return;
				runOnUI(maybeMeasureOnBlur)();
			};
		}, [sharedBoundTag, maybeMeasureOnBlur]),
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
	({ style, onPress, sharedBoundTag, animatedRef, children }) => {
		const { current } = useKeys();
		const currentScreenKey = current.route.key;
		const ancestorKeys = useMemo(() => getAncestorKeys(current), [current]);

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
			}: MaybeMeasureAndStoreParams = {}) => {
				"worklet";
				if (!sharedBoundTag) return;

				const measured = measure(animatedRef);
				if (!measured) return;

				emitUpdate();

				BoundStore.registerSnapshot(
					sharedBoundTag,
					currentScreenKey,
					measured,
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
						measured,
						preparedStyles,
						ancestorKeys,
					);
				}

				// Set as destination (on mount during animation)
				if (shouldSetDestination) {
					BoundStore.setLinkDestination(
						sharedBoundTag,
						currentScreenKey,
						measured,
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
