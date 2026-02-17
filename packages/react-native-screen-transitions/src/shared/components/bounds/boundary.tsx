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
	/**
	 * Whether this boundary should participate in matching and measurement.
	 * @default true
	 */
	enabled?: boolean;
	id: BoundaryId;
}

interface MaybeMeasureAndStoreParams {
	shouldSetSource?: boolean;
	shouldSetDestination?: boolean;
	shouldUpdateSource?: boolean;
	shouldUpdateDestination?: boolean;
}

const useInitialLayoutHandler = (params: {
	enabled: boolean;
	sharedBoundTag: string;
	currentScreenKey: string;
	ancestorKeys: string[];
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
	onLayout?: ViewProps["onLayout"];
}) => {
	const {
		enabled,
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
		if (!enabled) return;
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
		enabled,
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
	enabled: boolean;
	sharedBoundTag: string;
	currentScreenKey: string;
	ancestorKeys: string[];
}) => {
	const { enabled, sharedBoundTag, currentScreenKey, ancestorKeys } = params;

	useEffect(() => {
		if (!enabled) return;

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
	}, [enabled, sharedBoundTag, currentScreenKey, ancestorKeys]);
};

const useAutoSourceMeasurement = (params: {
	enabled: boolean;
	sharedBoundTag: string;
	nextScreenKey?: string;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const { enabled, sharedBoundTag, nextScreenKey, maybeMeasureAndStore } =
		params;
	const boundaryPresence = BoundStore.getBoundaryPresence();

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) return 0;
			if (!nextScreenKey) return 0;
			const tagPresence = boundaryPresence.value[sharedBoundTag];
			if (!tagPresence) return 0;

			const direct = tagPresence[nextScreenKey];
			if (direct && direct.count > 0) return nextScreenKey;

			for (const screenKey in tagPresence) {
				const entry = tagPresence[screenKey];
				if (entry.ancestorKeys?.includes(nextScreenKey)) {
					return nextScreenKey;
				}
			}

			return 0;
		},
		(captureSignal, previousCaptureSignal) => {
			"worklet";
			if (!enabled) return;
			if (!nextScreenKey) return;
			if (!captureSignal || captureSignal === previousCaptureSignal) return;
			maybeMeasureAndStore({ shouldSetSource: true });
		},
		[
			enabled,
			nextScreenKey,
			sharedBoundTag,
			boundaryPresence,
			maybeMeasureAndStore,
		],
	);
};

const usePendingDestinationMeasurement = (params: {
	sharedBoundTag: string;
	enabled: boolean;
	expectedSourceScreenKey?: string;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		sharedBoundTag,
		enabled,
		expectedSourceScreenKey,
		maybeMeasureAndStore,
	} = params;

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) return 0;
			if (expectedSourceScreenKey) {
				const resolvedSourceKey = BoundStore.hasPendingLinkFromSource(
					sharedBoundTag,
					expectedSourceScreenKey,
				)
					? expectedSourceScreenKey
					: BoundStore.getLatestPendingSourceScreenKey(sharedBoundTag);

				if (!resolvedSourceKey) return 0;

				return BoundStore.hasPendingLinkFromSource(
					sharedBoundTag,
					resolvedSourceKey,
				)
					? resolvedSourceKey
					: 0;
			}

			const latestPendingSource =
				BoundStore.getLatestPendingSourceScreenKey(sharedBoundTag);
			if (!latestPendingSource) return 0;

			return BoundStore.hasPendingLinkFromSource(
				sharedBoundTag,
				latestPendingSource,
			)
				? latestPendingSource
				: 0;
		},
		(captureSignal, previousCaptureSignal) => {
			"worklet";
			if (!enabled) return;
			if (!captureSignal || captureSignal === previousCaptureSignal) {
				return;
			}

			maybeMeasureAndStore({ shouldSetDestination: true });
		},
		[enabled, sharedBoundTag, expectedSourceScreenKey, maybeMeasureAndStore],
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
	enabled: boolean;
	group: string | undefined;
	id: BoundaryId;
	shouldUpdateDestination: boolean;
	isAnimating: ReturnType<typeof AnimationStore.getAnimation>;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		enabled,
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
			if (!enabled) return null;
			if (!group) return null;
			return allGroups.value[group]?.activeId ?? null;
		},
		(activeId, previousActiveId) => {
			"worklet";
			if (!enabled) return;
			if (!group || !shouldUpdateDestination) return;
			if (isAnimating.value) return;

			if (activeId === idStr && activeId !== previousActiveId) {
				maybeMeasureAndStore({ shouldUpdateDestination: true });
			}
		},
		[
			enabled,
			group,
			idStr,
			shouldUpdateDestination,
			isAnimating,
			maybeMeasureAndStore,
		],
	);
};

