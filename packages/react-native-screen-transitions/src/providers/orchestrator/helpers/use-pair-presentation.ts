import { useDerivedValue } from "react-native-reanimated";
import { NO_STYLES } from "../../../constants";
import { pairs } from "../../../stores/bounds/internals/state";
import type {
	NormalizedTransitionInterpolatedStyle,
	ScreenStyleInterpolator,
} from "../../../types/animation.types";
import { useBuilderStore } from "../../builder";
import { useMotionStore } from "../../motion";
import { createInterpolatorScope } from "../styles/helpers/create-interpolator-scope";
import { normalizeSlots } from "../styles/helpers/normalize-slots";
import { selectInterpolatorFrame } from "../styles/helpers/select-interpolator-frame";
import { stripInterpolatorOptions } from "../styles/helpers/strip-interpolator-options";
import { updateDerivations } from "./derivations";
import type {
	ScreenAnimationPipeline,
	ScreenInterpolatorFrame,
} from "./pipeline";

export type BoundaryPairPresentation = {
	pairKey: string;
	sourceKey: string;
	destinationKey: string;
	ready: boolean;
	source: NormalizedTransitionInterpolatedStyle;
	destination: NormalizedTransitionInterpolatedStyle;
};

export function boundarySourceFrame(
	frame: ScreenInterpolatorFrame,
): ScreenInterpolatorFrame | undefined {
	"worklet";
	if (!frame.previous) return undefined;
	const source = {
		...frame,
		previous: undefined,
		current: frame.previous,
		next: frame.current,
		layouts: frame.previous.layouts,
	};
	updateDerivations(source);
	return source;
}

export function runBoundaryInterpolator(
	interpolator: ScreenStyleInterpolator,
	frame: ScreenInterpolatorFrame,
	side: "source" | "destination",
) {
	"worklet";
	const raw = interpolator(
		createInterpolatorScope({
			frame,
			selectedFrame: selectInterpolatorFrame(frame, side === "destination"),
		}),
	);
	return raw && typeof raw === "object"
		? normalizeSlots(stripInterpolatorOptions(raw))
		: NO_STYLES;
}

// Each destination owns the output of its incoming pair, even when its source
// has moved on to another route. All boundaries read this same UI value.
export function usePairPresentation({
	screenInterpolatorProps,
	currentInterpolator,
}: ScreenAnimationPipeline) {
	const pairKey = useBuilderStore((s) => s.derivations.destinationPairKey);
	const ready = useMotionStore((s) => s.isScreenReady);
	return useDerivedValue(() => {
		const links = pairKey ? pairs.get()[pairKey]?.links : undefined;
		if (!pairKey || !links || !currentInterpolator) return undefined;
		let hasPortal = false;
		for (const key in links) {
			const { source, destination } = links[key];
			if (
				source?.handoff ||
				source?.escapeClipping ||
				destination?.handoff ||
				destination?.escapeClipping
			) {
				hasPortal = true;
				break;
			}
		}
		if (!hasPortal) return undefined;
		const frame = screenInterpolatorProps.get();
		const source = boundarySourceFrame(frame);
		if (!source) return undefined;
		return {
			pairKey,
			sourceKey: source.current.route.key,
			destinationKey: frame.current.route.key,
			ready: ready.get(),
			source: runBoundaryInterpolator(currentInterpolator, source, "source"),
			destination: runBoundaryInterpolator(
				currentInterpolator,
				frame,
				"destination",
			),
		} satisfies BoundaryPairPresentation;
	});
}
