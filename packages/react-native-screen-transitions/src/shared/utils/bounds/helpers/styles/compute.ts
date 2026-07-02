import type { MeasuredDimensions } from "react-native-reanimated";
import {
	ENTER_RANGE,
	EXIT_RANGE,
	FULLSCREEN_DIMENSIONS,
	NO_STYLES,
} from "../../../../constants";
import { createScreenPairKey } from "../../../../stores/bounds/helpers/link-pairs.helpers";
import { requestSourceMeasure } from "../../../../stores/bounds/internals/links";
import { resolveTransitionPair } from "../../../../stores/bounds/internals/resolver";
import type { ResolvedTransitionPair } from "../../../../stores/bounds/types";
import { getClampedScrollAxisDelta } from "../../../../stores/scroll.store";
import type { ScreenTransitionState } from "../../../../types/animation.types";
import type { ScrollMetadataState } from "../../../../types/gesture.types";
import type { Layout } from "../../../../types/screen.types";
import type {
	BoundId,
	BoundsComputeParams,
	BoundsOptions,
} from "../../types/options";
import {
	computeContentTransformGeometry,
	computeRelativeGeometry,
} from "../geometry";
import {
	composeContentStyle,
	composeSizeAbsolute,
	composeSizeRelative,
	composeTransformAbsolute,
	composeTransformRelative,
	type ElementComposeParams,
} from "./composers";
import { attachBoundsLocalTransform } from "./local-transform";

const getBoundsScrollSnapshot = (
	bounds: MeasuredDimensions | null,
): ScrollMetadataState | null => {
	"worklet";
	return (
		(bounds as { scroll?: ScrollMetadataState | null } | null)?.scroll ?? null
	);
};

const getScreenScrollMetadata = (
	screenKey: string | null,
	previous: ScreenTransitionState | undefined,
	current: ScreenTransitionState | undefined,
	next: ScreenTransitionState | undefined,
): ScrollMetadataState | null => {
	"worklet";
	if (!screenKey) return null;
	if (previous?.route.key === screenKey)
		return previous.layouts?.scroll ?? null;
	if (current?.route.key === screenKey) return current.layouts?.scroll ?? null;
	if (next?.route.key === screenKey) return next.layouts?.scroll ?? null;
	return null;
};

const shiftBounds = (
	bounds: MeasuredDimensions,
	dx: number,
	dy: number,
): MeasuredDimensions => {
	"worklet";
	if (dx === 0 && dy === 0) {
		return bounds;
	}

	return {
		...bounds,
		x: bounds.x + dx,
		y: bounds.y + dy,
		pageX: bounds.pageX + dx,
		pageY: bounds.pageY + dy,
	};
};

