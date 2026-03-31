import type { MeasuredDimensions } from "react-native-reanimated";
import {
	EMPTY_BOUND_HELPER_RESULT_RAW,
	ENTER_RANGE,
	EXIT_RANGE,
	FULLSCREEN_DIMENSIONS,
	HIDDEN_STYLE,
	NO_STYLES,
} from "../../../../constants";
import {
	BoundStore,
	type ResolvedTransitionPair,
} from "../../../../stores/bounds";
import type { ScreenTransitionState } from "../../../../types/animation.types";
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
		BoundStore.resolveTransitionPair(String(params.id), {
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

	const start = sourceBounds;
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
	{ id, previous, current, next, progress, dimensions }: BoundsComputeParams,
	computeOptions: BoundsOptions = { id: "bound-id" },
	resolvedPair?: ResolvedTransitionPair,
) => {
	"worklet";

	if (!id) {
		if (computeOptions.raw) {
			return EMPTY_BOUND_HELPER_RESULT_RAW;
		}
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
		if (computeOptions.raw) {
			return EMPTY_BOUND_HELPER_RESULT_RAW;
		}
		return HIDDEN_STYLE;
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
