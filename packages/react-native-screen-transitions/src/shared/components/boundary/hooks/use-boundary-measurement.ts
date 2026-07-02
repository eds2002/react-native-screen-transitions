import { useMemo } from "react";
import type { View } from "react-native";
import type { AnimatedRef, StyleProps } from "react-native-reanimated";
import type { BoundTag } from "../../../stores/bounds/types";
import { prepareStyleForBounds } from "../../../utils/bounds/helpers/styles/styles";
import type { BoundaryConfigProps } from "../types";
import { useBoundaryPresence } from "./lifecycles/use-boundary-presence";
import { useInitialDestinationMeasurement } from "./lifecycles/use-initial-destination-measurement";
import { useInitialSourceMeasurement } from "./lifecycles/use-initial-source-measurement";
import { useRefreshBoundary } from "./lifecycles/use-refresh-boundary";
import { useMeasurer } from "./use-measurer";

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
	handoff: boolean;
	escapeClipping: boolean;
	config: BoundaryConfigProps;
}

/**
 * Owns the full measurement lifecycle for a boundary: builds the measurer,
 * registers presence, runs the initial source/destination + refresh reactions,
 * and keeps the component itself away from the measurer.
 */
export const useBoundaryMeasurement = ({
	boundTag,
	enabled,
	runtimeEnabled,
	currentScreenKey,
	measuredRef,
	style,
	targetPreparedStyles,
	handoff,
	escapeClipping,
	config,
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
		handoff,
		escapeClipping,
	});

	// Register/unregister this boundary in the presence map so source/destination
	// matching can resolve across concrete screen keys.
	useBoundaryPresence({
		enabled: runtimeEnabled,
		boundTag,
		currentScreenKey,
		boundaryConfig,
		handoff,
		escapeClipping,
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
};
