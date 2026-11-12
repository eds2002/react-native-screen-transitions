import {
	ENTER_RANGE,
	EXIT_RANGE,
	FULLSCREEN_DIMENSIONS,
	NO_STYLES,
} from "../../../../constants";
import {
	requestSourceMeasure,
	resolveScreenPairKey,
	resolveTransitionPair,
} from "../../../../stores/bounds";
import type { ScreenTransitionState } from "../../../../types/animation.types";
import type {
	BoundId,
	BoundsComputeParams,
	BoundsInternalOptions,
	MeasuredBounds,
} from "../../../../types/bounds.types";
import type { Layout } from "../../../../types/screen.types";
import {
	computeContentTransformGeometry,
	computeRelativeGeometry,
} from "../geometry";
import { toLayoutSpace } from "../screen-transform";
import {
	composeContentStyle,
	composeSize,
	composeTransformAbsolute,
	composeTransformRelative,
	type ElementComposeParams,
} from "./composers";
import { resolveOverlap } from "./overlap";
import { attachBoundsScreenFrame } from "./screen-frame";
import { pickVisualStyle } from "./visual-styles";

const resolveStartEnd = (params: {
	id: BoundId;
	previous?: ScreenTransitionState;
	current?: ScreenTransitionState;
	next?: ScreenTransitionState;
	dimensions: Layout;
	computeOptions: BoundsInternalOptions;
}) => {
	"worklet";

	const entering = !params.next;
	const target = params.computeOptions.target;
	const hasTargetOverride =
		target === "fullscreen" || typeof target === "object";

	const currentScreenKey = params.current?.route.key;
	const previousScreenKey = params.previous?.route.key;
	const nextScreenKey = params.next?.route.key;
	const tag = String(params.id);
	const pair = resolveTransitionPair(tag, {
		currentScreenKey,
		previousScreenKey,
		nextScreenKey,
		entering,
	});
	const {
		sourceBounds,
		destinationBounds,
		sourceScreenKey,
		destinationScreenKey,
	} = pair;
	const resolved = {
		entering,
		currentScreenKey,
		sourceScreenKey,
		destinationScreenKey,
		// A custom target has no destination look: the element keeps the source's.
		fromLook: pickVisualStyle(pair.sourceStyles as Record<string, unknown>),
		toLook:
			hasTargetOverride || !pair.destinationStyles
				? null
				: pickVisualStyle(pair.destinationStyles as Record<string, unknown>),
	};

	// A custom target needs no destination element, only the source.
	if (!sourceBounds || (!hasTargetOverride && !destinationBounds)) {
		if (!sourceBounds && hasTargetOverride) {
			// The screen that has the card, wherever it is in the route tree (not just this stack's
			// neighbour).
			const sourcePairKey = resolveScreenPairKey(tag, {
				currentScreenKey,
				previousScreenKey,
				nextScreenKey,
			});
			if (sourcePairKey) requestSourceMeasure(sourcePairKey, tag);
		}
		return {
			...resolved,
			start: null,
			end: null,
			layout: null,
			destinationBounds: null,
		};
	}

	return {
		...resolved,
		start: sourceBounds,
		end:
			typeof target === "object"
				? target
				: target === "fullscreen" || !destinationBounds
					? FULLSCREEN_DIMENSIONS(params.dimensions)
					: destinationBounds,
		// Where this element is laid out: the destination's slot entering, the source's leaving.
		layout: entering ? destinationBounds : sourceBounds,
		destinationBounds,
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
	computeOptions: BoundsInternalOptions,
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
		layout,
		destinationBounds,
		fromLook,
		toLook,
	} = resolveStartEnd({
		id,
		previous,
		current,
		next,
		computeOptions,
		dimensions,
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

	const isSize = computeOptions.method === "size";
	const isAbsolute = computeOptions.space === "absolute";
	// Styles follow the screens (see apply-screen-frames): their path is worked out where the screens
	// lay the element out, without the transforms the screens had when measured, and drawn through
	// where the screens are now. Raw values keep the window-space rects their callers compose with.
	const followsScreens = !computeOptions.raw && !isAbsolute;
	const sourceMeasuredWith = (start as MeasuredBounds).screenTransform;
	const destinationMeasuredWith = (destinationBounds as MeasuredBounds | null)
		?.screenTransform;
	const pathStart = followsScreens
		? toLayoutSpace(start, sourceMeasuredWith)
		: start;
	const pathEnd =
		followsScreens && end === destinationBounds
			? toLayoutSpace(end, destinationMeasuredWith)
			: end;
	const ownLayout =
		followsScreens && layout
			? toLayoutSpace(
					layout,
					entering ? destinationMeasuredWith : sourceMeasuredWith,
				)
			: layout;

	const geometry = computeRelativeGeometry({
		start: pathStart,
		end: pathEnd,
		entering,
		anchor: computeOptions.anchor,
		scaleMode: computeOptions.scaleMode,
	});

	const common: ElementComposeParams = {
		start: pathStart,
		end: pathEnd,
		progress,
		ranges,
		geometry,
		computeOptions,
		interpolationProps,
	};

	const style = isSize
		? composeSize(common, isAbsolute)
		: isAbsolute
			? composeTransformAbsolute(common)
			: composeTransformRelative(common);

	// Raw values are composed by their caller (the navigation helpers move the screen themselves).
	if (computeOptions.raw || isAbsolute) return style;
	const tag = String(id);
	const t = Math.min(1, Math.max(0, progress - ranges[0]));
	const { taken, landed, startChain } = resolveOverlap({
		tag,
		entering,
		currentScreenKey,
		sourceScreenKey,
		destinationScreenKey,
		t,
		pathStart,
		pathEnd,
	});
	return attachBoundsScreenFrame(taken ? { ...style, opacity: 0 } : style, {
		tag,
		t,
		sourceScreenKey,
		destinationScreenKey,
		screenKey: currentScreenKey,
		layout: ownLayout,
		start: pathStart,
		end: pathEnd,
		startChain,
		landed,
		fromLook,
		toLook,
	});
};
