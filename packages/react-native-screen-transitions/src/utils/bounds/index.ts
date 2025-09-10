import type { ScaledSize } from "react-native";
import type { MeasuredDimensions } from "react-native-reanimated";
import {
	DEFAULT_BUILDER_OPTIONS,
	EMPTY_BOUND_HELPER_RESULT,
	EMPTY_BOUND_HELPER_RESULT_RAW,
	ENTER_RANGE,
	EXIT_RANGE,
	FULLSCREEN_DIMENSIONS,
} from "../../constants";
import type { ScreenTransitionState } from "../../types/animation";
import type { BoundsAccessor, BoundsBuilder } from "../../types/bounds";
import type { ScreenPhase } from "../../types/core";
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
	dimensions: ScaledSize;
}

const resolveBounds = (props: {
	id: string;
	previous?: ScreenTransitionState;
	current?: ScreenTransitionState;
	next?: ScreenTransitionState;
	toRect?: Partial<MeasuredDimensions>;
	dimensions: ScaledSize;
	computeOptions: BoundsBuilderOptions;
}) => {
	"worklet";
	const entering = !props.next;

	const fullscreen = FULLSCREEN_DIMENSIONS(props.dimensions);

	const startPhase: ScreenPhase = entering ? "previous" : "current";
	const endPhase: ScreenPhase = entering ? "current" : "next";

	const getPhaseBounds = (phase?: ScreenPhase) => {
		"worklet";
		switch (phase) {
			case "previous":
				return props.previous?.bounds?.[props.id]?.bounds;
			case "current":
				return props.current?.bounds?.[props.id]?.bounds;
			case "next":
				return props.next?.bounds?.[props.id]?.bounds;
			default:
				return null;
		}
	};

	const start = getPhaseBounds(startPhase);
	let end = getPhaseBounds(endPhase);

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

/**
 * @deprecated Use `createBounds` instead. We'll avoid using the builder pattern for this type of function.
 */
const buildBoundStyles = (params: BoundsBuilderInitParams): BoundsBuilder => {
	"worklet";

	const cfg: { options: BoundsBuilderOptions } = {
		options: { ...DEFAULT_BUILDER_OPTIONS },
	};

	const builder = (): BoundsBuilder => ({
		gestures: (options) => {
			cfg.options.gestures = options;
			return builder();
		},
		toFullscreen: () => {
			cfg.options.toFullscreen = true;
			return builder();
		},
		absolute: () => {
			cfg.options.absolute = true;
			cfg.options.relative = false;
			return builder();
		},
		relative: () => {
			cfg.options.relative = true;
			cfg.options.absolute = false;
			return builder();
		},
		transform: () => {
			cfg.options.method = "transform";
			return builder();
		},
		size: () => {
			cfg.options.method = "size";
			return builder();
		},
		content: () => {
			cfg.options.method = "content";
			return builder();
		},
		contentFill: () => {
			cfg.options.contentScaleMode = "aspectFill";
			return builder();
		},
		contentFit: () => {
			cfg.options.contentScaleMode = "aspectFit";
			return builder();
		},

		build: () => {
			return computeBoundStyles(params, cfg.options);
		},
	});

	return builder();
};

export const createBounds = ({
	activeBoundId,
	current,
	previous,
	next,
	progress,
	dimensions,
}: BuildBoundsAccessorParams): BoundsAccessor => {
	"worklet";

	const bounds: BoundsAccessor = ((params?: string | BoundsBuilderOptions) => {
		if (typeof params === "object") {
			const id = params.id ?? activeBoundId;

			return computeBoundStyles(
				{
					id,
					current,
					previous,
					next,
					progress,
					dimensions,
				},
				params,
			);
		}

		const id = typeof params === "string" ? params : activeBoundId;
		return buildBoundStyles({
			id,
			current,
			previous,
			next,
			progress,
			dimensions,
		});
	}) as BoundsAccessor;

	bounds.get = (id?: string, phase?: ScreenPhase) =>
		getBounds({
			id: id ?? activeBoundId,
			phase,
			current,
			previous,
			next,
		});

	return bounds;
};
