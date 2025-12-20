import { interpolate } from "react-native-reanimated";
import type {
	ScreenInterpolationProps,
	TransitionInterpolatedStyle,
	TransitionSpec,
} from "react-native-screen-transitions";

/**
 * Spring configuration for smooth animations
 */
export const transitionSpec: TransitionSpec = {
	open: {
		stiffness: 300,
		damping: 30,
		mass: 1,
	},
	close: {
		stiffness: 300,
		damping: 30,
		mass: 1,
	},
};

/**
 * Screen style interpolator for floating → fullscreen animation
 *
 * Uses bounds API to animate:
 * - FLOATING_ELEMENT: shared element that morphs between screens
 * - BOUNDS_INDICATOR: green border showing active viewing area
 */
export function floatingInterpolator(
	props: ScreenInterpolationProps,
): TransitionInterpolatedStyle {
	"worklet";

	const { bounds } = props;

	// Use bounds API for shared element transition
	// This will morph FLOATING_ELEMENT from source to destination
	console.log(bounds.getLink("FLOATING_ELEMENT"));
	const elementStyles = bounds({
		id: "FLOATING_ELEMENT",
		method: "size",
		space: "absolute",
	});

	return {
		BOUNDS_INDICATOR: elementStyles,
	};
}
