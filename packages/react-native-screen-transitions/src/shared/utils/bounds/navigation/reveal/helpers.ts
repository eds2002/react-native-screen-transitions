import type { BoundsLink } from "../../../../types/bounds.types";

export function getSourceBorderRadius(link: BoundsLink): number {
	"worklet";

	return typeof link.source?.styles.borderRadius === "number"
		? link.source.styles.borderRadius
		: 0;
}
