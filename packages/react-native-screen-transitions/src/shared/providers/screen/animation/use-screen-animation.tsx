import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import type {
	ScreenInterpolationProps,
	ScreenTransitionTarget,
} from "../../../types/animation.types";
import { useScreenAnimationContext } from "./animation.provider";
import { useBuildTransitionAccessor } from "./helpers/accessors/use-build-transition-accessor";
import type {
	ScreenAnimationLegacyTarget,
	ScreenAnimationTarget,
} from "./types";

export type { ScreenAnimationTarget } from "./types";

export function useScreenAnimation(): DerivedValue<ScreenInterpolationProps>;
export function useScreenAnimation(target: {
	depth: 0;
}): DerivedValue<ScreenInterpolationProps>;
/** @deprecated Use `{ depth: 0 }`. */
export function useScreenAnimation(
	target: "self",
): DerivedValue<ScreenInterpolationProps>;
export function useScreenAnimation(
	target: ScreenTransitionTarget,
): DerivedValue<ScreenInterpolationProps | null>;
/** @deprecated Use `{ depth }`. */
export function useScreenAnimation(
	target: Exclude<ScreenAnimationLegacyTarget, "self">,
): DerivedValue<ScreenInterpolationProps | null>;
export function useScreenAnimation(
	target?: ScreenAnimationTarget,
):
	| DerivedValue<ScreenInterpolationProps>
	| DerivedValue<ScreenInterpolationProps | null> {
	const { ancestorScreenAnimationSources } = useScreenAnimationContext();
	const transition = useBuildTransitionAccessor();
	const transitionTarget = normalizeScreenAnimationTarget(
		target,
		ancestorScreenAnimationSources.length,
	);

	const animation = useDerivedValue<ScreenInterpolationProps | null>(() => {
		"worklet";
		return transition(transitionTarget);
	});

	return animation;
}

const isTransitionTarget = (
	target: ScreenAnimationTarget,
): target is ScreenTransitionTarget => {
	return typeof target === "object" && target !== null && "depth" in target;
};

const normalizeScreenAnimationTarget = (
	target: ScreenAnimationTarget | undefined,
	ancestorCount: number,
): ScreenTransitionTarget | undefined => {
	if (target === undefined || isTransitionTarget(target)) {
		return target;
	}

	if (target === "self") {
		return { depth: 0 };
	}

	if (target === "parent") {
		return { depth: -1 };
	}

	if (target === "root") {
		return { depth: ancestorCount > 0 ? -ancestorCount : -1 };
	}

	if (!Number.isInteger(target.ancestor) || target.ancestor < 1) {
		return { depth: Number.NaN };
	}

	return { depth: -target.ancestor };
};
