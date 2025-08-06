import type { ScaledSize } from "react-native";
import { interpolate, type MeasuredDimensions } from "react-native-reanimated";
import type { ScreenTransitionState } from "src/types/animation";
import type { BoundsBuilder } from "src/types/bounds";
import type {
	BoundsBuilderComputeParams,
	BoundsBuilderOptions,
} from "./_types/builder";
import { FULLSCREEN_DIMENSIONS } from "./constants";
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

type Phase = "previous" | "current" | "next";

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

	const startPhase: Phase = entering ? "previous" : "current";
	const endPhase: Phase = entering ? "current" : "next";

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
	}: BoundsBuilderComputeParams,
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

	const common = {
		start,
		end,
		interp,
		geometry: relativeGeometry,
		computeOptions,
	} satisfies ElementComposeParams;

	const isSize = method === "size";
	const isAbs = !!computeOptions.absolute;

	if (method === "content") {
		const contentGeometry = computeContentTransformGeometry({
			start,
			end,
			entering,
			dimensions,
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
	params: Omit<BoundsBuilderComputeParams, "method">,
): BoundsBuilder {
	"worklet";

	const DEFAULT_OPTIONS: BoundsBuilderOptions = {
		withGestures: { x: 0, y: 0 },
		toFullscreen: false,
		absolute: false,
		relative: true,
	};

	const cfg = {
		options: DEFAULT_OPTIONS,
	};

	const builder = (): BoundsBuilder => ({
		withGestures: (options) => {
			cfg.options.withGestures = options;
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
		toContentStyle: () => {
			return computeBoundStyles({ ...params, method: "content" }, cfg.options);
		},
	});

	return builder();
}
