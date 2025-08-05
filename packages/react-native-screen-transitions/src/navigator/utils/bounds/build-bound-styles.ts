import type { ScaledSize } from "react-native";
import { interpolate, type MeasuredDimensions } from "react-native-reanimated";
import type { ScreenTransitionState } from "src/types/animation";
import type { BoundsBuilder } from "src/types/bounds";
import type { BoundStyleOptions, BoundsStyleComputeParams } from "./_types";
import { FULLSCREEN_DIMENSIONS } from "./constants";
import { computeGeometry } from "./geometry";
import {
	composeSizeAbsolute,
	composeSizeRelative,
	composeTransformAbsolute,
	composeTransformRelative,
} from "./style-composers";

type Phase = "previous" | "current" | "next";

function resolveBounds(props: {
	id: string;
	previous?: ScreenTransitionState;
	current?: ScreenTransitionState;
	next?: ScreenTransitionState;
	toRect?: Partial<MeasuredDimensions>;
	dimensions: ScaledSize;
	computeOptions: BoundStyleOptions;
}) {
	"worklet";
	const entering = !props.next;

	const fullscreen = FULLSCREEN_DIMENSIONS(props.dimensions);

	const startPhase: Phase = entering ? "previous" : "current";
	const endPhase: Phase = entering ? "current" : "previous";

	const resolve = (phase?: Phase) => {
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
		method,
	}: BoundsStyleComputeParams,
	computeOptions: BoundStyleOptions = {},
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

	const { ranges, ...geometry } = computeGeometry(
		{ start, end, entering },
		current,
		next,
		computeOptions,
	);

	const interp = (a: number, b: number) =>
		interpolate(progress, ranges, [a, b]);

	const common = {
		start,
		end,
		interp,
		...geometry,
	};

	const isSize = method === "size";
	const isAbs = !!computeOptions.absolute;

	return isSize
		? isAbs
			? composeSizeAbsolute(common)
			: composeSizeRelative(common)
		: isAbs
			? composeTransformAbsolute(common)
			: composeTransformRelative(common);
};

export function buildBoundStyles(
	params: Omit<BoundsStyleComputeParams, "method">,
): BoundsBuilder {
	"worklet";

	const DEFAULT_OPTIONS: BoundStyleOptions = {
		withGestures: false,
		toFullscreen: false,
		absolute: false,
		relative: true,
	};

	const cfg = {
		options: DEFAULT_OPTIONS,
	};

	const builder = (): BoundsBuilder => ({
		withGestures: () => {
			cfg.options.withGestures = true;
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
		toTransformStyle: () => {
			return computeBoundStyles(
				{ ...params, method: "transform" },
				cfg.options,
			);
		},
		toResizeStyle: () => {
			return computeBoundStyles({ ...params, method: "size" }, cfg.options);
		},
	});

	return builder();
}
