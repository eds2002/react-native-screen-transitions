import { memo, useMemo } from "react";
import type { View } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { useAssociatedStyles } from "../../hooks/animation/use-associated-style";
import { useLayoutAnchorContext } from "../../providers/layout-anchor.provider";
import { useKeys } from "../../providers/screen/keys.provider";
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
import type { BoundaryConfigProps, BoundaryProps } from "./types";
import { buildBoundaryMatchKey } from "./utils/build-boundary-match-key";

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

	const maybeMeasureAndStore = useBoundaryMeasureAndStore({
		enabled,
		mode,
		sharedBoundTag,
		preferredSourceScreenKey,
		currentScreenKey,
		ancestorKeys,
		isAnimating,
		preparedStyles,
		animatedRef,
		layoutAnchor,
	});

	const shouldRunDestinationEffects =
		runtimeEnabled && !hasNextScreen && mode !== "source";

	useBoundaryPresence({
		enabled: runtimeEnabled,
		sharedBoundTag,
		currentScreenKey,
		ancestorKeys,
		boundaryConfig,
	});

	useAutoSourceMeasurement({
		enabled: runtimeEnabled,
		mode,
		sharedBoundTag,
		nextScreenKey,
		maybeMeasureAndStore,
	});

	usePendingDestinationMeasurement({
		sharedBoundTag,
		enabled: shouldRunDestinationEffects,
		expectedSourceScreenKey: preferredSourceScreenKey,
		maybeMeasureAndStore,
	});

	usePendingDestinationRetryMeasurement({
		sharedBoundTag,
		enabled: shouldRunDestinationEffects,
		currentScreenKey,
		expectedSourceScreenKey: preferredSourceScreenKey,
		progress,
		animating: isAnimating,
		maybeMeasureAndStore,
	});

	useGroupActiveMeasurement({
		enabled: runtimeEnabled,
		group,
		id,
		shouldUpdateDestination,
		isAnimating,
		maybeMeasureAndStore,
	});

	useScrollSettledMeasurement({
		enabled: runtimeEnabled,
		group,
		hasNextScreen,
		isAnimating,
		maybeMeasureAndStore,
	});

	const handleInitialLayout = useInitialLayoutHandler({
		enabled: runtimeEnabled && mode !== "source",
		sharedBoundTag,
		currentScreenKey,
		ancestorKeys,
		maybeMeasureAndStore,
		onLayout,
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
