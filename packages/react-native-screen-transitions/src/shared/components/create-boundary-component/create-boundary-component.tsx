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
import { BoundStore } from "../../stores/bounds";
import { prepareStyleForBounds } from "../../utils/bounds/helpers/styles/styles";
import { useBoundaryPresence } from "./hooks/use-boundary-presence";
import { useCaptureDestinationBoundary } from "./hooks/use-capture-destination-boundary";
import { useCaptureSourceBoundary } from "./hooks/use-capture-source-boundary";
import { useMeasurer } from "./hooks/use-measurer";
import { useRefreshBoundary } from "./hooks/use-refresh-boundary";
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

		const preparedStyles = useMemo(() => prepareStyleForBounds(style), [style]);
		const { stylesMap } = useScreenStyles();

		const associatedStyles = useAnimatedStyle(() => {
			"worklet";
			return stylesMap.get()[sharedBoundTag]?.style ?? NO_STYLES;
		});

		const associatedStackingStyles = useAnimatedStyle(() => {
			"worklet";
			const baseStyle = stylesMap.get()[sharedBoundTag]?.style;

			return {
				zIndex: baseStyle?.zIndex ?? 0,
				elevation: baseStyle?.elevation ?? 0,
			};
		});

		const { contextValue, measuredRef, hasActiveTarget } = useBoundaryOwner({
			ownerRef,
			associatedTargetStyles: runtimeEnabled ? associatedStyles : undefined,
		});

		const measureBoundary = useMeasurer({
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
		useCaptureSourceBoundary({
			enabled: runtimeEnabled,
			sharedBoundTag,
			id,
			group,
			nextScreenKey,
			measureBoundary,
		});

		// Destination completion path: hold lifecycle start until the first valid
		// destination measurement attaches, then release the pending transition.
		useCaptureDestinationBoundary({
			sharedBoundTag,
			enabled: shouldRunDestinationEffects,
			id,
			group,
			currentScreenKey,
			expectedSourceScreenKey: preferredSourceScreenKey,
			measureBoundary,
		});

		// Pre-transition measurement path: when this route or its next sibling is
		// about to animate, capture or refresh the measurements needed before
		// progress or transform state mutates. Grouped sources refresh existing
		// links; plain sources only backfill when missing.
		useRefreshBoundary({
			enabled: runtimeEnabled,
			sharedBoundTag,
			id,
			group,
			currentScreenKey,
			nextScreenKey,
			hasNextScreen,
			measureBoundary,
		});

		const handlePress = useCallback(
			(...args: unknown[]) => {
				// Press path has priority: capture source before user onPress/navigation.
				if (group) {
					runOnUI(BoundStore.setGroupActiveId)(group, String(id));
				}
				runOnUI(measureBoundary)({ intent: "capture-source" });

				if (typeof onPress === "function") {
					onPress(...args);
				}
			},
			[group, id, measureBoundary, onPress],
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
