import { NO_STYLES } from "../../../../constants";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../types/animation.types";

export const preserveAnimatedPropsOnly = (
	stylesMap: NormalizedTransitionInterpolatedStyle,
): NormalizedTransitionInterpolatedStyle => {
	"worklet";
	let hasProps = false;
	const propsOnly: NormalizedTransitionInterpolatedStyle = {};

	for (const slotId in stylesMap) {
		const slot = stylesMap[slotId];
		if (!slot || slot.props === undefined) {
			continue;
		}

		propsOnly[slotId] = { props: slot.props };
		hasProps = true;
	}

	return hasProps ? propsOnly : NO_STYLES;
};
