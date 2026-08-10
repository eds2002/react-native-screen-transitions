import { useMemo } from "react";
import type { View } from "react-native";
import type { AnimatedRef } from "react-native-reanimated";
import type { BoundTag } from "../../../stores/bounds/types";
import { prepareStyleForBounds } from "../../../utils/bounds/helpers/styles/styles";
import type {
	BoundaryConfigProps,
	BoundaryLocalMeasurementValue,
} from "../types";
import { useBoundaryMeasurementRequest } from "./lifecycles/use-boundary-measurement-request";
import { useBoundaryPresence } from "./lifecycles/use-boundary-presence";
import { useMeasurer } from "./use-measurer";

interface UseBoundaryMeasurementParams {
	boundTag: BoundTag;
	/** Raw `enabled` prop — drives the measurer and the passive-source gate. */
	enabled: boolean;
	currentScreenKey: string;
	/** Surface to measure: a nested target's placeholder, else the root. */
	measuredRef: AnimatedRef<View>;
	/** Style belonging to the selected measurement surface. */
	style?: unknown;
	handoff: boolean;
	escapeClipping: boolean;
	localMeasurement: BoundaryLocalMeasurementValue;
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
	currentScreenKey,
	measuredRef,
	style,
	handoff,
	escapeClipping,
	localMeasurement,
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
		localMeasurement,
	});

	useBoundaryPresence({
		enabled,
		boundTag,
		currentScreenKey,
		boundaryConfig,
		handoff,
		escapeClipping,
	});

	useBoundaryMeasurementRequest({
		enabled,
		boundTag,
		currentScreenKey,
		measureBoundary,
	});
};
