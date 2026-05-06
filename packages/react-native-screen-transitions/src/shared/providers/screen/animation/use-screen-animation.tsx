import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import type { ScreenInterpolationProps } from "../../../types/animation.types";
import { resolveChainTarget } from "../../../utils/resolve-chain-target";
import { useScreenAnimationContext } from "./animation.provider";
import type { ScreenAnimationSource, ScreenAnimationTarget } from "./types";

export type { ScreenAnimationTarget } from "./types";

export function useScreenAnimation(): DerivedValue<ScreenInterpolationProps>;
export function useScreenAnimation(
	target: "self",
): DerivedValue<ScreenInterpolationProps>;
export function useScreenAnimation(
	target: Exclude<ScreenAnimationTarget, "self">,
): DerivedValue<ScreenInterpolationProps> | null;
export function useScreenAnimation(
	target?: ScreenAnimationTarget,
): DerivedValue<ScreenInterpolationProps> | null {
	const {
		screenInterpolatorProps,
		screenInterpolatorFrameUpdater,
		boundsAccessor,
		ancestorScreenAnimationSources,
	} = useScreenAnimationContext();

	const selfSource: ScreenAnimationSource = {
		screenInterpolatorProps,
		screenInterpolatorFrameUpdater,
		boundsAccessor,
	};

	const source = resolveChainTarget<ScreenAnimationSource>({
		target,
		self: selfSource,
		ancestors: ancestorScreenAnimationSources,
	});
	const resolvedSource = source ?? selfSource;

	const animation = useDerivedValue<ScreenInterpolationProps>(() => {
		"worklet";

		resolvedSource.screenInterpolatorFrameUpdater.get();
		const props = resolvedSource.screenInterpolatorProps.get();

		return {
			...props,
			bounds: resolvedSource.boundsAccessor,
		};
	});

	if (target && target !== "self" && !source) {
		return null;
	}

	return animation;
}
