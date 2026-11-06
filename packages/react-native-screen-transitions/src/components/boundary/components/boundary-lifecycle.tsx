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
	MeasureBoundary,
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
	/** Notified once, the first time this boundary is measured for a transition (escape only). */
	firstEscapeMeasureKey: number;
	style?: unknown;
}

export const BoundaryLifecycle = memo(function BoundaryLifecycle({
	boundTag,
	config,
	currentScreenKey,
	enabled,
	escapeClipping,
	handoff,
	firstEscapeMeasureKey,
	localMeasurement,
	measuredRef,
	style,
}: BoundaryLifecycleProps) {
	const hasConfiguredInterpolator = useBuilderStore(
		(s) => s.derivations.hasConfiguredInterpolator,
	);

	const runtimeEnabled = enabled && hasConfiguredInterpolator;
	// Only a screen pushed as a pair's destination (and not covered by another screen) can run the
	// destination handshake. Everywhere else, such as a list of sources, it is never mounted.
	const isReceivingDestination = useBuilderStore(
		(s) => !s.derivations.nextScreenKey && !!s.derivations.destinationPairKey,
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
		firstEscapeMeasureKey,
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

	useRefreshBoundary({
		enabled: runtimeEnabled,
		boundTag,
		measureBoundary,
	});

	return runtimeEnabled && isReceivingDestination ? (
		<DestinationHandshake
			boundTag={boundTag}
			measureBoundary={measureBoundary}
		/>
	) : null;
});

/**
 * The destination handshake (lifecycle block, measure, retries) as its own component, mounted only
 * while it can act: it costs five shared values, two worklets and a reaction per boundary.
 * Remounting it after the screen above pops is harmless: with this screen's progress above zero it
 * neither blocks nor measures.
 */
const DestinationHandshake = memo(function DestinationHandshake({
	boundTag,
	measureBoundary,
}: {
	boundTag: BoundTag;
	measureBoundary: MeasureBoundary;
}) {
	useInitialDestinationMeasurement({
		boundTag,
		enabled: true,
		measureBoundary,
	});
	return null;
});