const resolveStartEnd = (params: {
	id: BoundId;
	previous?: ScreenTransitionState;
	current?: ScreenTransitionState;
	next?: ScreenTransitionState;
	toRect?: Partial<MeasuredDimensions>;
	dimensions: Layout;
	computeOptions: BoundsOptions;
	resolvedPair?: ResolvedTransitionPair;
}) => {
	"worklet";

	const entering = !params.next;
	const fullscreen = FULLSCREEN_DIMENSIONS(params.dimensions);

	const isFullscreenTarget = params.computeOptions.target === "fullscreen";
	const hasCustomTarget = typeof params.computeOptions.target === "object";
	const hasTargetOverride = isFullscreenTarget || hasCustomTarget;

	const currentScreenKey = params.current?.route.key;
	const previousScreenKey = params.previous?.route.key;
	const nextScreenKey = params.next?.route.key;
	const sourceMeasurePairKey =
		entering && previousScreenKey && currentScreenKey
			? createScreenPairKey(previousScreenKey, currentScreenKey)
			: !entering && currentScreenKey && nextScreenKey
				? createScreenPairKey(currentScreenKey, nextScreenKey)
				: null;

	const resolvedPair =
		params.resolvedPair ??
		resolveTransitionPair(String(params.id), {
			currentScreenKey,
			previousScreenKey,
			nextScreenKey,
			entering,
		});

	const sourceBounds = resolvedPair.sourceBounds;
	const destinationBounds = resolvedPair.destinationBounds;

	if (!sourceBounds) {
		if (hasTargetOverride && sourceMeasurePairKey) {
			requestSourceMeasure(sourceMeasurePairKey, String(params.id));
		}

		return {
			start: null,
			end: null,
			entering,
			currentScreenKey,
			sourceScreenKey: resolvedPair.sourceScreenKey,
			destinationScreenKey: resolvedPair.destinationScreenKey,
			hasTargetOverride,
		};
	}

	// When target is overridden, destination element is not required
	if (!hasTargetOverride && !destinationBounds) {
		return {
			start: null,
			end: null,
			entering,
			currentScreenKey,
			sourceScreenKey: resolvedPair.sourceScreenKey,
			destinationScreenKey: resolvedPair.destinationScreenKey,
			hasTargetOverride,
		};
	}

	/**
	 * Matched-screen portal continuity: while source content physically renders
	 * in the matched screen's host, the visual source endpoint still belongs to
	 * the source screen. If that source originated in a scroll-scoped host, keep
	 * the start rect tied to the live source placeholder. Destination movement is
	 * represented by the chosen portal host itself: root hosts float, nested hosts
	 * scroll naturally.
	 */
	const shouldTrackTeleportedSourceScroll =
		resolvedPair.sourcePortalHost !== undefined &&
		!!currentScreenKey &&
		currentScreenKey === resolvedPair.sourceScreenKey &&
		!!resolvedPair.destinationScreenKey &&
		currentScreenKey !== resolvedPair.destinationScreenKey &&
		params.computeOptions.method !== "content" &&
		resolvedPair.sourceHost?.capturesScroll === true;

	let sourceScrollShiftX = 0;
	let sourceScrollShiftY = 0;

	if (shouldTrackTeleportedSourceScroll) {
		const capturedSourceScroll = getBoundsScrollSnapshot(sourceBounds);
		const liveSourceScroll = getScreenScrollMetadata(
			resolvedPair.sourceScreenKey,
			params.previous,
			params.current,
			params.next,
		);
		sourceScrollShiftX = getClampedScrollAxisDelta(
			liveSourceScroll,
			capturedSourceScroll,
			"horizontal",
		);
		sourceScrollShiftY = getClampedScrollAxisDelta(
			liveSourceScroll,
			capturedSourceScroll,
			"vertical",
		);
	}

	const start = shiftBounds(
		sourceBounds,
		-sourceScrollShiftX,
		-sourceScrollShiftY,
	);
	let end = destinationBounds ?? fullscreen;

	if (isFullscreenTarget) {
		end = fullscreen;
	}

	const customTarget = params.computeOptions.target;
	if (typeof customTarget === "object") {
		end = customTarget;
	}

	return {
		start,
		end,
		entering,
		currentScreenKey,
		sourceScreenKey: resolvedPair.sourceScreenKey,
		destinationScreenKey: resolvedPair.destinationScreenKey,
		hasTargetOverride,
	};
};

export const computeBoundStyles = (
	{
		id,
		previous,
		current,
		next,
		progress,
		dimensions,
		interpolationProps,
	}: BoundsComputeParams,
	computeOptions: BoundsOptions = { id: "bound-id" },
	resolvedPair?: ResolvedTransitionPair,
) => {
	"worklet";

	if (!id) {
		return NO_STYLES;
	}

	const {
		start,
		end,
		entering,
		currentScreenKey,
		sourceScreenKey,
		destinationScreenKey,
	} = resolveStartEnd({
		id,
		previous,
		current,
		next,
		computeOptions,
		dimensions,
		resolvedPair,
	});

	if (!start || !end) {
		return NO_STYLES;
	}

	const ranges: readonly [number, number] = entering ? ENTER_RANGE : EXIT_RANGE;

	if (computeOptions.method === "content") {
		const currentOwnsSource =
			!!currentScreenKey &&
			currentScreenKey === sourceScreenKey &&
			currentScreenKey !== destinationScreenKey;
		const contentStart = currentOwnsSource ? end : start;
		const contentEnd = currentOwnsSource ? start : end;
		const geometry = computeContentTransformGeometry({
			start: contentStart,
			end: contentEnd,
			entering,
			dimensions,
			anchor: computeOptions.anchor,
			scaleMode: computeOptions.scaleMode,
		});

		return composeContentStyle({
			start: contentStart,
			progress,
			ranges,
			end: contentEnd,
			geometry,
			computeOptions,
			interpolationProps,
		});
	}

	const geometry = computeRelativeGeometry({
		start,
		end,
		entering,
		anchor: computeOptions.anchor,
		scaleMode: computeOptions.scaleMode,
	});

	const common: ElementComposeParams = {
		start,
		end,
		progress,
		ranges,
		geometry,
		computeOptions,
		interpolationProps,
	};

	const isSize = computeOptions.method === "size";
	const isAbsolute = computeOptions.space === "absolute";

	const style = isSize
		? isAbsolute
			? composeSizeAbsolute(common)
			: composeSizeRelative(common)
		: isAbsolute
			? composeTransformAbsolute(common)
			: composeTransformRelative(common);

	return attachBoundsLocalTransform(
		style,
		entering
			? (resolvedPair?.destinationStyles ?? null)
			: (resolvedPair?.sourceStyles ?? null),
	);
};
