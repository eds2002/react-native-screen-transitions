import type { ScaledSize } from "react-native";
import { interpolate, type MeasuredDimensions } from "react-native-reanimated";
import type { ScreenTransitionState } from "../../types/animation";
import type { BoundsBuilder } from "../../types/bounds";
import type { ScreenPhase } from "../../types/core";
import type {
	BoundsBuilderInitParams,
	BoundsBuilderOptions,
} from "./_types/builder";
import { DEFAULT_BUILDER_OPTIONS, FULLSCREEN_DIMENSIONS } from "./constants";
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

function resolveBounds(props: {
	id: string;
	previous?: ScreenTransitionState;
	current?: ScreenTransitionState;
	next?: ScreenTransitionState;
	toRect?: Partial<MeasuredDimensions>;
	dimensions: ScaledSize;
	computeOptions: BoundsBuilderOptions;
}) {
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

	if (props.computeOptions.toFullscreen) {
		end = fullscreen;
	}

	return {
		start,
		end,
		entering,
	};
}

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

	const relativeGeometry = computeRelativeGeometry({ start, end, entering });

	const interp = (a: number, b: number) =>
		interpolate(progress, relativeGeometry.ranges, [a, b]);

	const common: ElementComposeParams = {
		start,
		end,
		interp,
		geometry: relativeGeometry,
		computeOptions,
	};

	const isSize = computeOptions.method === "size";
	const isAbs = !!computeOptions.absolute;

	if (computeOptions.method === "content") {
		const contentGeometry = computeContentTransformGeometry({
			start,
			end,
			entering,
			dimensions,
			contentScaleMode: computeOptions.contentScaleMode ?? "auto",
		});

		return composeContentStyle({
			...common,
			geometry: contentGeometry,
			computeOptions,
		});
	}

	return isSize
		? isAbs
			? composeSizeAbsolute(common)
			: composeSizeRelative(common)
		: isAbs
			? composeTransformAbsolute(common)
			: composeTransformRelative(common);
};

export function buildBoundStyles(
	params: BoundsBuilderInitParams,
): BoundsBuilder {
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
}
