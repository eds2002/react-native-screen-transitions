import type { DerivedValue } from "react-native-reanimated";
import type { ScreenInterpolationProps } from "../../../types/animation.types";
import { useScreenAnimationContext } from "./animation.provider";
import { resolveScreenAnimationTarget } from "./helpers/resolve-screen-animation-target";
import type { ScreenAnimationTarget } from "./types";

export type { ScreenAnimationTarget } from "./types";

export function useScreenAnimation(
	target?: ScreenAnimationTarget,
): DerivedValue<ScreenInterpolationProps> {
	const { screenAnimation, ancestorScreenAnimations } =
		useScreenAnimationContext();
	return resolveScreenAnimationTarget({
		target,
		self: screenAnimation,
		ancestors: ancestorScreenAnimations,
	});
}
