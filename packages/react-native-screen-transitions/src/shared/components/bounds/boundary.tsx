import { useFocusEffect } from "@react-navigation/native";
import { memo, useCallback, useMemo } from "react";
import type { LayoutChangeEvent, View, ViewProps } from "react-native";
import Animated, {
	measure,
	runOnUI,
	useAnimatedReaction,
	useAnimatedRef,
	useSharedValue,
} from "react-native-reanimated";
import { useAssociatedStyles } from "../../hooks/animation/use-associated-style";
import useStableCallbackValue from "../../hooks/use-stable-callback-value";
import { useLayoutAnchorContext } from "../../providers/layout-anchor.provider";
import {
	type BaseDescriptor,
	useKeys,
} from "../../providers/screen/keys.provider";
import { AnimationStore } from "../../stores/animation.store";
import { BoundStore } from "../../stores/bounds.store";
import { prepareStyleForBounds } from "../../utils/bounds/helpers/styles";

type BoundaryId = string | number;

export interface BoundaryProps extends Omit<ViewProps, "id"> {
	namespace: string;
	id: BoundaryId;
}

interface MaybeMeasureAndStoreParams {
	shouldSetSource?: boolean;
	shouldSetDestination?: boolean;
	shouldUpdateSource?: boolean;
}

/**
 * Builds the full ancestor key chain for nested navigators.
 * Returns an array of screen keys from immediate parent to root.
 * [parentKey, grandparentKey, great-grandparentKey, ...]
 */
const getAncestorKeys = (current: BaseDescriptor): string[] => {
	const ancestors: string[] = [];
	const nav = current.navigation as any;

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

const useInitialLayoutHandler = (params: {
	sharedBoundTag: string;
	currentScreenKey: string;
	ancestorKeys: string[];
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
	onLayout?: ViewProps["onLayout"];
}) => {
	const {
		sharedBoundTag,
		currentScreenKey,
		ancestorKeys,
		maybeMeasureAndStore,
		onLayout,
	} = params;

	const isAnimating = AnimationStore.getAnimation(
		currentScreenKey,
		"animating",
	);

	const ancestorAnimations = ancestorKeys.map((key) =>
		AnimationStore.getAnimation(key, "animating"),
	);

	const hasMeasuredOnLayout = useSharedValue(false);

	const handleInitialLayout = useCallback(() => {
		"worklet";
		if (!sharedBoundTag || hasMeasuredOnLayout.get()) return;

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

	return useCallback(
		(event: LayoutChangeEvent) => {
			onLayout?.(event);
			runOnUI(handleInitialLayout)();
		},
		[onLayout, handleInitialLayout],
	);
};

const useBlurMeasurement = (params: {
	sharedBoundTag: string;
	ancestorKeys: string[];
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const { current } = useKeys();
	const { sharedBoundTag, ancestorKeys, maybeMeasureAndStore } = params;

	const ancestorClosing = [current.route.key, ...ancestorKeys].map((key) =>
		AnimationStore.getAnimation(key, "closing"),
	);

	const maybeMeasureOnBlur = useStableCallbackValue(() => {
		"worklet";

		for (const closing of ancestorClosing) {
			if (closing.get()) return;
		}

		maybeMeasureAndStore({ shouldSetSource: true });
	});

	useFocusEffect(
		useCallback(() => {
			return () => {
				if (!sharedBoundTag) return;
				runOnUI(maybeMeasureOnBlur)();
			};
		}, [sharedBoundTag, maybeMeasureOnBlur]),
	);
};

const useFocusMeasurement = (params: {
	maybeMeasureAndStore: (options?: MaybeMeasureAndStoreParams) => void;
}) => {
	const { next } = useKeys();
	const nextScreenKey = next?.route.key;
	const { maybeMeasureAndStore } = params;

	const nextClosing = nextScreenKey
		? AnimationStore.getAnimation(nextScreenKey, "closing")
		: null;

	useAnimatedReaction(
		() => nextClosing?.get() ?? 0,
		(closing, prevClosing) => {
			"worklet";
			if (closing === 1 && (prevClosing === 0 || prevClosing === null)) {
				maybeMeasureAndStore({ shouldUpdateSource: true });
			}
		},
		[nextClosing, maybeMeasureAndStore],
	);
};

export const buildBoundaryMatchKey = (
	namespace: string,
	id: BoundaryId,
): string => `${namespace}:${id}`;

const BoundaryComponent = ({
	namespace,
	id,
	style,
	onLayout,
	...rest
}: BoundaryProps) => {
	const sharedBoundTag = buildBoundaryMatchKey(namespace, id);
	const animatedRef = useAnimatedRef<View>();

	const { current } = useKeys();
	const currentScreenKey = current.route.key;
	const ancestorKeys = useMemo(() => getAncestorKeys(current), [current]);
	const layoutAnchor = useLayoutAnchorContext();

	const isAnimating = AnimationStore.getAnimation(
		currentScreenKey,
		"animating",
	);
	const preparedStyles = useMemo(() => prepareStyleForBounds(style), [style]);
	const { associatedStyles } = useAssociatedStyles({ id: sharedBoundTag });

	const maybeMeasureAndStore = useStableCallbackValue(
		({
			shouldSetSource,
			shouldSetDestination,
			shouldUpdateSource,
		}: MaybeMeasureAndStoreParams = {}) => {
			"worklet";

			const measured = measure(animatedRef);
			if (!measured) return;

			const correctedMeasured = layoutAnchor
				? layoutAnchor.correctMeasurement(measured)
				: measured;

			BoundStore.registerSnapshot(
				sharedBoundTag,
				currentScreenKey,
				correctedMeasured,
				preparedStyles,
				ancestorKeys,
			);

			if (shouldSetSource) {
				if (isAnimating.get()) {
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

			/**
			 * Will try to figure out a better way to update our source,
			 * this is very important for scenarios where we may want to measure again incase this view was in a scrollview
			 * scenario, etc.
			 */
			// if (shouldUpdateSource) {
			// 	BoundStore.updateLinkSource(
			// 		sharedBoundTag,
			// 		currentScreenKey,
			// 		correctedMeasured,
			// 		preparedStyles,
			// 		ancestorKeys,
			// 	);
			// }

			if (shouldSetDestination) {
				BoundStore.setLinkDestination(
					sharedBoundTag,
					currentScreenKey,
					correctedMeasured,
					preparedStyles,
					ancestorKeys,
				);
			}
		},
	);

	const handleInitialLayout = useInitialLayoutHandler({
		sharedBoundTag,
		currentScreenKey,
		ancestorKeys,
		maybeMeasureAndStore,
		onLayout,
	});

	useBlurMeasurement({
		sharedBoundTag,
		ancestorKeys,
		maybeMeasureAndStore,
	});

	useFocusMeasurement({
		maybeMeasureAndStore,
	});

	return (
		<Animated.View
			{...rest}
			ref={animatedRef}
			style={[style, associatedStyles]}
			onLayout={handleInitialLayout}
			collapsable={false}
		/>
	);
};

BoundaryComponent.displayName = "Transition.Boundary";

export const Boundary = memo(BoundaryComponent);
