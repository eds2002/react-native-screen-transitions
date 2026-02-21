import type { BoundsOptions } from "../types/options";

export const DEFAULT_BOUNDS_OPTIONS = {
	target: "bound",
	method: "transform",
	space: "relative",
	scaleMode: "match",
	anchor: "center",
	raw: false,
} as const satisfies Omit<BoundsOptions, "id" | "group" | "gestures">;
