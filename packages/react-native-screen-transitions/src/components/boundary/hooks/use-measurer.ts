import { useCallback, useMemo } from "react";
import type { View } from "react-native";
import { useWindowDimensions } from "react-native";
import type {
	AnimatedRef,
	SharedValue,
	StyleProps,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useMotionStore } from "../../../providers/motion";
import { useScrollChain } from "../../../providers/motion/gestures/scroll-coordination";
import { setEntry } from "../../../stores/bounds/internals/entries";
import {
	setDestination,
	setSource,
} from "../../../stores/bounds/internals/links";
import type { BoundTag } from "../../../stores/bounds/types";
import { ScrollStore } from "../../../stores/scroll.store";
import { getVisibilityBlockOffset } from "../../../utils/visibility-block-offset";
import type {
	BoundaryLocalMeasurementValue,
	MeasureBoundary,
	MeasureTarget,
} from "../types";
import { notifyFirstEscapeMeasure } from "../utils/first-escape-measure";
import {
	readLocalMeasurement,
	writeLocalMeasurement,
} from "../utils/local-measurements";
import {
	attachScrollSnapshotToMeasuredBounds,
	correctMeasuredBoundsForVisibilityGate,
	isMeasurementInViewport,
	measureWithOverscrollAwareness,
} from "../utils/measured-bounds";

/** What a boundary's measurement needs from its screen: the same for every boundary on it. */
export type ScreenMeasureContext = {
	currentScreenKey: string;
	viewportWidth: number;
	viewportHeight: number;
	scrollState: ReturnType<typeof ScrollStore.getValue<"coordination">>;
	scrollMetadata: ReturnType<typeof ScrollStore.getValue<"metadata">>;
	pendingLifecycleStartBlockCount: SharedValue<number>;
	isScreenReady: SharedValue<boolean>;
};

/** What measuring one boundary needs of its own: data, registered with its screen's coordinator. */
export type BoundaryMeasureData = {
	enabled: boolean;
	boundTag: BoundTag;
	preparedStyles: StyleProps;
	measuredAnimatedRef: AnimatedRef<View>;
	handoff: boolean;
	escapeClipping: boolean;
	localMeasurement: BoundaryLocalMeasurementValue;
	/** Key for `notifyFirstEscapeMeasure` (a number, so no per-boundary JS function reaches the UI thread). */
	firstEscapeMeasureKey: number;
	scrollChain: ReturnType<typeof useScrollChain>;
};

/** One per screen (its coordinator, or a destination's handshake): the screen side of measuring. */
export const useScreenMeasureContext = (
	currentScreenKey: string,
): ScreenMeasureContext => {
	const { width: viewportWidth, height: viewportHeight } =
		useWindowDimensions();
	const scrollState = ScrollStore.getValue(currentScreenKey, "coordination");
	const scrollMetadata = ScrollStore.getValue(currentScreenKey, "metadata");
	const pendingLifecycleStartBlockCount = useMotionStore(
		(store) => store.state.pendingLifecycleStartBlockCount,
	);
	const isScreenReady = useMotionStore((store) => store.isScreenReady);
	return useMemo(
		() => ({
			currentScreenKey,
			viewportWidth,
			viewportHeight,
			scrollState,
			scrollMetadata,
			pendingLifecycleStartBlockCount,
			isScreenReady,
		}),
		[
			currentScreenKey,
			viewportWidth,
			viewportHeight,
			scrollState,
			scrollMetadata,
			pendingLifecycleStartBlockCount,
			isScreenReady,
		],
	);
};

