import { memo, useMemo } from "react";
import type { View } from "react-native";
import type { AnimatedRef } from "react-native-reanimated";
import { useBuilderStore } from "../../../providers/builder";
import { useScrollChain } from "../../../providers/motion/gestures/scroll-coordination";
import type { BoundTag } from "../../../stores/bounds";
import { prepareStyleForBounds } from "../../../utils/bounds/helpers/styles/styles";
import type {
	BoundaryConfigProps,
	BoundaryLocalMeasurementValue,
} from "../types";
import { useBoundaryMeasureRegistration } from "./measure-registry";
import { useBoundaryPresence } from "./use-boundary-presence";
import { useInitialDestinationMeasurement } from "./use-initial-destination-measurement";
import { type BoundaryMeasureData, useMeasurer } from "./use-measurer";
import { type OpeningScreen, useOpeningScreen } from "./use-opening-screen";

interface BoundaryLifecycleProps {
	boundTag: BoundTag;
	config: BoundaryConfigProps;
	currentScreenKey: string;
	enabled: boolean;
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
	handoff,
	firstEscapeMeasureKey,
	localMeasurement,
	measuredRef,
	style,
}: BoundaryLifecycleProps) {
	const hasConfiguredInterpolator = useBuilderStore(
		(s) => s.derivations.hasConfiguredInterpolator,
	);
	// The transition that opens this screen: its own, or (the first screen of a nested stack) the one
	// that opens its stack, up the tree.
	const opening = useOpeningScreen();

	const runtimeEnabled =
		enabled && (hasConfiguredInterpolator || opening.hasConfiguredInterpolator);
	// Only a screen opened as a pair's destination (and not covered by another screen) can run the
	// destination handshake. Everywhere else, such as a list of sources, it is never mounted.
	const isReceivingDestination = opening.receiving;
	const preparedStyles = useMemo(() => prepareStyleForBounds(style), [style]);

	const scrollChain = useScrollChain();
	// What measuring this boundary needs of its own; its screen's coordinator brings the rest.
	const measureData = useMemo<BoundaryMeasureData>(
		() => ({
			enabled,
			boundTag,
			preparedStyles,
			measuredAnimatedRef: measuredRef,
			handoff,
			localMeasurement,
			firstEscapeMeasureKey,
			scrollChain,
		}),
		[
			enabled,
			boundTag,
			preparedStyles,
			measuredRef,
			handoff,
			localMeasurement,
			firstEscapeMeasureKey,
			scrollChain,
		],
	);

	// Presence and source capture must not depend on this screen owning an
	// interpolator: a nested source can participate in a transition owned by a
	// different navigator.
	useBoundaryPresence({
		enabled,
		boundTag,
		currentScreenKey,
		boundaryConfig: config,
		handoff,
	});

	// Source capture and refresh run from the screen's coordinator (one reaction per screen).
	useBoundaryMeasureRegistration({
		enabled,
		boundTag,
		currentScreenKey,
		measureData,
	});

	return runtimeEnabled && isReceivingDestination ? (
		<DestinationHandshake
			boundTag={boundTag}
			currentScreenKey={currentScreenKey}
			measureData={measureData}
			opening={opening}
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
	currentScreenKey,
	measureData,
	opening,
}: {
	boundTag: BoundTag;
	currentScreenKey: string;
	measureData: BoundaryMeasureData;
	opening: OpeningScreen;
}) {
	const measureBoundary = useMeasurer(measureData, currentScreenKey);
	useInitialDestinationMeasurement({
		boundTag,
		measureBoundary,
		opening,
	});
	return null;
});
