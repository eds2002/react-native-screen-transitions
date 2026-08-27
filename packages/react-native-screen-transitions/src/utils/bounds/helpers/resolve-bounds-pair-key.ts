import { createScreenPairKey } from "../../../stores/bounds/helpers/link-pairs.helpers";
import type { ScreenPairKey } from "../../../stores/bounds/types";
import type { BoundsInterpolationProps } from "../../../types/bounds.types";

export const resolveBoundsPairKey = (
	props: BoundsInterpolationProps,
): ScreenPairKey | null => {
	"worklet";
	const currentScreenKey = props.current?.route.key;
	const previousScreenKey = props.previous?.route.key;
	const nextScreenKey = props.next?.route.key;

	if (nextScreenKey && currentScreenKey) {
		return createScreenPairKey(currentScreenKey, nextScreenKey);
	}

	if (previousScreenKey && currentScreenKey) {
		return createScreenPairKey(previousScreenKey, currentScreenKey);
	}

	return null;
};
