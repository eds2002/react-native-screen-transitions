import type { MeasuredDimensions } from "react-native-reanimated";
import {
	EMPTY_BOUND_HELPER_RESULT,
	EMPTY_BOUND_HELPER_RESULT_RAW,
	ENTER_RANGE,
	EXIT_RANGE,
	FULLSCREEN_DIMENSIONS,
} from "../../constants";
import { BoundStore } from "../../stores/bound-store";
import type {
	ScreenInterpolationProps,
	ScreenTransitionState,
} from "../../types/animation";
import type { BoundsAccessor } from "../../types/bounds";
import type { Layout, ScreenPhase } from "../../types/core";
import type {
	BoundsBuilderInitParams,
	BoundsBuilderOptions,
} from "./_types/builder";
import {
	computeContentTransformGeometry,
	computeRelativeGeometry,
} from "./_utils/geometry";
import { getBounds } from "./_utils/get-bounds";
import {
	composeContentStyle,
	composeSizeAbsolute,
	composeSizeRelative,
	composeTransformAbsolute,
	composeTransformRelative,
	type ElementComposeParams,
} from "./_utils/style-composers";

export interface BuildBoundsAccessorParams {
	activeBoundId: string | null;
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
	const link = BoundStore.getActiveLink(
		props.id,
		props.current?.route.key,
		isClosing,
	);

	if (!link || !link.destination || !link.source) {
		return {
			start: null,
			end: null,
			entering,
		};
	}

	const { destination, source } = link;

	const start = source.bounds;

	let end = destination.bounds;

	const isFullscreen =
		props.computeOptions.target === "fullscreen" ||
		props.computeOptions.toFullscreen;

	if (isFullscreen) {
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
	{
		id,
		previous,
		current,
		next,
		progress,
		dimensions,
	}: BoundsBuilderInitParams,
	computeOptions: BoundsBuilderOptions = {},
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
	const isAbs =
		computeOptions.space === "absolute" || !!computeOptions.absolute;

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
		const id = params?.id ?? props.activeBoundId;

		return computeBoundStyles(
			{
				id,
				current: props.current,
				previous: props.previous,
				next: props.next,
				progress: props.progress,
				dimensions: props.layouts.screen,
			},
			params,
		);
	};

	const get = (id?: string, phase?: ScreenPhase) => {
		"worklet";
		return getBounds({
			id: id ?? props.activeBoundId,
			phase,
			current: props.current,
			previous: props.previous,
			next: props.next,
		});
	};

	return Object.assign(boundsFunction, { get }) as BoundsAccessor;
};
