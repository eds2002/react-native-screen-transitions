import {
	type ComponentType,
	forwardRef,
	memo,
	useCallback,
	useMemo,
} from "react";
import { Pressable, View as RNView, type View } from "react-native";
import Animated, { runOnUI, useAnimatedRef } from "react-native-reanimated";
import { useAssociatedStyles } from "../../hooks/animation/use-associated-style";
import { useLayoutAnchorContext } from "../../providers/layout-anchor.provider";
import { useDescriptorDerivations } from "../../providers/screen/descriptors";
import { AnimationStore } from "../../stores/animation.store";
import { BoundStore } from "../../stores/bounds";
import { prepareStyleForBounds } from "../../utils/bounds/helpers/styles";
import { useAutoSourceMeasurement } from "./hooks/use-auto-source-measurement";
import { useBoundaryMeasureAndStore } from "./hooks/use-boundary-measure-and-store";
import { useBoundaryPresence } from "./hooks/use-boundary-presence";
import { useGroupActiveMeasurement } from "./hooks/use-group-active-measurement";
import { useInitialLayoutHandler } from "./hooks/use-initial-layout-handler";
import { usePendingDestinationMeasurement } from "./hooks/use-pending-destination-measurement";
import { usePendingDestinationRetryMeasurement } from "./hooks/use-pending-destination-retry-measurement";
import { useScrollSettledMeasurement } from "./hooks/use-scroll-settled-measurement";
import type { BoundaryComponentProps, BoundaryConfigProps } from "./types";
import { buildBoundaryMatchKey } from "./utils/build-boundary-match-key";

const setGroupActiveIdOnUI = (group: string, id: string) => {
	"worklet";
	BoundStore.setGroupActiveId(group, id);
};

export function createBoundaryComponent<P extends object>(
	Wrapped: ComponentType<P>,
) {
	const AnimatedComponent = Animated.createAnimatedComponent(Wrapped);

	const Inner = forwardRef<
		React.ComponentRef<typeof AnimatedComponent>,
		BoundaryComponentProps<P>
	>((props, _ref) => {
		const {
			enabled = true,
			group,
			id,
			anchor,
			scaleMode,
			target,
			method,
			style,
			onPress,
			...rest
		} = props as any;

		const sharedBoundTag = buildBoundaryMatchKey({ group, id });
		const animatedRef = useAnimatedRef<View>();

		const {
			previousScreenKey: preferredSourceScreenKey,
			currentScreenKey,
			nextScreenKey,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
			hasConfiguredInterpolator,
		} = useDescriptorDerivations();
		const runtimeEnabled = enabled && hasConfiguredInterpolator;
		const hasNextScreen = !!nextScreenKey;
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

		const maybeMeasureAndStore = useBoundaryMeasureAndStore({
			enabled,
			sharedBoundTag,
			preferredSourceScreenKey,
			currentScreenKey,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
			isAnimating,
			preparedStyles,
			animatedRef,
			layoutAnchor,
		});

		const shouldRunDestinationEffects = runtimeEnabled && !hasNextScreen;

		// Register/unregister this boundary in the presence map so source/destination
		// matching can resolve across screens (including ancestor relationships).
		useBoundaryPresence({
			enabled: runtimeEnabled,
			sharedBoundTag,
			currentScreenKey,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
			boundaryConfig,
		});

		// On the source screen, capture source bounds when a matching destination
		// appears on the next screen.
		useAutoSourceMeasurement({
			enabled: runtimeEnabled,
			sharedBoundTag,
			nextScreenKey,
			maybeMeasureAndStore,
		});

		// Primary destination capture: once a pending source link exists for this tag,
		// measure destination bounds and complete the pair.
		usePendingDestinationMeasurement({
			sharedBoundTag,
			enabled: shouldRunDestinationEffects,
			expectedSourceScreenKey: preferredSourceScreenKey,
			maybeMeasureAndStore,
		});

		// Reliability fallback: retry destination capture during transition progress
		// when the initial pending-destination attempt happens before layout is ready.
		usePendingDestinationRetryMeasurement({
			sharedBoundTag,
			enabled: shouldRunDestinationEffects,
			currentScreenKey,
			expectedSourceScreenKey: preferredSourceScreenKey,
			progress,
			animating: isAnimating,
			maybeMeasureAndStore,
		});

		// Grouped boundaries (e.g. paged/detail UIs): re-measure when this boundary
		// becomes the active member so destination bounds stay accurate.
		useGroupActiveMeasurement({
			enabled: runtimeEnabled,
			group,
			id,
			shouldUpdateDestination,
			isAnimating,
			maybeMeasureAndStore,
		});

		// While idle on source screens, re-measure after scroll settles so a later
		// close transition starts from up-to-date source geometry.
		useScrollSettledMeasurement({
			enabled: runtimeEnabled,
			group,
			hasNextScreen,
			isAnimating,
			maybeMeasureAndStore,
		});

		// Destination mount-time capture path: onLayout schedules a one-time UI-thread
		// initial measurement when transitions are active.
		useInitialLayoutHandler({
			enabled: runtimeEnabled,
			sharedBoundTag,
			currentScreenKey,
			ancestorKeys,
			expectedSourceScreenKey: preferredSourceScreenKey,
			maybeMeasureAndStore,
		});

		const handlePress = useCallback(
			(...args: unknown[]) => {
				// Press path has priority: capture source before user onPress/navigation.
				if (group) {
					runOnUI(setGroupActiveIdOnUI)(group, String(id));
				}
				runOnUI(maybeMeasureAndStore)({ shouldSetSource: true });

				if (typeof onPress === "function") {
					onPress(...args);
				}
			},
			[group, id, maybeMeasureAndStore, onPress],
		);

		const resolvedOnPress =
			typeof onPress === "function" ? handlePress : undefined;

		return (
			<AnimatedComponent
				{...(rest as any)}
				ref={animatedRef}
				style={[style, enabled ? associatedStyles : undefined]}
				onPress={resolvedOnPress}
				collapsable={false}
			/>
		);
	});

	return memo(Inner) as unknown as React.MemoExoticComponent<
		React.ForwardRefExoticComponent<
			BoundaryComponentProps<P> &
				React.RefAttributes<React.ComponentRef<typeof Wrapped>>
		>
	>;
}

// Pre-built boundary component variants
const BoundaryView = createBoundaryComponent(RNView);
BoundaryView.displayName = "Transition.Boundary.View";

const BoundaryPressable = createBoundaryComponent(Pressable);
BoundaryPressable.displayName = "Transition.Boundary.Pressable";

/**
 * Shared-boundary components.
 *
 * How measurement works:
 * 1. Source screen captures bounds for a tag.
 * 2. Destination screen captures bounds for the same tag.
 * 3. The link is updated as layout changes (group-active + scroll-settled paths).
 *
 * Press behavior:
 * - When a boundary has `onPress` (typically `Boundary.Pressable`), source
 *   measurement runs before the user callback. This gives navigation transitions
 *   fresh source geometry on the first frame.
 *
 * Use:
 * - `Boundary.View` for passive/shared elements.
 * - `Boundary.Pressable` for tappable elements that start navigation.
 */
export const Boundary = {
	/** Passive boundary wrapper (no built-in press semantics). */
	View: BoundaryView,
	/** Pressable boundary wrapper with press-priority source capture. */
	Pressable: BoundaryPressable,
	/** Factory for custom boundary wrappers. */
	createBoundaryComponent,
};