/** Measures one boundary for a transition and records it (bounds entry, pair link, escape placement). */
export const measureBoundaryWith = (
	screen: ScreenMeasureContext,
	data: BoundaryMeasureData,
	target: MeasureTarget,
) => {
	"worklet";
	const {
		enabled,
		boundTag,
		preparedStyles,
		measuredAnimatedRef,
		handoff,
		escapeClipping,
		localMeasurement,
		firstEscapeMeasureKey,
		scrollChain,
	} = data;
	const {
		currentScreenKey,
		viewportWidth,
		viewportHeight,
		scrollState,
		scrollMetadata,
		pendingLifecycleStartBlockCount,
		isScreenReady,
	} = screen;
	if (!enabled) return;

	const measured = measureWithOverscrollAwareness(
		measuredAnimatedRef,
		scrollState.get(),
	);

	if (!measured) return;

	const correctedMeasured = correctMeasuredBoundsForVisibilityGate({
		measured,
		isScreenReady: isScreenReady.get(),
		visibilityBlockOffset: getVisibilityBlockOffset(viewportHeight),
		viewportWidth,
		viewportHeight,
	});

	/**
	 * - Destination Pass -
	 * Be strict while lifecycle start is blocked for destination capture.
	 * This is the initial attach window: the transition has not started yet,
	 * and malformed off-screen destination measurements should keep the
	 * lifecycle blocked until a valid retry lands.
	 */
	const shouldGuardDestinationViewport =
		pendingLifecycleStartBlockCount.get() > 0 || !!boundTag.group;

	const viewportAllowsDestinationWrite =
		target.type !== "destination" ||
		!shouldGuardDestinationViewport ||
		isMeasurementInViewport(correctedMeasured, viewportWidth, viewportHeight);

	if (!viewportAllowsDestinationWrite) return;

	const measuredWithScroll = attachScrollSnapshotToMeasuredBounds(
		correctedMeasured,
		scrollMetadata.get(),
		scrollChain,
	);

	// Handoff can render into the destination boundary's escape host too.
	// Capture only accepted geometry, correcting the destination visibility gate. The scroll
	// snapshot lets the escaped frame follow its scroll views while it is in the overlay.
	if (escapeClipping) {
		// The first measurement is what gives this boundary a host in the overlay.
		if (readLocalMeasurement(localMeasurement) === null)
			scheduleOnRN(notifyFirstEscapeMeasure, firstEscapeMeasureKey);
		writeLocalMeasurement(localMeasurement, {
			bounds: measuredWithScroll,
			pairKey: target.pairKey,
		});
	}

	// Refresh the public bounds entry on every accepted measurement.
	setEntry(boundTag.tag, currentScreenKey, { bounds: measuredWithScroll });

	if (target.type === "source") {
		setSource(
			target.pairKey,
			boundTag.linkKey,
			currentScreenKey,
			measuredWithScroll,
			preparedStyles,
			boundTag.group,
			{ handoff, escapeClipping },
		);
	}

	if (target.type === "destination") {
		setDestination(
			target.pairKey,
			boundTag.linkKey,
			currentScreenKey,
			measuredWithScroll,
			preparedStyles,
			boundTag.group,
			{ handoff },
		);
	}
};

/** A boundary's measure function from its own data and its screen's context (the destination handshake). */
export const useMeasurer = (
	data: Omit<BoundaryMeasureData, "scrollChain"> & { currentScreenKey: string },
): MeasureBoundary => {
	const screen = useScreenMeasureContext(data.currentScreenKey);
	const scrollChain = useScrollChain();
	const {
		enabled,
		boundTag,
		preparedStyles,
		measuredAnimatedRef,
		handoff,
		escapeClipping,
		localMeasurement,
		firstEscapeMeasureKey,
	} = data;
	return useCallback(
		(target) => {
			"worklet";
			measureBoundaryWith(
				screen,
				{
					enabled,
					boundTag,
					preparedStyles,
					measuredAnimatedRef,
					handoff,
					escapeClipping,
					localMeasurement,
					firstEscapeMeasureKey,
					scrollChain,
				},
				target,
			);
		},
		[
			screen,
			enabled,
			boundTag,
			preparedStyles,
			measuredAnimatedRef,
			handoff,
			escapeClipping,
			localMeasurement,
			firstEscapeMeasureKey,
			scrollChain,
		],
	);
};
