import type { BoundsInternalOptions } from "./types/options";

export const DEFAULT_BOUNDS_OPTIONS = {
	target: "bound",
	method: "transform",
	space: "relative",
	scaleMode: "match",
	anchor: "center",
	raw: false,
} as const satisfies Omit<BoundsInternalOptions, "id" | "group" | "gestures">;
