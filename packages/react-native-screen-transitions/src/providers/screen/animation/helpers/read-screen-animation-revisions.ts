import type { SharedValue } from "react-native-reanimated";
import type {
	ScreenAnimationDescendantSources,
	ScreenAnimationSource,
	ScreenInterpolatorPropsRevision,
} from "../types";

type ScreenInterpolatorExternalDeps = Pick<SharedValue<unknown>, "get">[];

export const readScreenAnimationRevisions = (
	screenInterpolatorPropsRevision: ScreenInterpolatorPropsRevision,
	ancestorScreenAnimationSources: ScreenAnimationSource[],
	descendantScreenAnimationSources: ScreenAnimationDescendantSources,
	screenInterpolatorExternalDeps?: ScreenInterpolatorExternalDeps,
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

	if (screenInterpolatorExternalDeps) {
		for (
			let index = 0;
			index < screenInterpolatorExternalDeps.length;
			index++
		) {
			screenInterpolatorExternalDeps[index]?.get();
		}
	}
};
