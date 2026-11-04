import { memo, useMemo } from "react";
import type { View } from "react-native";
import type { AnimatedRef } from "react-native-reanimated";
import { useBuilderStore } from "../../../providers/builder";
import type { BoundTag } from "../../../stores/bounds/types";
import { prepareStyleForBounds } from "../../../utils/bounds/helpers/styles/styles";
import { useBoundaryPresence } from "../hooks/lifecycles/use-boundary-presence";
import { useInitialDestinationMeasurement } from "../hooks/lifecycles/use-initial-destination-measurement";
import { useInitialSourceMeasurement } from "../hooks/lifecycles/use-initial-source-measurement";
import { useRefreshBoundary } from "../hooks/lifecycles/use-refresh-boundary";
import { useMeasurer } from "../hooks/use-measurer";
import type {
	BoundaryConfigProps,
	BoundaryLocalMeasurementValue,
} from "../types";

interface BoundaryLifecycleProps {
	boundTag: BoundTag;
	config: BoundaryConfigProps;
	currentScreenKey: string;
	enabled: boolean;
	escapeClipping: boolean;
	handoff: boolean;
	localMeasurement: BoundaryLocalMeasurementValue;
	measuredRef: AnimatedRef<View>;
	style?: unknown;
}

export const BoundaryLifecycle = memo(function BoundaryLifecycle({
	boundTag,
	config,
	currentScreenKey,
	enabled,
	escapeClipping,
	handoff,
	localMeasurement,
	measuredRef,
	style,
}: BoundaryLifecycleProps) {
	const hasConfiguredInterpolator = useBuilderStore(
		(s) => s.derivations.hasConfiguredInterpolator,
	);

	const runtimeEnabled = enabled && hasConfiguredInterpolator;
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

	// Presence and source capture must not depend on this screen owning an
	// interpolator: a nested source can participate in a transition owned by a
	// different navigator.
	useBoundaryPresence({
		enabled,
		boundTag,
		currentScreenKey,
		boundaryConfig: config,
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
		measureBoundary,
	});

	useRefreshBoundary({
		enabled: runtimeEnabled,
		boundTag,
		measureBoundary,
	});

	return null;
});
