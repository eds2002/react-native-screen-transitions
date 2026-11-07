import { useCallback, useMemo } from "react";
import type { View } from "react-native";
import { useWindowDimensions } from "react-native";
import {
	type AnimatedRef,
	type MeasuredDimensions,
	measure,
	type SharedValue,
	type StyleProps,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useMotionStore } from "../../../providers/motion";
import type { useScrollChain } from "../../../providers/motion/gestures/scroll-coordination";
import { useOptionalOrchestratorStore } from "../../../providers/orchestrator/orchestrator.provider";
import type { BoundTag } from "../../../stores/bounds";
import {
	getEntry,
	getScreenTransform,
	setDestination,
	setEntry,
	setSource,
} from "../../../stores/bounds";
import { ScrollStore } from "../../../stores/scroll.store";
import {
	type ScreenTransform,
	toLayoutSpace,
} from "../../../utils/bounds/helpers/screen-transform";
import { getVisibilityBlockOffset } from "../../../utils/visibility-block-offset";
import { isTeleportAvailable } from "../portal/teleport";
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
	/** A full-size view inside the screen's content: where the screen is drawn when measured. */
	contentRef: AnimatedRef<View> | null;
};

/** What measuring one boundary needs of its own: data, registered with its screen's coordinator. */
export type BoundaryMeasureData = {
	enabled: boolean;
	boundTag: BoundTag;
	preparedStyles: StyleProps;
	measuredAnimatedRef: AnimatedRef<View>;
	handoff: boolean;
	localMeasurement: BoundaryLocalMeasurementValue;
	/** Key for `notifyFirstEscapeMeasure` (a number, so no per-boundary JS function reaches the UI thread). */
	firstEscapeMeasureKey: number;
	scrollChain: ReturnType<typeof useScrollChain>;
};

/** One per screen (its coordinator, or a destination's handshake): the screen side of measuring. */
export const useScreenMeasureContext = (
	currentScreenKey: string,
	contentRef: AnimatedRef<View> | null,
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
			contentRef,
		}),
		[
			currentScreenKey,
			viewportWidth,
			viewportHeight,
			scrollState,
			scrollMetadata,
			pendingLifecycleStartBlockCount,
			isScreenReady,
			contentRef,
		],
	);
};

const SCREEN_TRANSFORM_EPSILON = 0.01;

type ScreenAtMeasure = {
	/** Where the screen was drawn (absent when it was not moved). */
	transform?: ScreenTransform;
	/** The boundary's box inside its screen's content (unscaled), from the same native frame. */
	contentOffset: { x: number; y: number; width: number; height: number };
};

/**
 * Where the screen was drawn at this measurement, from its content's reference view measured the
 * same moment (so it matches what the boundary measurement includes, frame for frame).
 * Measurements are in window space: recording the screen's transform lets bounds elements correct
 * only for how far the screen has moved since, and the boundary's offset inside the content places
 * its escaped frame in the screen's overlay (which sits at the content's origin) however the screen
 * was drawn. `gateDeltaY` is the visibility-gate correction applied to the boundary itself.
 * Assumes the screen's content sits at the window's origin when it is not transformed.
 */
const measureScreenAt = (
	screen: ScreenMeasureContext,
	boundary: MeasuredDimensions,
	gateDeltaY: number,
): ScreenAtMeasure | undefined => {
	"worklet";
	const { contentRef, currentScreenKey, viewportWidth, viewportHeight } =
		screen;
	if (!contentRef) return undefined;
	const content = measure(contentRef);
	if (!content || content.width <= 0 || content.height <= 0) {
		return undefined;
	}
	const now = getScreenTransform(currentScreenKey);
	const width = now?.width || viewportWidth;
	const height = now?.height || viewportHeight;
	const sx = content.width / width;
	const sy = content.height / height;
	const contentOffset = {
		x: (boundary.pageX - content.pageX) / sx,
		y: (boundary.pageY - content.pageY) / sy,
		width: boundary.width / sx,
		height: boundary.height / sy,
	};
	const tx = content.pageX + content.width / 2 - width / 2;
	const ty = content.pageY + gateDeltaY + content.height / 2 - height / 2;
	if (
		Math.abs(sx - 1) < SCREEN_TRANSFORM_EPSILON &&
		Math.abs(sy - 1) < SCREEN_TRANSFORM_EPSILON &&
		Math.abs(tx) < 0.5 &&
		Math.abs(ty) < 0.5
	) {
		return { contentOffset };
	}
	return { transform: { sx, sy, tx, ty, width, height }, contentOffset };
};

/** Records a boundary's measurement as its side of the pair being measured for. */
const recordLink = (
	target: MeasureTarget,
	{ boundTag, preparedStyles, handoff }: BoundaryMeasureData,
	screenKey: string,
	bounds: MeasuredDimensions,
) => {
	"worklet";
	const record = target.type === "source" ? setSource : setDestination;
	record(
		target.pairKey,
		boundTag.linkKey,
		screenKey,
		bounds,
		preparedStyles,
		boundTag.group,
		{ handoff },
	);
};

/** Measures one boundary for a transition and records it (bounds entry, pair link, escape placement). */
export const measureBoundaryWith = (
	screen: ScreenMeasureContext,
	data: BoundaryMeasureData,
	target: MeasureTarget,
	/** Record its last measurement instead (it is drawn somewhere else right now; see the coordinator). */
	reuseLast = false,
) => {
	"worklet";
	const {
		enabled,
		boundTag,
		measuredAnimatedRef,
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

	const last = reuseLast
		? getEntry(boundTag.tag, currentScreenKey)?.bounds
		: undefined;
	if (last) {
		recordLink(target, data, currentScreenKey, last);
		return;
	}

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

	// Where the screen was drawn at this measurement (see measureScreenAt). The viewport guard reads
	// the boundary where its screen lays it out: a destination measured while its screen's own
	// transition has it off-screen (sliding in from the side) is still a valid measurement.
	const screenAt = measureScreenAt(
		screen,
		measured,
		correctedMeasured.pageY - measured.pageY,
	);

	const viewportAllowsDestinationWrite =
		target.type !== "destination" ||
		!shouldGuardDestinationViewport ||
		isMeasurementInViewport(
			toLayoutSpace(correctedMeasured, screenAt?.transform),
			viewportWidth,
			viewportHeight,
		);

	if (!viewportAllowsDestinationWrite) return;

	const measuredWithScrollOnly = attachScrollSnapshotToMeasuredBounds(
		correctedMeasured,
		scrollMetadata.get(),
		scrollChain,
	);
	const measuredWithScroll = screenAt
		? {
				...measuredWithScrollOnly,
				contentOffset: screenAt.contentOffset,
				...(screenAt.transform ? { screenTransform: screenAt.transform } : {}),
			}
		: measuredWithScrollOnly;

	// Handoff can render into the destination boundary's escape host too.
	// Capture only accepted geometry, correcting the destination visibility gate. The scroll
	// snapshot lets the escaped frame follow its scroll views while it is in the overlay.
	if (isTeleportAvailable) {
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

	recordLink(target, data, currentScreenKey, measuredWithScroll);
};

/** A boundary's measure function from its own data and its screen's context (the destination handshake). */
export const useMeasurer = (
	data: BoundaryMeasureData,
	currentScreenKey: string,
): MeasureBoundary => {
	const contentRef = useOptionalOrchestratorStore(
		(store) => store?.contentMeasureRef ?? null,
	);
	const screen = useScreenMeasureContext(currentScreenKey, contentRef);
	return useCallback(
		(target) => {
			"worklet";
			measureBoundaryWith(screen, data, target);
		},
		[screen, data],
	);
};
