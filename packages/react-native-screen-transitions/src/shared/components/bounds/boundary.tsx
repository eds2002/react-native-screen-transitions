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
import { useScrollSettleContext } from "../../providers/scroll-settle.provider";
import { AnimationStore } from "../../stores/animation.store";
import { BoundStore } from "../../stores/bounds.store";
import { prepareStyleForBounds } from "../../utils/bounds/helpers/styles";

type BoundaryId = string | number;

export interface BoundaryProps extends Omit<ViewProps, "id"> {
	/**
	 * Optional group name for collection/list scenarios.
	 * When provided, boundaries are tracked as a group and the active member
	 * re-measures automatically when focus changes within the group.
	 * The internal tag becomes `group:id`.
	 */
	group?: string;
	id: BoundaryId;
}

interface MaybeMeasureAndStoreParams {
	shouldSetSource?: boolean;
	shouldSetDestination?: boolean;
	shouldUpdateSource?: boolean;
	shouldUpdateDestination?: boolean;
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

type BuildBoundaryMatchKeyParams = {
	group?: string;
	id: BoundaryId;
};

export function buildBoundaryMatchKey(
	params: BuildBoundaryMatchKeyParams,
): string;
export function buildBoundaryMatchKey(
	group: string | undefined,
	id: BoundaryId,
): string;
export function buildBoundaryMatchKey(
	paramsOrGroup: BuildBoundaryMatchKeyParams | string | undefined,
	legacyId?: BoundaryId,
): string {
	"worklet";

	if (typeof paramsOrGroup === "object" && paramsOrGroup !== null) {
		const { group, id } = paramsOrGroup;
		return group ? `${group}:${id}` : String(id);
	}

	const group = paramsOrGroup;
	const id = legacyId;
	return group ? `${group}:${id}` : String(id);
}

/**
 * Watches the group's active id in the BoundStore.
 * When this boundary becomes the active member of its group,
 * re-measures itself and updates the link destination with fresh bounds.
 * This handles the case where a boundary scrolled into view after initial mount
 * (e.g., paging ScrollView in a detail screen).
 */
const useGroupActiveMeasurement = (params: {
	group: string | undefined;
	id: BoundaryId;
	shouldUpdateDestination: boolean;
	isAnimating: ReturnType<typeof AnimationStore.getAnimation>;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		group,
		id,
		shouldUpdateDestination,
		isAnimating,
		maybeMeasureAndStore,
	} = params;
	const idStr = String(id);

	const allGroups = BoundStore.getGroups();

	useAnimatedReaction(
		() => {
			"worklet";
			if (!group) return null;
			return allGroups.value;
		},
		(groups, previousGroups) => {
			"worklet";
			if (!groups || !group || !shouldUpdateDestination) return;
			if (isAnimating.value) return;

			const activeGroupActiveId = groups[group]?.activeId;
			if (
				activeGroupActiveId === idStr &&
				activeGroupActiveId !== previousGroups?.[group]?.activeId
			) {
				maybeMeasureAndStore({ shouldUpdateDestination: true });
			}
		},
		[group, idStr, shouldUpdateDestination, isAnimating, maybeMeasureAndStore],
	);
};

const useScrollSettledMeasurement = (params: {
	group: string | undefined;
	hasNextScreen: boolean;
	isAnimating: ReturnType<typeof AnimationStore.getAnimation>;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const { group, hasNextScreen, isAnimating, maybeMeasureAndStore } = params;
	const scrollSettle = useScrollSettleContext();
	const settledSignal = scrollSettle?.settledSignal;

	useAnimatedReaction(
		() => settledSignal?.value ?? 0,
		(signal, previousSignal) => {
			"worklet";
			if (!group || !hasNextScreen || !settledSignal) return;
			if (signal === 0 || signal === previousSignal) return;
			if (isAnimating.value) return;

			// Re-measure source bounds after scroll settles while idle.
			// This captures post-scroll positions before close transition starts.
			maybeMeasureAndStore({ shouldUpdateSource: true });
		},
		[group, hasNextScreen, settledSignal, isAnimating, maybeMeasureAndStore],
	);
};

const BoundaryComponent = ({
	group,
	id,
	style,
	onLayout,
	...rest
}: BoundaryProps) => {
	const sharedBoundTag = buildBoundaryMatchKey({ group, id });
	const animatedRef = useAnimatedRef<View>();

	const { current, next } = useKeys();
	const currentScreenKey = current.route.key;
	const hasNextScreen = !!next;
	const shouldUpdateDestination = !hasNextScreen;
	const ancestorKeys = useMemo(() => getAncestorKeys(current), [current]);
	const layoutAnchor = useLayoutAnchorContext();

	const isAnimating = AnimationStore.getAnimation(
		currentScreenKey,
		"animating",
	);
	const preparedStyles = useMemo(() => prepareStyleForBounds(style), [style]);
	const { associatedStyles } = useAssociatedStyles({
		id: sharedBoundTag,
		resetTransformOnUnset: true,
	});

	const maybeMeasureAndStore = useStableCallbackValue(
		({
			shouldSetSource,
			shouldSetDestination,
			shouldUpdateSource,
			shouldUpdateDestination,
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

			if (shouldUpdateSource) {
				BoundStore.updateLinkSource(
					sharedBoundTag,
					currentScreenKey,
					correctedMeasured,
					preparedStyles,
					ancestorKeys,
				);
			}

			if (shouldUpdateDestination) {
				BoundStore.updateLinkDestination(
					sharedBoundTag,
					currentScreenKey,
					correctedMeasured,
					preparedStyles,
					ancestorKeys,
				);
			}

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

	/**
	 * We'll have to figure out a more better way of handling this lol, this causes some ugly cases.
	 */
	// useFocusMeasurement({
	// 	maybeMeasureAndStore,
	// });

	useGroupActiveMeasurement({
		group,
		id,
		shouldUpdateDestination,
		isAnimating,
		maybeMeasureAndStore,
	});

	useScrollSettledMeasurement({
		group,
		hasNextScreen,
		isAnimating,
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
