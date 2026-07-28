import { useMemo } from "react";
import type { View } from "react-native";
import type { AnimatedRef } from "react-native-reanimated";
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
	/** Style belonging to the selected measurement surface. */
	style?: unknown;
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
	handoff,
	escapeClipping,
	config,
}: UseBoundaryMeasurementParams) => {
	const { anchor, scaleMode, target, method } = config;
	const boundaryConfig = useMemo<BoundaryConfigProps>(
		() => ({ anchor, scaleMode, target, method }),
		[anchor, scaleMode, target, method],
	);

	const preparedStyles = useMemo(() => prepareStyleForBounds(style), [style]);

	const measureBoundary = useMeasurer({
		enabled,
		boundTag,
		currentScreenKey,
		preparedStyles,
		measuredAnimatedRef: measuredRef,
		handoff,
		escapeClipping,
	});

	// Presence and source capture must not depend on this screen owning an
	// interpolator: a nested source can participate in a transition owned by a
	// different navigator.
	useBoundaryPresence({
		enabled,
		boundTag,
		currentScreenKey,
		boundaryConfig,
		handoff,
		escapeClipping,
	});

	useInitialSourceMeasurement({
		enabled,
		measureBoundary,
		boundTag,
	});

	useInitialDestinationMeasurement({
		boundTag,
		enabled: runtimeEnabled,
		escapeClipping,
		measureBoundary,
	});

	useRefreshBoundary({
		enabled: runtimeEnabled,
		boundTag,
		measureBoundary,
	});
};
