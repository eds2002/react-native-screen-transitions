import type { ScaledSize } from "react-native";
import {
	interpolate,
	type MeasuredDimensions,
	type StyleProps,
} from "react-native-reanimated";
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
import { DEFAULT_BUILDER_OPTIONS, FULLSCREEN_DIMENSIONS } from "./constants";

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

	const resolve = (phase?: ScreenPhase) => {
		"worklet";
		if (phase === "previous") return props.previous?.bounds?.[props.id]?.bounds;
		if (phase === "current") return props.current?.bounds?.[props.id]?.bounds;
		if (phase === "next") return props.next?.bounds?.[props.id]?.bounds;
		return null;
	};

	const start = resolve(startPhase);
	let end = resolve(endPhase);

	if (
		props.computeOptions.target === "fullscreen" ||
		props.computeOptions.toFullscreen
	) {
		end = fullscreen;
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
	if (!id) return {};

	const { start, end, entering } = resolveBounds({
		id,
		previous,
		current,
		next,
		computeOptions: computeOptions,
		dimensions,
	});

	if (!start || !end) return {};

	const geometry = computeRelativeGeometry({
		start,
		end,
		entering,
		anchor: computeOptions.anchor,
		scaleMode: computeOptions.scaleMode,
	});

	const interp = (a: number, b: number) =>
		interpolate(progress, geometry.ranges, [a, b]);

	const common: ElementComposeParams = {
		start,
		end,
		interp,
		geometry,
		computeOptions,
	};

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
			...common,
			geometry,
			computeOptions,
		});
	}

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

const createBoundStyles = (
	params: BoundsBuilderInitParams & { options: BoundsBuilderOptions },
): StyleProps => {
	"worklet";

	return computeBoundStyles(params, params.options);
};

export const createBounds = ({
	activeBoundId,
	...screenAnimationContext
}: BuildBoundsAccessorParams): BoundsAccessor => {
	"worklet";

	const bounds: BoundsAccessor = ((params?: string | BoundsBuilderOptions) => {
		if (typeof params === "object") {
			return createBoundStyles({
				id: activeBoundId,
				options: params,
				...screenAnimationContext,
			});
		}

		const id = typeof params === "string" ? params : activeBoundId;
		return buildBoundStyles({
			id,
			...screenAnimationContext,
		});
	}) as BoundsAccessor;

	bounds.get = (id?: string, phase?: ScreenPhase) =>
		getBounds({
			id: id ?? activeBoundId,
			phase,
			...screenAnimationContext,
		});

	return bounds;
};
