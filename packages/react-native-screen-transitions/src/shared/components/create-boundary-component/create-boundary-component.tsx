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
import { createPendingPairKey } from "../../stores/bounds/helpers/link-pairs.helpers";
import { prepareStyleForBounds } from "../../utils/bounds/helpers/styles/styles";
import { useBoundaryPresence } from "./hooks/use-boundary-presence";
import { useInitialDestinationMeasurement } from "./hooks/use-initial-destination-measurement";
import { useInitialSourceMeasurement } from "./hooks/use-initial-source-measurement";
import { useMeasurer } from "./hooks/use-measurer";
import { useRefreshBoundary } from "./hooks/use-refresh-boundary";
import {
	BoundaryOwnerProvider,
	useBoundaryOwner,
} from "./providers/boundary-owner.provider";
import type { BoundaryComponentProps, BoundaryConfigProps } from "./types";

interface CreateBoundaryComponentOptions {
	alreadyAnimated?: boolean;
	shouldAutoMeasure?: boolean;
}

export function createBoundaryComponent<P extends object>(
	Wrapped: ComponentType<P>,
	options: CreateBoundaryComponentOptions = {},
) {
	const { alreadyAnimated = false, shouldAutoMeasure = false } = options;
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

		const linkId = String(id);
		const entryTag = group ? `${group}:${linkId}` : linkId;

		const {
			previousScreenKey: preferredSourceScreenKey,
			currentScreenKey,
			nextScreenKey,
			ancestorKeys,
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

		const ownerPreparedStyles = useMemo(
			() => prepareStyleForBounds(style),
			[style],
		);
		const { stylesMap } = useScreenStyles();

		const associatedStyles = useAnimatedStyle(() => {
			"worklet";
			return stylesMap.get()[entryTag]?.style ?? NO_STYLES;
		});

		const associatedStackingStyles = useAnimatedStyle(() => {
			"worklet";
			const baseStyle = stylesMap.get()[entryTag]?.style;
			const zIndex = baseStyle?.zIndex ?? 0;
			const elevation = baseStyle?.elevation ?? 0;

			if (zIndex === 0 && elevation === 0) {
				return NO_STYLES;
			}

			return { zIndex, elevation };
		});

		const { contextValue, measuredRef, hasActiveTarget, targetPreparedStyles } =
			useBoundaryOwner({
				ownerRef,
				associatedTargetStyles: runtimeEnabled ? associatedStyles : undefined,
			});

		const preparedStyles = targetPreparedStyles ?? ownerPreparedStyles;

		const measureBoundary = useMeasurer({
			enabled,
			entryTag,
			linkId,
			group,
			currentScreenKey,
			preparedStyles,
			measuredAnimatedRef: measuredRef,
		});

		const shouldRunDestinationEffects = runtimeEnabled && !hasNextScreen;

		// Register/unregister this boundary in the presence map so source/destination
		// matching can resolve across concrete screen keys.
		useBoundaryPresence({
			enabled: runtimeEnabled,
			entryTag,
			currentScreenKey,
			boundaryConfig,
		});

		const shouldPassivelyMeasureSource =
			shouldAutoMeasure && typeof onPress !== "function";

		useInitialSourceMeasurement({
			enabled: runtimeEnabled,
			nextScreenKey,
			measureBoundary,
			currentScreenKey,
			linkId,
			group,
			shouldAutoMeasure: shouldPassivelyMeasureSource,
		});

		useInitialDestinationMeasurement({
			linkId,
			enabled: shouldRunDestinationEffects,
			currentScreenKey,
			preferredSourceScreenKey,
			ancestorScreenKeys: ancestorKeys,
			measureBoundary,
		});

		useRefreshBoundary({
			enabled: runtimeEnabled,
			currentScreenKey,
			preferredSourceScreenKey,
			nextScreenKey,
			linkId,
			group,
			ancestorScreenKeys: ancestorKeys,
			measureBoundary,
		});

		const handlePress = useCallback(
			(...args: unknown[]) => {
				// Press path has priority: capture source before user onPress/navigation.
				runOnUI(measureBoundary)({
					type: "source",
					pairKey: createPendingPairKey(currentScreenKey),
				});

				if (typeof onPress === "function") {
					onPress(...args);
				}
			},
			[measureBoundary, onPress, currentScreenKey],
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
