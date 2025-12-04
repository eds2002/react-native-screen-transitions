import type { MeasuredDimensions } from "react-native-reanimated";
import {
	EMPTY_BOUND_HELPER_RESULT,
	EMPTY_BOUND_HELPER_RESULT_RAW,
	ENTER_RANGE,
	EXIT_RANGE,
	FULLSCREEN_DIMENSIONS,
} from "../../constants";
import { BoundStore, type Snapshot } from "../../stores/bounds.store";
import type {
	ScreenInterpolationProps,
	ScreenTransitionState,
} from "../../types/animation.types";
import type { BoundsAccessor } from "../../types/bounds.types";
import type { Layout } from "../../types/core.types";
import {
	computeContentTransformGeometry,
	computeRelativeGeometry,
} from "./helpers/geometry";
import {
	composeContentStyle,
	composeSizeAbsolute,
	composeSizeRelative,
	composeTransformAbsolute,
	composeTransformRelative,
	type ElementComposeParams,
} from "./helpers/style-composers";
import type {
	BoundsBuilderOptions,
	BoundsComputeParams,
} from "./types/builder";

export interface BuildBoundsAccessorParams {
	current: ScreenTransitionState;
	previous?: ScreenTransitionState;
	next?: ScreenTransitionState;
	progress: number;
	dimensions: Layout;
}

const resolveBounds = (props: {
	id: string;
	previous?: ScreenTransitionState;
	current?: ScreenTransitionState;
	next?: ScreenTransitionState;
	toRect?: Partial<MeasuredDimensions>;
	dimensions: Layout;
	computeOptions: BoundsBuilderOptions;
}) => {
	"worklet";
	const entering = !props.next;
	const fullscreen = FULLSCREEN_DIMENSIONS(props.dimensions);
	const isClosing = props.current?.closing === 1;

	const isFullscreenTarget = props.computeOptions.target === "fullscreen";

	// Try exact match first (strict matching for nested stacks)
	let link = BoundStore.getActiveLink(
		props.id,
		props.current?.route.key,
		isClosing,
	);

	// For fullscreen target, fall back to most recent link for this tag
	// (destination screen might not have a matching element)
	if (!link && isFullscreenTarget) {
		link = BoundStore.getActiveLink(props.id); // No screenKey = get most recent
	}

	if (!link || !link.source) {
		return {
			start: null,
			end: null,
			entering,
		};
	}

	// For fullscreen target, destination element is not required
	if (!isFullscreenTarget && !link.destination) {
		return {
			start: null,
			end: null,
			entering,
		};
	}

	const { destination, source } = link;

	const start = source.bounds;
	let end = destination?.bounds ?? fullscreen;

	if (isFullscreenTarget) {
		end = fullscreen;
	}

	const customTarget = props.computeOptions.target;

	if (typeof customTarget === "object") {
		end = customTarget;
	}

	return {
		start,
		end,
		entering,
	};
};

const computeBoundStyles = (
	{ id, previous, current, next, progress, dimensions }: BoundsComputeParams,
	computeOptions: BoundsBuilderOptions = { id: "bound-id" },
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
	const isAbs = computeOptions.space === "absolute";

	return isSize
		? isAbs
			? composeSizeAbsolute(common)
			: composeSizeRelative(common)
		: isAbs
			? composeTransformAbsolute(common)
			: composeTransformRelative(common);
};

export const createBounds = (
	props: Omit<ScreenInterpolationProps, "bounds">,
): BoundsAccessor => {
	"worklet";

	const boundsFunction = (params?: BoundsBuilderOptions) => {
		"worklet";
		const id = params?.id;

		return computeBoundStyles(
			{
				id,
				previous: props.previous,
				current: props.current,
				next: props.next,
				progress: props.progress,
				dimensions: props.layouts.screen,
			},
			params,
		);
	};

	const getSnapshot = (tag: string, key: string): Snapshot | null => {
		"worklet";
		return BoundStore.getSnapshot(tag, key);
	};

	const getPair = (tag: string): { from: Snapshot; to: Snapshot } | null => {
		"worklet";
		const isClosing = props.current?.closing === 1;
		return BoundStore.getPair(tag, props.current?.route.key, isClosing);
	};

	return Object.assign(boundsFunction, {
		getSnapshot,
		getPair,
	}) as BoundsAccessor;
};
