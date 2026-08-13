import { useRoute } from "@react-navigation/native";
import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import type {
	ScreenInterpolationProps,
	ScreenTransitionTarget,
} from "../../../types/animation.types";
import { useOptionalScreenAnimationStore } from "./animation.provider";
import { useBuildTransitionAccessor } from "./helpers/accessors/use-build-transition-accessor";
import { readScreenAnimationRevisions } from "./helpers/read-screen-animation-revisions";
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
	const route = useRoute();
	const localAnimationStore = useOptionalScreenAnimationStore();
	const keyedAnimationStore = useOptionalScreenAnimationStore(
		localAnimationStore ? null : route.key,
	);
	const screenAnimationStore = localAnimationStore ?? keyedAnimationStore;

	if (!screenAnimationStore) {
		throw new Error(
			`ScreenAnimationStore is unavailable for route "${route.key}"`,
		);
	}

	const { transitionSources, transitionOriginIndex } = screenAnimationStore;
	const transition = useBuildTransitionAccessor(screenAnimationStore);
	const transitionTarget = normalizeScreenAnimationTarget(
		target,
		transitionOriginIndex,
	);

	const animation = useDerivedValue<ScreenInterpolationProps | null>(() => {
		"worklet";
		readScreenAnimationRevisions(transitionSources);
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
