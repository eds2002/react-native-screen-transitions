import {
	type ComponentType,
	forwardRef,
	memo,
	useCallback,
	useImperativeHandle,
	useMemo,
} from "react";
import type { View } from "react-native";
import Animated, {
	runOnUI,
	useAnimatedRef,
	useAnimatedStyle,
} from "react-native-reanimated";
import { NO_STYLES } from "../../constants";
import { useDescriptorDerivations } from "../../providers/screen/descriptors";
import { useScreenStyles } from "../../providers/screen/styles";
import { AnimationStore } from "../../stores/animation.store";
import { BoundStore } from "../../stores/bounds";
import { prepareStyleForBounds } from "../../utils/bounds/helpers/styles";
import { useAutoSourceMeasurement } from "./hooks/use-auto-source-measurement";
import { useBoundaryMeasureAndStore } from "./hooks/use-boundary-measure-and-store";
import { useBoundaryPresence } from "./hooks/use-boundary-presence";
import { usePendingDestinationMeasurement } from "./hooks/use-pending-destination-measurement";
import { usePrepareTransitionMeasurement } from "./hooks/use-prepare-transition-measurement";
import {
	BoundaryOwnerProvider,
	useBoundaryOwner,
} from "./providers/boundary-owner.provider";
import type { BoundaryComponentProps, BoundaryConfigProps } from "./types";
import { buildBoundaryMatchKey } from "./utils/build-boundary-match-key";

interface CreateBoundaryComponentOptions {
	alreadyAnimated?: boolean;
}

export function createBoundaryComponent<P extends object>(
	Wrapped: ComponentType<P>,
	options: CreateBoundaryComponentOptions = {},
) {
	const { alreadyAnimated = false } = options;
	const AnimatedComponent = alreadyAnimated
		? Wrapped
		: Animated.createAnimatedComponent(Wrapped);

	const Inner = forwardRef<
		React.ComponentRef<typeof AnimatedComponent>,
		BoundaryComponentProps<P>
	>((props, forwardedRef) => {
		const ownerRef = useAnimatedRef<View>();
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

		const isAnimating = AnimationStore.getValue(currentScreenKey, "animating");

		const preparedStyles = useMemo(() => prepareStyleForBounds(style), [style]);
		const { elementStylesMap } = useScreenStyles();

		const associatedStyles = useAnimatedStyle(() => {
			"worklet";

			const baseStyle =
				(elementStylesMap.value[sharedBoundTag]?.style as
					| Record<string, any>
					| undefined) ?? (NO_STYLES as Record<string, any>);

			if ("opacity" in baseStyle) {
				return baseStyle;
			}

			return { ...baseStyle, opacity: 1 };
		});

		const associatedStackingStyles = useAnimatedStyle(() => {
			"worklet";
			const baseStyle =
				(elementStylesMap.value[sharedBoundTag]?.style as
					| Record<string, any>
					| undefined) ?? (NO_STYLES as Record<string, any>);

			return {
				zIndex: (baseStyle.zIndex as number | undefined) ?? 0,
				elevation: (baseStyle.elevation as number | undefined) ?? 0,
			};
		});

		const { contextValue, measuredRef, hasActiveTarget } = useBoundaryOwner({
			ownerRef,
			associatedTargetStyles: runtimeEnabled ? associatedStyles : undefined,
		});

		const maybeMeasureAndStore = useBoundaryMeasureAndStore({
			enabled,
			sharedBoundTag,
			preferredSourceScreenKey,
			currentScreenKey,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
			preparedStyles,
			measuredAnimatedRef: measuredRef,
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
			id,
			group,
			nextScreenKey,
			maybeMeasureAndStore,
		});

		// Destination completion path: do one immediate completion attempt when a
		// pending source link appears, then retry during transition progress if the
		// first attempt races layout readiness.
		usePendingDestinationMeasurement({
			sharedBoundTag,
			enabled: shouldRunDestinationEffects,
			id,
			group,
			currentScreenKey,
			expectedSourceScreenKey: preferredSourceScreenKey,
			animating: isAnimating,
			maybeMeasureAndStore,
		});

		// Pre-transition measurement path: when this route or its next sibling is
		// about to animate, capture one clean base measurement before progress or
		// transform state mutates.
		usePrepareTransitionMeasurement({
			enabled: runtimeEnabled,
			sharedBoundTag,
			id,
			group,
			currentScreenKey,
			nextScreenKey,
			hasNextScreen,
			maybeMeasureAndStore,
		});

		const handlePress = useCallback(
			(...args: unknown[]) => {
				// Press path has priority: capture source before user onPress/navigation.
				if (group) {
					runOnUI(BoundStore.setGroupActiveId)(group, String(id));
				}
				runOnUI(maybeMeasureAndStore)({ intent: "capture-source" });

				if (typeof onPress === "function") {
					onPress(...args);
				}
			},
			[group, id, maybeMeasureAndStore, onPress],
		);

		const resolvedOnPress =
			typeof onPress === "function" ? handlePress : undefined;

		useImperativeHandle(forwardedRef, () => ownerRef.current as any, [
			ownerRef,
		]);

		return (
			<BoundaryOwnerProvider value={contextValue}>
				<AnimatedComponent
					{...rest}
					ref={ownerRef}
					style={[
						style,
						runtimeEnabled
							? hasActiveTarget
								? associatedStackingStyles
								: associatedStyles
							: undefined,
					]}
					onPress={resolvedOnPress}
					collapsable={false}
				/>
			</BoundaryOwnerProvider>
		);
	});

	return memo(
		Animated.createAnimatedComponent(Inner),
	) as unknown as React.MemoExoticComponent<
		React.ForwardRefExoticComponent<
			BoundaryComponentProps<P> &
				React.RefAttributes<React.ComponentRef<typeof Wrapped>>
		>
	>;
}
