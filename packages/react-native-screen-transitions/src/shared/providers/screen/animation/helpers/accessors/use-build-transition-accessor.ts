import { useMemo } from "react";
import type {
	ScreenInterpolationProps,
	ScreenTransitionTarget,
} from "../../../../../types/animation.types";
import type { ScreenAnimationContextValue } from "../../animation.provider";
import type { ScreenAnimationTransitionSource } from "../../types";

type TransitionSourceIndex = number;

export type TransitionAccessorSource = ScreenAnimationTransitionSource;

type TransitionAccessorStore = Pick<
	ScreenAnimationContextValue,
	"transitionSources" | "transitionOriginIndex"
>;

const resolveTargetIndex = (
	target: ScreenTransitionTarget | undefined,
	currentIndex: TransitionSourceIndex,
	sourceCount: number,
): TransitionSourceIndex => {
	"worklet";
	if (sourceCount <= 0) return -1;

	if (
		target !== undefined &&
		(typeof target !== "object" || target === null || !("depth" in target))
	) {
		return -1;
	}

	const depth = target?.depth ?? 0;
	if (!Number.isInteger(depth)) return -1;

	const resolvedIndex = currentIndex + depth;
	return resolvedIndex >= 0 && resolvedIndex < sourceCount ? resolvedIndex : -1;
};

export const createTransitionAccessor = (
	sources: readonly TransitionAccessorSource[],
	originIndex = 0,
) => {
	"worklet";

	const buildScope = (
		sourceIndex: TransitionSourceIndex,
		currentSources: readonly TransitionAccessorSource[],
	): ScreenInterpolationProps | null => {
		"worklet";
		const source = currentSources[sourceIndex];
		if (!source) return null;

		source.screenInterpolatorPropsRevision.get();
		const frame = source.screenInterpolatorProps.get();

		return {
			...frame,
			bounds: source.boundsAccessor,
			transition: (target?: ScreenTransitionTarget) => {
				"worklet";
				const targetIndex = resolveTargetIndex(
					target,
					sourceIndex,
					currentSources.length,
				);

				if (targetIndex === -1) {
					return null;
				}

				return buildScope(targetIndex, currentSources);
			},
		};
	};

	return (target?: ScreenTransitionTarget): ScreenInterpolationProps | null => {
		"worklet";
		const targetIndex = resolveTargetIndex(target, originIndex, sources.length);
		if (targetIndex === -1) {
			return null;
		}

		return buildScope(targetIndex, sources);
	};
};

export const useBuildTransitionAccessor = ({
	transitionSources,
	transitionOriginIndex,
}: TransitionAccessorStore) => {
	return useMemo(
		() => createTransitionAccessor(transitionSources, transitionOriginIndex),
		[transitionSources, transitionOriginIndex],
	);
};
