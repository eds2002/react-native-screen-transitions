import { type ComponentType, forwardRef, memo, useMemo } from "react";
import { Pressable, View as RNView, type View } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { useAssociatedStyles } from "../../hooks/animation/use-associated-style";
import { useLayoutAnchorContext } from "../../providers/layout-anchor.provider";
import { useScreenKeys } from "../../providers/screen/keys.provider";
import { AnimationStore } from "../../stores/animation.store";
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
			mode,
			anchor,
			scaleMode,
			target,
			method,
			style,
			onLayout,
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
		} = useScreenKeys();
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
			mode,
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

		const shouldRunDestinationEffects =
			runtimeEnabled && !hasNextScreen && mode !== "source";

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
			mode,
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
			enabled: runtimeEnabled && mode !== "source",
			sharedBoundTag,
			currentScreenKey,
			ancestorKeys,
			expectedSourceScreenKey: preferredSourceScreenKey,
			maybeMeasureAndStore,
		});

		return (
			<AnimatedComponent
				{...(rest as any)}
				ref={animatedRef}
				style={[style, enabled ? associatedStyles : undefined]}
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

export const Boundary = {
	View: BoundaryView,
	Pressable: BoundaryPressable,
	createBoundaryComponent,
};
