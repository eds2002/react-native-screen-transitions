import type {
	ScreenAnimationDescendantSources,
	ScreenAnimationSource,
	ScreenInterpolatorPropsRevision,
} from "../types";

export const readScreenAnimationRevisions = (
	screenInterpolatorPropsRevision: ScreenInterpolatorPropsRevision,
	ancestorScreenAnimationSources: ScreenAnimationSource[],
	descendantScreenAnimationSources: ScreenAnimationDescendantSources,
) => {
	"worklet";
	screenInterpolatorPropsRevision.get();

	for (let index = 0; index < ancestorScreenAnimationSources.length; index++) {
		ancestorScreenAnimationSources[
			index
		]?.screenInterpolatorPropsRevision.get();
	}

	const descendantSources = descendantScreenAnimationSources.get();
	for (let index = 0; index < descendantSources.length; index++) {
		descendantSources[index]?.source.screenInterpolatorPropsRevision.get();
	}
};