const useScrollSettledMeasurement = (params: {
	enabled: boolean;
	group: string | undefined;
	hasNextScreen: boolean;
	isAnimating: ReturnType<typeof AnimationStore.getAnimation>;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const { enabled, group, hasNextScreen, isAnimating, maybeMeasureAndStore } =
		params;
	const scrollSettle = useScrollSettleContext();
	const settledSignal = scrollSettle?.settledSignal;

	useAnimatedReaction(
		() => settledSignal?.value ?? 0,
		(signal, previousSignal) => {
			"worklet";
			if (!enabled) return;
			if (!group || !hasNextScreen || !settledSignal) return;
			if (signal === 0 || signal === previousSignal) return;
			if (isAnimating.value) return;

			// Re-measure source bounds after scroll settles while idle.
			// This captures post-scroll positions before close transition starts.
			maybeMeasureAndStore({ shouldUpdateSource: true });
		},
		[
			enabled,
			group,
			hasNextScreen,
			settledSignal,
			isAnimating,
			maybeMeasureAndStore,
		],
	);
};

const BoundaryComponent = ({
	enabled = true,
	group,
	id,
	style,
	onLayout,
	...rest
}: BoundaryProps) => {
	const sharedBoundTag = buildBoundaryMatchKey({ group, id });
	const animatedRef = useAnimatedRef<View>();

	const { previous, current, next } = useKeys();
	const currentScreenKey = current.route.key;
	const nextScreenKey = next?.route.key;
	const preferredSourceScreenKey = previous?.route.key;
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
			if (!enabled) return;

			const fallbackSourceScreenKey =
				BoundStore.getLatestPendingSourceScreenKey(sharedBoundTag);
			const expectedSourceScreenKey: string | undefined =
				preferredSourceScreenKey &&
				BoundStore.hasPendingLinkFromSource(
					sharedBoundTag,
					preferredSourceScreenKey,
				)
					? preferredSourceScreenKey
					: fallbackSourceScreenKey || undefined;

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
					return;
				}

				// No cached snapshot while animating.
				// Fall through to a live measurement so rapid retargeting still
				// captures a valid source link.
			}

			const hasPendingLink = expectedSourceScreenKey
				? BoundStore.hasPendingLinkFromSource(
						sharedBoundTag,
						expectedSourceScreenKey,
					)
				: BoundStore.hasPendingLink(sharedBoundTag);
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
					expectedSourceScreenKey,
				);
			}

			if (canSetDestination) {
				BoundStore.setLinkDestination(
					sharedBoundTag,
					currentScreenKey,
					correctedMeasured,
					preparedStyles,
					ancestorKeys,
					expectedSourceScreenKey,
				);
			}
		},
	);

	const handleInitialLayout = useInitialLayoutHandler({
		enabled,
		sharedBoundTag,
		currentScreenKey,
		ancestorKeys,
		maybeMeasureAndStore,
		onLayout,
	});

	useBoundaryPresence({
		enabled,
		sharedBoundTag,
		currentScreenKey,
		ancestorKeys,
	});

	useAutoSourceMeasurement({
		enabled,
		sharedBoundTag,
		nextScreenKey,
		maybeMeasureAndStore,
	});

	usePendingDestinationMeasurement({
		sharedBoundTag,
		enabled: enabled && !hasNextScreen,
		expectedSourceScreenKey: preferredSourceScreenKey,
		maybeMeasureAndStore,
	});

	useGroupActiveMeasurement({
		enabled,
		group,
		id,
		shouldUpdateDestination,
		isAnimating,
		maybeMeasureAndStore,
	});

	useScrollSettledMeasurement({
		enabled,
		group,
		hasNextScreen,
		isAnimating,
		maybeMeasureAndStore,
	});

	return (
		<Animated.View
			{...rest}
			ref={animatedRef}
			style={[style, enabled ? associatedStyles : undefined]}
			onLayout={handleInitialLayout}
			collapsable={false}
		/>
	);
};

BoundaryComponent.displayName = "Transition.Boundary";

export const Boundary = memo(BoundaryComponent);
