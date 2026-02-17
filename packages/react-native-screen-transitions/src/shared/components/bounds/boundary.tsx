import { memo, useCallback, useEffect, useMemo } from "react";
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
import { useKeys } from "../../providers/screen/keys.provider";
import { useScrollSettleContext } from "../../providers/scroll-settle.provider";
import { AnimationStore } from "../../stores/animation.store";
import { BoundStore } from "../../stores/bounds.store";
import { prepareStyleForBounds } from "../../utils/bounds/helpers/styles";
import { getAncestorKeys } from "../../utils/navigation/get-ancestor-keys";

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

const useBoundaryPresence = (params: {
	sharedBoundTag: string;
	currentScreenKey: string;
	ancestorKeys: string[];
}) => {
	const { sharedBoundTag, currentScreenKey, ancestorKeys } = params;

	useEffect(() => {
		runOnUI(BoundStore.registerBoundaryPresence)(
			sharedBoundTag,
			currentScreenKey,
			ancestorKeys,
		);

		return () => {
			runOnUI(BoundStore.unregisterBoundaryPresence)(
				sharedBoundTag,
				currentScreenKey,
			);
		};
	}, [sharedBoundTag, currentScreenKey, ancestorKeys]);
};

const useAutoSourceMeasurement = (params: {
	sharedBoundTag: string;
	nextScreenKey?: string;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const { sharedBoundTag, nextScreenKey, maybeMeasureAndStore } = params;
	const boundaryPresence = BoundStore.getBoundaryPresence();

	useAnimatedReaction(
		() => {
			"worklet";
			if (!nextScreenKey) return 0;
			const tagPresence = boundaryPresence.value[sharedBoundTag];
			if (!tagPresence) return 0;

			const direct = tagPresence[nextScreenKey];
			if (direct && direct.count > 0) return 1;

			for (const screenKey in tagPresence) {
				const entry = tagPresence[screenKey];
				if (entry.ancestorKeys?.includes(nextScreenKey)) {
					return 1;
				}
			}

			return 0;
		},
		(shouldCapture, previousShouldCapture) => {
			"worklet";
			if (!nextScreenKey) return;
			if (shouldCapture === 0 || shouldCapture === previousShouldCapture)
				return;
			maybeMeasureAndStore({ shouldSetSource: true });
		},
		[nextScreenKey, sharedBoundTag, boundaryPresence, maybeMeasureAndStore],
	);
};

const usePendingDestinationMeasurement = (params: {
	sharedBoundTag: string;
	enabled: boolean;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const { sharedBoundTag, enabled, maybeMeasureAndStore } = params;

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) return 0;
			return BoundStore.hasPendingLink(sharedBoundTag) ? 1 : 0;
		},
		(hasPendingLink, previousHasPendingLink) => {
			"worklet";
			if (!enabled) return;
			if (hasPendingLink === 0 || hasPendingLink === previousHasPendingLink) {
				return;
			}

			maybeMeasureAndStore({ shouldSetDestination: true });
		},
		[enabled, sharedBoundTag, maybeMeasureAndStore],
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
			return allGroups.value[group]?.activeId ?? null;
		},
		(activeId, previousActiveId) => {
			"worklet";
			if (!group || !shouldUpdateDestination) return;
			if (isAnimating.value) return;

			if (activeId === idStr && activeId !== previousActiveId) {
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
	const nextScreenKey = next?.route.key;
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

			if (shouldSetSource && isAnimating.get()) {
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

			const hasPendingLink = BoundStore.hasPendingLink(sharedBoundTag);
			const hasSourceLink = BoundStore.hasSourceLink(
				sharedBoundTag,
				currentScreenKey,
			);
			const hasDestinationLink = BoundStore.hasDestinationLink(
				sharedBoundTag,
				currentScreenKey,
			);

			const canSetSource = !!shouldSetSource;
			const canSetDestination = !!shouldSetDestination && hasPendingLink;
			const canUpdateSource = !!shouldUpdateSource && hasSourceLink;
			const canUpdateDestination =
				!!shouldUpdateDestination && (hasDestinationLink || hasPendingLink);

			if (
				!canSetSource &&
				!canSetDestination &&
				!canUpdateSource &&
				!canUpdateDestination
			) {
				return;
			}

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

			if (canSetSource) {
				BoundStore.setLinkSource(
					sharedBoundTag,
					currentScreenKey,
					correctedMeasured,
					preparedStyles,
					ancestorKeys,
				);
			}

			if (canUpdateSource) {
				BoundStore.updateLinkSource(
					sharedBoundTag,
					currentScreenKey,
					correctedMeasured,
					preparedStyles,
					ancestorKeys,
				);
			}

			if (canUpdateDestination) {
				BoundStore.updateLinkDestination(
					sharedBoundTag,
					currentScreenKey,
					correctedMeasured,
					preparedStyles,
					ancestorKeys,
				);
			}

			if (canSetDestination) {
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

	useBoundaryPresence({
		sharedBoundTag,
		currentScreenKey,
		ancestorKeys,
	});

	useAutoSourceMeasurement({
		sharedBoundTag,
		nextScreenKey,
		maybeMeasureAndStore,
	});

	usePendingDestinationMeasurement({
		sharedBoundTag,
		enabled: !hasNextScreen,
		maybeMeasureAndStore,
	});

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
