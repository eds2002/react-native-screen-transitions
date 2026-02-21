import { memo, useCallback, useEffect, useMemo, useRef } from "react";
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
import type { BoundsOptions } from "../../utils/bounds/types/options";

type BoundaryId = string | number;
type BoundaryMode = "source" | "destination";

type BoundaryConfigProps = Pick<
	BoundsOptions,
	"anchor" | "scaleMode" | "target" | "method"
>;

export interface BoundaryProps
	extends Omit<ViewProps, "id">,
		BoundaryConfigProps {
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
	/**
	 * Explicitly sets this boundary's mode in matching.
	 *
	 * By default, `Transition.Boundary` auto-detects source/destination behavior
	 * based on whether a matching boundary is found on the next screen.
	 *
	 * Use `mode="source"` when your destination does not render a matching
	 * boundary (for example with `bounds({ id }).navigation.zoom()`).
	 * In this mode, source bounds are still captured when transitioning away,
	 * even if no destination match is found.
	 *
	 * Use `mode="destination"` when this boundary should only participate as
	 * a destination.
	 */
	mode?: BoundaryMode;
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
	const hasScheduledInitialLayout = useRef(false);

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
			if (!enabled || hasScheduledInitialLayout.current) return;
			hasScheduledInitialLayout.current = true;
			runOnUI(handleInitialLayout)();
		},
		[enabled, onLayout, handleInitialLayout],
	);
};

const useBoundaryPresence = (params: {
	enabled: boolean;
	sharedBoundTag: string;
	currentScreenKey: string;
	ancestorKeys: string[];
	boundaryConfig?: BoundaryConfigProps;
}) => {
	const {
		enabled,
		sharedBoundTag,
		currentScreenKey,
		ancestorKeys,
		boundaryConfig,
	} = params;

	useEffect(() => {
		if (!enabled) return;

		runOnUI(BoundStore.registerBoundaryPresence)(
			sharedBoundTag,
			currentScreenKey,
			ancestorKeys,
			boundaryConfig,
		);

		return () => {
			runOnUI(BoundStore.unregisterBoundaryPresence)(
				sharedBoundTag,
				currentScreenKey,
			);
		};
	}, [enabled, sharedBoundTag, currentScreenKey, ancestorKeys, boundaryConfig]);
};

const useAutoSourceMeasurement = (params: {
	enabled: boolean;
	mode?: BoundaryMode;
	sharedBoundTag: string;
	nextScreenKey?: string;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const { enabled, mode, sharedBoundTag, nextScreenKey, maybeMeasureAndStore } =
		params;
	const boundaryPresence = BoundStore.getBoundaryPresence();

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) return 0;
			if (mode === "destination") return 0;
			if (!nextScreenKey) return 0;
			if (mode === "source") return nextScreenKey;
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
			if (mode === "destination") return;
			if (!nextScreenKey) return;
			if (!captureSignal || captureSignal === previousCaptureSignal) return;
			maybeMeasureAndStore({ shouldSetSource: true });
		},
		[
			enabled,
			mode,
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

const usePendingDestinationRetryMeasurement = (params: {
	sharedBoundTag: string;
	enabled: boolean;
	currentScreenKey: string;
	expectedSourceScreenKey?: string;
	progress: ReturnType<typeof AnimationStore.getAnimation>;
	animating: ReturnType<typeof AnimationStore.getAnimation>;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		sharedBoundTag,
		enabled,
		currentScreenKey,
		expectedSourceScreenKey,
		progress,
		animating,
		maybeMeasureAndStore,
	} = params;

	const retryCount = useSharedValue(0);
	const MAX_RETRIES = 12;

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) return 0;
			if (!animating.get()) return 0;
			if (BoundStore.hasDestinationLink(sharedBoundTag, currentScreenKey))
				return 0;

			const resolvedSourceKey = expectedSourceScreenKey
				? BoundStore.hasPendingLinkFromSource(
						sharedBoundTag,
						expectedSourceScreenKey,
					)
					? expectedSourceScreenKey
					: BoundStore.getLatestPendingSourceScreenKey(sharedBoundTag)
				: BoundStore.getLatestPendingSourceScreenKey(sharedBoundTag);

			if (!resolvedSourceKey) return 0;
			if (
				!BoundStore.hasPendingLinkFromSource(sharedBoundTag, resolvedSourceKey)
			) {
				return 0;
			}

			return progress.get();
		},
		(captureSignal) => {
			"worklet";
			if (!enabled) return;
			if (!captureSignal) {
				retryCount.set(0);
				return;
			}

			if (retryCount.get() >= MAX_RETRIES) return;
			retryCount.set(retryCount.get() + 1);
			maybeMeasureAndStore({ shouldSetDestination: true });
		},
		[
			enabled,
			sharedBoundTag,
			currentScreenKey,
			expectedSourceScreenKey,
			progress,
			animating,
			maybeMeasureAndStore,
			retryCount,
		],
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

const GroupMeasurementEffects = (params: {
	enabled: boolean;
	group: string;
	id: BoundaryId;
	shouldUpdateDestination: boolean;
	hasNextScreen: boolean;
	isAnimating: ReturnType<typeof AnimationStore.getAnimation>;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		enabled,
		group,
		id,
		shouldUpdateDestination,
		hasNextScreen,
		isAnimating,
		maybeMeasureAndStore,
	} = params;

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

	return null;
};

const BoundaryPresenceEffect = (params: {
	enabled: boolean;
	sharedBoundTag: string;
	currentScreenKey: string;
	ancestorKeys: string[];
	boundaryConfig?: BoundaryConfigProps;
}) => {
	useBoundaryPresence(params);
	return null;
};

