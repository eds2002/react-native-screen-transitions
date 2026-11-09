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
import type { useScrollChain } from "../../../providers/motion/gestures/scroll-coordination";
import { useMotionStore } from "../../../providers/motion/motion.store";
import { useOptionalOrchestratorStore } from "../../../providers/orchestrator/orchestrator.store";
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
	toAffine,
	toLayoutSpace,
	unboundingBox,
} from "../../../utils/bounds/helpers/screen-transform";
import type { ScreenTransform } from "../../../utils/bounds/types/geometry";
import { isTeleportAvailable } from "../../../utils/teleport";
import { getVisibilityBlockOffset } from "../../../utils/visibility-block-offset";
import type {
	BoundaryLocalMeasurementValue,
	MeasureBoundary,
	MeasureTarget,
} from "../types";
import { notifyFirstEscapeMeasure } from "./first-escape-measure";
import {
	readLocalMeasurement,
	writeLocalMeasurement,
} from "./local-measurements";
import {
	attachScrollSnapshotToMeasuredBounds,
	correctMeasuredBoundsForVisibilityGate,
	isMeasurementInViewport,
	isScreenDrawnTooSmall,
	measureWithOverscrollAwareness,
} from "./measured-bounds";

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
/** How far a turned screen's measured scales may stray from its live scales' proportions. */
const SCREEN_TURN_TOLERANCE = 0.03;

type ScreenAtMeasure = {
	/** Where the screen was drawn (absent when it was not moved). */
	transform?: ScreenTransform;
	/** The boundary's box inside its screen's content (unscaled), from the same native frame. */
	contentOffset: { x: number; y: number; width: number; height: number };
};

/**
 * measureScreenAt for a screen drawn turned. Measurements report the bounds of turned boxes, so the
 * screen's turn comes from its live transform; its scales solve the content's bounds, its offset is
 * the content's center, and the boundary's box is what laid out to its bounds (see unboundingBox).
 */
const measureTurnedScreenAt = (
	boundary: MeasuredDimensions,
	content: MeasuredDimensions,
	width: number,
	height: number,
	live: ScreenTransform,
	gateDeltaY: number,
): ScreenAtMeasure | undefined => {
	"worklet";
	const rot = live.rot ?? 0;
	const cos = Math.abs(Math.cos(rot));
	const sin = Math.abs(Math.sin(rot));
	// content bounds = [W·cos H·sin; W·sin H·cos] · (sx, sy)
	const det = width * height * (cos * cos - sin * sin);
	let sx: number;
	let sy: number;
	if (Math.abs(det) > 0.2 * width * height) {
		sx = (height * cos * content.width - height * sin * content.height) / det;
		sy = (width * cos * content.height - width * sin * content.width) / det;
	} else {
		sx = sy = content.width / (width * cos + height * sin);
	}
	// The native frame measured can predate the live transform (a screen measured as it mounts, before
	// its interpolator's transform reached it: unturned and unscaled). Its scales then disagree with
	// the live ones' proportions: it is measured as a screen that is not turned.
	if (
		!(sx > 0 && sy > 0) ||
		Math.abs((sx / sy) * (live.sy / live.sx) - 1) > SCREEN_TURN_TOLERANCE
	) {
		return undefined;
	}
	const tx = content.pageX + content.width / 2 - width / 2;
	const ty = content.pageY + content.height / 2 - height / 2;
	const raw: ScreenTransform = { sx, sy, tx, ty, rot, width, height };
	const box = unboundingBox(
		{
			pageX: boundary.pageX,
			pageY: boundary.pageY,
			width: boundary.width,
			height: boundary.height,
		},
		toAffine(raw),
	);
	return {
		transform: { ...raw, ty: ty + gateDeltaY },
		contentOffset: {
			x: box.pageX,
			y: box.pageY,
			width: box.width,
			height: box.height,
		},
	};
};

/**
 * measureScreenAt's answer when its screen's drawing can't be measured from: drawn too small, or
 * drawn otherwise than its live transform says (the native frame and the transform are a frame or
 * more apart). The boundary is measured again.
 */
const NOT_MEASURABLE = "not-measurable" as const;

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
): ScreenAtMeasure | typeof NOT_MEASURABLE | undefined => {
	"worklet";
	const { contentRef, currentScreenKey, viewportWidth, viewportHeight } =
		screen;
	if (!contentRef) return undefined;
	const content = measure(contentRef);
	if (!content) return undefined;
	// A screen drawn (nearly) to nothing, or nested in one (a transition growing it from scale 0):
	// its boxes are that small too (see MIN_MEASURABLE_SCREEN_SCALE).
	if (
		isScreenDrawnTooSmall(content.width, viewportWidth) ||
		isScreenDrawnTooSmall(content.height, viewportHeight)
	) {
		return NOT_MEASURABLE;
	}
	const now = getScreenTransform(currentScreenKey);
	const width = now?.width || viewportWidth;
	const height = now?.height || viewportHeight;
	if (now && Math.abs(now.rot ?? 0) > 1e-4) {
		const turned = measureTurnedScreenAt(
			boundary,
			content,
			width,
			height,
			now,
			gateDeltaY,
		);
		if (turned) return turned;
	}
	const sx = content.width / width;
	const sy = content.height / height;
	// Drawn turned (or stretched) while its live transform says otherwise: a box of a turned screen,
	// read as a straight one, is off by as much as the turn moves it. Measured again.
	if (
		now &&
		Math.abs((sx / sy) * (now.sy / now.sx) - 1) > SCREEN_TURN_TOLERANCE
	) {
		return NOT_MEASURABLE;
	}
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
	// Nothing to place a boundary with: it is measured again.
	if (screenAt === NOT_MEASURABLE) return;

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
