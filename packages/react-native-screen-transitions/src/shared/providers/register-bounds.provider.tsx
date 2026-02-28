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
import { BoundStore } from "../stores/bounds";
import { applyMeasuredBoundsWrites } from "../stores/bounds/helpers/apply-measured-bounds-writes";
import { prepareStyleForBounds } from "../utils/bounds/helpers/styles";
import createProvider from "../utils/create-provider";
import { useLayoutAnchorContext } from "./layout-anchor.provider";
import { useDescriptorDerivations, useDescriptors } from "./screen/descriptors";

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

const getRouteParamId = (
	route: { params?: object } | undefined,
): string | null => {
	const params = route?.params as Record<string, unknown> | undefined;
	const rawId = params?.id;
	return typeof rawId === "string" ? rawId : null;
};

const matchesSelectionTag = (
	tag: string | undefined,
	selectedId: string | null,
): boolean => {
	"worklet";
	if (!tag || !selectedId) return false;
	if (tag === selectedId) return true;
	if (tag.endsWith(`:${selectedId}`)) return true;
	if (tag.endsWith(`-${selectedId}`)) return true;
	return false;
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
const useBlurMeasurement = (params: {
	enabled: boolean;
	sharedBoundTag?: string;
	selectedRouteId: string | null;
	ancestorKeys: string[];
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const { current } = useDescriptors();
	const {
		enabled,
		sharedBoundTag,
		selectedRouteId,
		ancestorKeys,
		maybeMeasureAndStore,
	} = params;
	const hasCapturedSource = useRef(false);

	const ancestorClosing = [current.route.key, ...ancestorKeys].map((key) =>
		AnimationStore.getAnimation(key, "closing"),
	);

	const maybeMeasureOnBlur = useStableCallbackValue(() => {
		"worklet";
		if (!enabled) return;
		if (!matchesSelectionTag(sharedBoundTag, selectedRouteId)) return;

		//.some doesnt work here apparently... :-(
		for (const closing of ancestorClosing) {
			if (closing.get()) return;
		}

		maybeMeasureAndStore({ shouldSetSource: true });
	});

	useFocusEffect(
		useCallback(() => {
			hasCapturedSource.current = false;

			if (!enabled) {
				return;
			}

			return () => {
				if (!sharedBoundTag || hasCapturedSource.current) return;
				runOnUI(maybeMeasureOnBlur)();
			};
		}, [enabled, sharedBoundTag, maybeMeasureOnBlur]),
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

const CloseRemeasureReactionEffect = (params: {
	sharedBoundTag: string;
	remeasureOnFocus: boolean;
	nextClosing: ReturnType<typeof AnimationStore.getAnimation>;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		sharedBoundTag,
		remeasureOnFocus,
		nextClosing,
		maybeMeasureAndStore,
	} = params;

	useAnimatedReaction(
		() => nextClosing.get(),
		(closing, prevClosing) => {
			"worklet";
			if (closing === 1 && (prevClosing === 0 || prevClosing === null)) {
				maybeMeasureAndStore({ shouldUpdateSource: true });
			}
		},
		[sharedBoundTag, remeasureOnFocus, nextClosing],
	);

	return null;
};

let useRegisterBoundsContext: () => RegisterBoundsContextValue | null;

const registerBoundsBundle = createProvider("RegisterBounds", {
	guarded: false,
})<RegisterBoundsProviderProps, RegisterBoundsContextValue>(
	({
		style,
		onPress,
		sharedBoundTag,
		animatedRef,
		remeasureOnFocus,
		children,
	}) => {
		const { current, next } = useDescriptors();
		const { ancestorKeys, navigatorKey, ancestorNavigatorKeys } =
			useDescriptorDerivations();
		const currentScreenKey = current.route.key;
		const selectedNextRouteId = getRouteParamId(next?.route);
		const layoutAnchor = useLayoutAnchorContext();

		// Context & signals
		const parentContext = useRegisterBoundsContext();

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
				if (!sharedBoundTag) {
					if (onPress) runOnJS(onPress)();
					return;
				}

				if (shouldSetSource && isAnimating.get()) {
					const existing = BoundStore.getSnapshot(
						sharedBoundTag,
						currentScreenKey,
					);
					if (existing) {
						applyMeasuredBoundsWrites({
							sharedBoundTag,
							ancestorKeys,
							navigatorKey,
							ancestorNavigatorKeys,
							currentScreenKey,
							measured: existing.bounds,
							preparedStyles,
							shouldSetSource: true,
						});
					}

					if (onPress) runOnJS(onPress)();
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

				const wantsSetSource = !!shouldSetSource;
				const wantsSetDestination = !!shouldSetDestination;
				const wantsUpdateSource = !!shouldUpdateSource;
				const wantsSnapshotOnly =
					!wantsSetSource && !wantsSetDestination && !wantsUpdateSource;

				const canSetSource = wantsSetSource;
				const canSetDestination = wantsSetDestination && hasPendingLink;
				const canUpdateSource = wantsUpdateSource && hasSourceLink;
				const canSnapshotOnly =
					wantsSnapshotOnly &&
					(hasPendingLink || hasSourceLink || hasDestinationLink);

				if (
					!canSetSource &&
					!canSetDestination &&
					!canUpdateSource &&
					!canSnapshotOnly
				) {
					if (onPress) runOnJS(onPress)();
					return;
				}

				const measured = measure(animatedRef);
				if (!measured) {
					if (onPress) runOnJS(onPress)();
					return;
				}

				const correctedMeasured = layoutAnchor
					? layoutAnchor.correctMeasurement(measured)
					: measured;

				emitUpdate();

				applyMeasuredBoundsWrites({
					sharedBoundTag,
					currentScreenKey,
					measured: correctedMeasured,
					preparedStyles,
					ancestorKeys,
					navigatorKey,
					ancestorNavigatorKeys,
					shouldRegisterSnapshot: true,
					shouldSetSource: canSetSource,
					shouldUpdateSource: canUpdateSource,
					shouldSetDestination: canSetDestination,
				});

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
			enabled: !onPress,
			sharedBoundTag,
			selectedRouteId: selectedNextRouteId,
			maybeMeasureAndStore,
			ancestorKeys,
		});

		// Re-measure source bounds when the destination screen (next in stack)
		// starts closing. This fires at the instant the back animation begins,
		// unlike useFocusEffect which fires too late (after the screen is removed
		// from state).
		const nextScreenKey = next?.route.key;
		const nextClosing = nextScreenKey
			? AnimationStore.getAnimation(nextScreenKey, "closing")
			: null;

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
			children: (
				<>
					{sharedBoundTag && remeasureOnFocus && nextClosing ? (
						<CloseRemeasureReactionEffect
							sharedBoundTag={sharedBoundTag}
							remeasureOnFocus={remeasureOnFocus}
							nextClosing={nextClosing}
							maybeMeasureAndStore={maybeMeasureAndStore}
						/>
					) : null}
					{children({ handleInitialLayout, captureActiveOnPress })}
				</>
			),
		};
	},
);

const RegisterBoundsProvider = registerBoundsBundle.RegisterBoundsProvider;
useRegisterBoundsContext = registerBoundsBundle.useRegisterBoundsContext;

export { RegisterBoundsProvider };
