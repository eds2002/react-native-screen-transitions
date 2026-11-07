import type { ScreenPairKey, TagID } from "../../../stores/bounds";
import { resolveScreenPairKey } from "../../../stores/bounds";
import type { BoundsInterpolationProps } from "../../../types/bounds.types";

/** The pair `tag` belongs to in this frame, wherever its source sits in the route tree. */
export const resolveBoundsPairKey = (
	props: BoundsInterpolationProps,
	tag: TagID,
): ScreenPairKey | null => {
	"worklet";
	return resolveScreenPairKey(tag, {
		currentScreenKey: props.current?.route.key,
		previousScreenKey: props.previous?.route.key,
		nextScreenKey: props.next?.route.key,
	});
};
