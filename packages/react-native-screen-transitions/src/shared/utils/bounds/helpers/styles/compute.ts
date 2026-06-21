import type { MeasuredDimensions } from "react-native-reanimated";
import {
	ENTER_RANGE,
	EXIT_RANGE,
	FULLSCREEN_DIMENSIONS,
	NO_STYLES,
} from "../../../../constants";
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
	 * Teleport continuity: this screen's source content physically renders
	 * inside the matched screen's portal host, which travels with that screen's
	 * ScrollView. Screen-fixed rects (the source, fullscreen/custom targets)
	 * must be expressed in the host's frame by the clamped scroll travel since
	 * the destination capture. The destination rect rides with the host, so it
	 * stays untouched. Classic two-component links never set a portal host and
	 * skip this entirely.
	 */
	const isTeleportedSourceElement =
		resolvedPair.sourcePortalAttachTarget === "matched-screen" &&
		!!currentScreenKey &&
		currentScreenKey === resolvedPair.sourceScreenKey &&
		!!resolvedPair.destinationScreenKey &&
		currentScreenKey !== resolvedPair.destinationScreenKey &&
		params.computeOptions.method !== "content";

	let teleportShiftX = 0;
	let teleportShiftY = 0;
	let sourceScrollShiftX = 0;
	let sourceScrollShiftY = 0;

	if (isTeleportedSourceElement) {
		const capturedScroll = getBoundsScrollSnapshot(destinationBounds);
		const liveScroll = getScreenScrollMetadata(
			resolvedPair.destinationScreenKey,
			params.previous,
			params.current,
			params.next,
		);
		teleportShiftX = getClampedScrollAxisDelta(
			liveScroll,
			capturedScroll,
			"horizontal",
		);
		teleportShiftY = getClampedScrollAxisDelta(
			liveScroll,
			capturedScroll,
			"vertical",
		);

		// A source that lives inside its own scroll host travels with that
		// ScrollView in page space. Shifting the start rect by the clamped source
		// scroll travel keeps it aligned with the live placeholder; the host
		// placement applies the identical shift, so the shifts cancel at full
		// progress and the open frame is untouched. Screen-fixed rects (the
		// fullscreen/custom end targets below) are not inside the scroll content
		// and keep only the destination shift.
		if (resolvedPair.sourceHost?.capturesScroll) {
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
	}

	const start = shiftBounds(
		sourceBounds,
		teleportShiftX - sourceScrollShiftX,
		teleportShiftY - sourceScrollShiftY,
	);
	let end = destinationBounds ?? fullscreen;

	if (isFullscreenTarget) {
		end = fullscreen;
	}

	const customTarget = params.computeOptions.target;
	if (typeof customTarget === "object") {
		end = customTarget;
	}

	if (hasTargetOverride) {
		end = shiftBounds(end, teleportShiftX, teleportShiftY);
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

	return isSize
		? isAbsolute
			? composeSizeAbsolute(common)
			: composeSizeRelative(common)
		: isAbsolute
			? composeTransformAbsolute(common)
			: composeTransformRelative(common);
};
