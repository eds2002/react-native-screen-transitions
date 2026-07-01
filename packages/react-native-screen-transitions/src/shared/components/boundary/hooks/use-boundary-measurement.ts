import { useCallback, useMemo } from "react";
import type { View } from "react-native";
import type { AnimatedRef, StyleProps } from "react-native-reanimated";
import type { BoundsPortalHost, BoundTag } from "../../../stores/bounds/types";
import { prepareStyleForBounds } from "../../../utils/bounds/helpers/styles/styles";
import type { BoundaryConfigProps } from "../types";
import { useBoundaryPresence } from "./use-boundary-presence";
import { useInitialDestinationMeasurement } from "./use-initial-destination-measurement";
import { useInitialSourceMeasurement } from "./use-initial-source-measurement";
import { useMeasurer } from "./use-measurer";
import { useRefreshBoundary } from "./use-refresh-boundary";

interface UseBoundaryMeasurementParams {
	boundTag: BoundTag;
	/** Raw `enabled` prop — drives the measurer and the passive-source gate. */
	enabled: boolean;
	/** `enabled && hasConfiguredInterpolator` — gates presence + lifecycle. */
	runtimeEnabled: boolean;
	currentScreenKey: string;
	/** Surface to measure: a nested target's placeholder, else the root. */
	measuredRef: AnimatedRef<View>;
	/** Root's own style; ignored when a nested target supplies its own. */
	style?: unknown;
	targetPreparedStyles?: StyleProps;
	portalHost?: BoundsPortalHost;
	config: BoundaryConfigProps;
	onPress?: (...args: unknown[]) => void;
}

/**
 * Owns the full measurement lifecycle for a boundary: builds the measurer,
 * registers presence, runs the initial source/destination + refresh reactions,
 * and returns the press-priority `onPress`. The component never touches the
 * measurer itself.
 */
export const useBoundaryMeasurement = ({
	boundTag,
	enabled,
	runtimeEnabled,
	currentScreenKey,
	measuredRef,
	style,
	targetPreparedStyles,
	portalHost,
	config,
	onPress,
}: UseBoundaryMeasurementParams) => {
	const { anchor, scaleMode, target, method } = config;
	const boundaryConfig = useMemo<BoundaryConfigProps>(
		() => ({ anchor, scaleMode, target, method }),
		[anchor, scaleMode, target, method],
	);

	const rootPreparedStyles = useMemo(
		() => prepareStyleForBounds(style),
		[style],
	);
	const preparedStyles = targetPreparedStyles ?? rootPreparedStyles;

	const measureBoundary = useMeasurer({
		enabled,
		boundTag,
		currentScreenKey,
		preparedStyles,
		measuredAnimatedRef: measuredRef,
		portalHost,
	});

	// Register/unregister this boundary in the presence map so source/destination
	// matching can resolve across concrete screen keys.
	useBoundaryPresence({
		enabled: runtimeEnabled,
		boundTag,
		currentScreenKey,
		boundaryConfig,
		portalHost,
	});

	useInitialSourceMeasurement({
		enabled: runtimeEnabled,
		measureBoundary,
		boundTag,
	});

	useInitialDestinationMeasurement({
		boundTag,
		enabled: runtimeEnabled,
		measureBoundary,
	});

	useRefreshBoundary({
		enabled: runtimeEnabled,
		boundTag,
		measureBoundary,
	});

	const handlePress = useCallback(
		(...args: unknown[]) => {
			if (typeof onPress === "function") {
				onPress(...args);
			}
		},
		[onPress],
	);

	return {
		onPress: typeof onPress === "function" ? handlePress : undefined,
	};
};
