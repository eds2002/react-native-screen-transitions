import { useMemo } from "react";
import type {
	ScreenInterpolationProps,
	ScreenTransitionTarget,
} from "../../../../../types/animation.types";
import { createBoundsAccessor } from "../../../../../utils/bounds";
import { useScreenAnimationContext } from "../../animation.provider";
import type {
	ScreenAnimationDescendantSources,
	ScreenAnimationSource,
	ScreenAnimationTransitionSource,
} from "../../types";

type TransitionSourceIndex = number;

export type TransitionAccessorSource = ScreenAnimationTransitionSource;

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
	descendantSources?: ScreenAnimationDescendantSources,
) => {
	"worklet";

	const getSources = (): TransitionAccessorSource[] => {
		"worklet";
		if (!descendantSources) {
			return [...sources];
		}

		const descendants = descendantSources.get();
		if (descendants.length === 0) {
			return [...sources];
		}

		return [...sources, ...descendants.map(({ source }) => source)];
	};

	const buildScope = (
		sourceIndex: TransitionSourceIndex,
	): ScreenInterpolationProps | null => {
		"worklet";
		const currentSources = getSources();
		const source = currentSources[sourceIndex];
		if (!source) return null;

		source.screenInterpolatorPropsRevision.get();
		const frame = source.screenInterpolatorProps.get();

		return {
			...frame,
			bounds: source.boundsAccessor,
		};
	};

	return (target?: ScreenTransitionTarget): ScreenInterpolationProps | null => {
		"worklet";
		const currentSources = getSources();
		const targetIndex = resolveTargetIndex(
			target,
			originIndex,
			currentSources.length,
		);
		if (targetIndex === -1) {
			return null;
		}

		return buildScope(targetIndex);
	};
};

const buildSourceBoundsAccessor = (source: ScreenAnimationSource) => {
	"worklet";
	return createBoundsAccessor(() => {
		"worklet";
		return source.screenInterpolatorProps.get();
	});
};

export const useBuildTransitionAccessor = () => {
	const {
		screenInterpolatorProps,
		screenInterpolatorPropsRevision,
		ancestorScreenAnimationSources,
		descendantScreenAnimationSources,
	} = useScreenAnimationContext();

	return useMemo(() => {
		const selfSource = {
			screenInterpolatorProps,
			screenInterpolatorPropsRevision,
		};

		const ancestorTransitionSources = ancestorScreenAnimationSources.map(
			(source) => ({
				...source,
				boundsAccessor: buildSourceBoundsAccessor(source),
			}),
		);

		const selfTransitionSource = {
			...selfSource,
			boundsAccessor: buildSourceBoundsAccessor(selfSource),
		};

		const transitionSources: TransitionAccessorSource[] = [
			...[...ancestorTransitionSources].reverse(),
			selfTransitionSource,
		];

		return createTransitionAccessor(
			transitionSources,
			ancestorTransitionSources.length,
			descendantScreenAnimationSources,
		);
	}, [
		screenInterpolatorProps,
		screenInterpolatorPropsRevision,
		ancestorScreenAnimationSources,
		descendantScreenAnimationSources,
	]);
};
