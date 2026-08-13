import type { SharedValue } from "react-native-reanimated";
import type { ScreenAnimationTransitionSource } from "../types";

type ScreenInterpolatorExternalDeps = Pick<SharedValue<unknown>, "get">[];

export const readScreenAnimationRevisions = (
	sources: readonly ScreenAnimationTransitionSource[],
	externalRevisions: ScreenInterpolatorExternalDeps = [],
) => {
	"worklet";
	for (const source of sources) {
		source.screenInterpolatorPropsRevision.get();
	}
	for (const revision of externalRevisions) revision.get();
};
