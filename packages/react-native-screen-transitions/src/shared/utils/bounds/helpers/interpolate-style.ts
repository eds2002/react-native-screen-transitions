import { ENTER_RANGE, EXIT_RANGE } from "../../../constants";
import type { BoundsLink } from "../../../types/bounds.types";
import { interpolateClamped } from "./interpolate";

type InterpolateStyleOptions = {
	fallback?: number;
};

/**
 * Interpolates a numeric style property between source and destination bounds.
 *
 * @param link - The bounds link containing source and destination styles
 * @param property - The style property to interpolate (e.g., "borderRadius", "opacity")
 * @param progress - Animation progress value
 * @param entering - Whether the screen is entering (focused) or exiting (unfocused)
 * @param options - Optional configuration
 * @returns The interpolated value
 */
export function interpolateLinkStyle(
	link: BoundsLink | null,
	property: string,
	progress: number,
	entering: boolean,
	options: InterpolateStyleOptions = {},
): number {
	"worklet";

	const { fallback = 0 } = options;

	const sourceValue =
		(link?.source?.styles?.[property] as number | undefined) ?? fallback;
	const destValue =
		(link?.destination?.styles?.[property] as number | undefined) ?? fallback;

	const range = entering ? ENTER_RANGE : EXIT_RANGE;

	return interpolateClamped(progress, range, [sourceValue, destValue]);
}
