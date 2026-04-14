import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import type { ScreenInterpolationProps } from "../../../types/animation.types";
import { useScreenAnimationContext } from "./animation.provider";
import { resolveScreenAnimationTarget } from "./helpers/resolve-screen-animation-target";
import type { ScreenAnimationSource, ScreenAnimationTarget } from "./types";

export type { ScreenAnimationTarget } from "./types";

export function useScreenAnimation(
	target?: ScreenAnimationTarget,
): DerivedValue<ScreenInterpolationProps> {
	const {
		screenInterpolatorProps,
		boundsAccessor,
		ancestorScreenAnimationSources,
	} = useScreenAnimationContext();

	const source = resolveScreenAnimationTarget<ScreenAnimationSource>({
		target,
		self: {
			screenInterpolatorProps,
			boundsAccessor,
		},
		ancestors: ancestorScreenAnimationSources,
	});

	return useDerivedValue<ScreenInterpolationProps>(() => {
		"worklet";

		const props = source.screenInterpolatorProps.get();

		return {
			...props,
			bounds: source.boundsAccessor,
		};
	});
}