const AutoSourceMeasurementEffect = (params: {
	enabled: boolean;
	mode?: BoundaryMode;
	sharedBoundTag: string;
	nextScreenKey: string;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	useAutoSourceMeasurement(params);
	return null;
};

const PendingDestinationMeasurementEffect = (params: {
	sharedBoundTag: string;
	enabled: boolean;
	expectedSourceScreenKey?: string;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	usePendingDestinationMeasurement(params);
	return null;
};

const PendingDestinationRetryEffect = (params: {
	sharedBoundTag: string;
	enabled: boolean;
	currentScreenKey: string;
	expectedSourceScreenKey?: string;
	progress: ReturnType<typeof AnimationStore.getAnimation>;
	animating: ReturnType<typeof AnimationStore.getAnimation>;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	usePendingDestinationRetryMeasurement(params);
	return null;
};

const BoundaryComponent = ({
	enabled = true,
	group,
	id,
	mode,
	anchor,
	scaleMode,
	target,
	method,
	style,
	onLayout,
	...rest
}: BoundaryProps) => {
	const sharedBoundTag = buildBoundaryMatchKey({ group, id });
	const animatedRef = useAnimatedRef<View>();

	const { previous, current, next, ancestorKeys } = useKeys();
	const currentScreenKey = current.route.key;
	const nextScreenKey = next?.route.key;
	const preferredSourceScreenKey = previous?.route.key;
	const hasConfiguredInterpolator =
		!!current.options.screenStyleInterpolator ||
		!!next?.options?.screenStyleInterpolator;
	const runtimeEnabled = enabled && hasConfiguredInterpolator;
	const hasNextScreen = !!next;
	const shouldUpdateDestination = !hasNextScreen;
	const layoutAnchor = useLayoutAnchorContext();
	const boundaryConfig = useMemo<BoundaryConfigProps | undefined>(() => {
		if (
			anchor === undefined &&
			scaleMode === undefined &&
			target === undefined &&
			method === undefined
		) {
			return undefined;
		}

		return {
			anchor,
			scaleMode,
			target,
			method,
		};
	}, [anchor, scaleMode, target, method]);

	const isAnimating = AnimationStore.getAnimation(
		currentScreenKey,
		"animating",
	);
	const progress = AnimationStore.getAnimation(currentScreenKey, "progress");
	const preparedStyles = useMemo(() => prepareStyleForBounds(style), [style]);
	const { associatedStyles } = useAssociatedStyles({
		id: sharedBoundTag,
		resetTransformOnUnset: true,
		waitForFirstResolvedStyle: true,
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
			const canParticipateAsSource = mode !== "destination";
			const canParticipateAsDestination = mode !== "source";

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

			if (shouldSetSource && canParticipateAsSource && isAnimating.get()) {
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

			const canSetSource = canParticipateAsSource && !!shouldSetSource;
			const canSetDestination =
				canParticipateAsDestination && !!shouldSetDestination && hasPendingLink;
			const canUpdateSource =
				canParticipateAsSource && !!shouldUpdateSource && hasSourceLink;
			const canUpdateDestination =
				canParticipateAsDestination &&
				!!shouldUpdateDestination &&
				(hasDestinationLink || hasPendingLink);

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
		enabled: runtimeEnabled && mode !== "source",
		sharedBoundTag,
		currentScreenKey,
		ancestorKeys,
		maybeMeasureAndStore,
		onLayout,
	});

	return (
		<>
			{runtimeEnabled ? (
				<BoundaryPresenceEffect
					enabled={runtimeEnabled}
					sharedBoundTag={sharedBoundTag}
					currentScreenKey={currentScreenKey}
					ancestorKeys={ancestorKeys}
					boundaryConfig={boundaryConfig}
				/>
			) : null}
			{runtimeEnabled && nextScreenKey ? (
				<AutoSourceMeasurementEffect
					enabled={runtimeEnabled}
					mode={mode}
					sharedBoundTag={sharedBoundTag}
					nextScreenKey={nextScreenKey}
					maybeMeasureAndStore={maybeMeasureAndStore}
				/>
			) : null}
			{runtimeEnabled && !hasNextScreen && mode !== "source" ? (
				<PendingDestinationMeasurementEffect
					sharedBoundTag={sharedBoundTag}
					enabled={runtimeEnabled}
					expectedSourceScreenKey={preferredSourceScreenKey}
					maybeMeasureAndStore={maybeMeasureAndStore}
				/>
			) : null}
			{runtimeEnabled && !hasNextScreen && mode !== "source" ? (
				<PendingDestinationRetryEffect
					sharedBoundTag={sharedBoundTag}
					enabled={runtimeEnabled}
					currentScreenKey={currentScreenKey}
					expectedSourceScreenKey={preferredSourceScreenKey}
					progress={progress}
					animating={isAnimating}
					maybeMeasureAndStore={maybeMeasureAndStore}
				/>
			) : null}
			{group ? (
				<GroupMeasurementEffects
					enabled={runtimeEnabled}
					group={group}
					id={id}
					shouldUpdateDestination={shouldUpdateDestination}
					hasNextScreen={hasNextScreen}
					isAnimating={isAnimating}
					maybeMeasureAndStore={maybeMeasureAndStore}
				/>
			) : null}
			<Animated.View
				{...rest}
				ref={animatedRef}
				style={[style, enabled ? associatedStyles : undefined]}
				onLayout={handleInitialLayout}
				collapsable={false}
			/>
		</>
	);
};

BoundaryComponent.displayName = "Transition.Boundary";

export const Boundary = memo(BoundaryComponent);
