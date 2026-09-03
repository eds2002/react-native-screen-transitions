import type { SmoothClipPresentation } from "react-native-smooth-clip-view";
import type { BuiltInClipPlanSlot } from "./native-plan";

export type BuiltInClipRuntimePlanId = "zoom" | "reveal";
export type BuiltInClipRuntimeBlocker =
	| "rotation"
	| "nonuniform-scale"
	| "matrix";

export type BuiltInClipRuntimeMarker = Readonly<{
	activeBlockers: readonly BuiltInClipRuntimeBlocker[];
	endpoints?: Readonly<Partial<Record<"0" | "1", SmoothClipPresentation>>>;
	planId: BuiltInClipRuntimePlanId;
	slotId: BuiltInClipPlanSlot;
}>;

const RUNTIME_MARKER_KEY = "__screenTransitionBuiltInClipPlan";

type MarkedPresentation = SmoothClipPresentation & {
	[RUNTIME_MARKER_KEY]?: BuiltInClipRuntimeMarker;
};

/** Explicit internal provenance attached only by the built-in projectors. */
export const markBuiltInClipPresentation = (
	presentation: SmoothClipPresentation,
	marker: BuiltInClipRuntimeMarker,
): SmoothClipPresentation => {
	"worklet";
	return {
		...presentation,
		[RUNTIME_MARKER_KEY]: marker,
	} as MarkedPresentation;
};

export const getBuiltInClipRuntimeMarker = (
	presentation: SmoothClipPresentation | null | undefined,
): BuiltInClipRuntimeMarker | null => {
	"worklet";
	if (presentation === null || presentation === undefined) return null;
	const marker = (presentation as MarkedPresentation)[RUNTIME_MARKER_KEY];
	if (
		marker === undefined ||
		(marker.planId !== "zoom" && marker.planId !== "reveal") ||
		marker.slotId.length === 0 ||
		!Array.isArray(marker.activeBlockers)
	) {
		return null;
	}
	return marker;
};
