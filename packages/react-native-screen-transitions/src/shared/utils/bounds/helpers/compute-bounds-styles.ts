import type { MeasuredDimensions } from "react-native-reanimated";
import {
	EMPTY_BOUND_HELPER_RESULT,
	EMPTY_BOUND_HELPER_RESULT_RAW,
	ENTER_RANGE,
	EXIT_RANGE,
	FULLSCREEN_DIMENSIONS,
} from "../../../constants";
import { BoundStore } from "../../../stores/bounds.store";
import type { ScreenTransitionState } from "../../../types/animation.types";
import type { Layout } from "../../../types/screen.types";
import type { BoundsComputeParams, BoundsOptions } from "../types/options";
import {
	computeContentTransformGeometry,
	computeRelativeGeometry,
} from "./geometry";
import {
	composeContentStyle,
	composeSizeAbsolute,
	composeSizeRelative,
	composeTransformAbsolute,
	composeTransformRelative,
	type ElementComposeParams,
} from "./style-composers";

const resolveBounds = (params: {
	id: string;
	previous?: ScreenTransitionState;
	current?: ScreenTransitionState;
	next?: ScreenTransitionState;
	toRect?: Partial<MeasuredDimensions>;
	dimensions: Layout;
	computeOptions: BoundsOptions;
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

	const resolvedPair = BoundStore.resolveTransitionPair(params.id, {
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
		};
	}

	// When target is overridden, destination element is not required
	if (!hasTargetOverride && !destinationBounds) {
		return {
			start: null,
			end: null,
			entering,
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
	};
};

export const computeBoundStyles = (
	{ id, previous, current, next, progress, dimensions }: BoundsComputeParams,
	computeOptions: BoundsOptions = { id: "bound-id" },
) => {
	"worklet";

	if (!id) {
		if (computeOptions.raw) {
			return EMPTY_BOUND_HELPER_RESULT_RAW;
		}
		return EMPTY_BOUND_HELPER_RESULT;
	}

	const { start, end, entering } = resolveBounds({
		id,
		previous,
		current,
		next,
		computeOptions,
		dimensions,
	});

	if (!start || !end) {
		if (computeOptions.raw) {
			return EMPTY_BOUND_HELPER_RESULT_RAW;
		}
		return EMPTY_BOUND_HELPER_RESULT;
	}

	const ranges: readonly [number, number] = entering ? ENTER_RANGE : EXIT_RANGE;

	if (computeOptions.method === "content") {
		const geometry = computeContentTransformGeometry({
			start,
			end,
			entering,
			dimensions,
			anchor: computeOptions.anchor,
			scaleMode: computeOptions.scaleMode,
		});

		return composeContentStyle({
			start,
			progress,
			ranges,
			end,
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
