import { type ReactNode, useMemo } from "react";
import { createBoundsAccessor } from "../../../utils/bounds";
import createProvider from "../../../utils/create-provider";
import { useBlankStackStore } from "../../stack/blank-stack.provider";
import { useDescriptorsStore } from "../descriptors";
import { useCurrentScreenRelationships } from "../use-current-screen-relationships";
import { useScreenAnimationPipeline } from "./helpers/pipeline";
import type { ScreenAnimationTransitionSource } from "./types";

type Props = {
	children: ReactNode;
};

export type ScreenAnimationContextValue = ReturnType<
	typeof useScreenAnimationPipeline
> & {
	transitionSources: readonly ScreenAnimationTransitionSource[];
	transitionOriginIndex: number;
	transitionSourcesThroughSelf: readonly ScreenAnimationTransitionSource[];
	transitionSourcesFromSelf: readonly ScreenAnimationTransitionSource[];
};

const EMPTY_TRANSITION_SOURCES: readonly ScreenAnimationTransitionSource[] = [];

const createScreenAnimationProvider = createProvider("ScreenAnimation", {
	global: true,
})<Props, ScreenAnimationContextValue>;

export const {
	StoreProvider: ScreenAnimationStoreProvider,
	ScreenAnimationProvider,
	useOptionalScreenAnimationStore,
	useScreenAnimationStore,
}: ReturnType<
	typeof createScreenAnimationProvider
> = createScreenAnimationProvider((_props) => {
	const currentScreenKey = useDescriptorsStore(
		(store) => store.derivations.currentScreenKey,
	);
	const isClosing = useBlankStackStore(
		(store) => store.scenesByKey[currentScreenKey]?.activity === "closing",
	);
	const relationships = useCurrentScreenRelationships();
	const pipeline = useScreenAnimationPipeline();

	const screenAnimationSource = useMemo<ScreenAnimationTransitionSource>(
		() => ({
			screenInterpolatorProps: pipeline.screenInterpolatorProps,
			screenInterpolatorPropsRevision: pipeline.screenInterpolatorPropsRevision,
			boundsAccessor: createBoundsAccessor(() => {
				"worklet";
				return pipeline.screenInterpolatorProps.get();
			}),
		}),
		[
			pipeline.screenInterpolatorProps,
			pipeline.screenInterpolatorPropsRevision,
		],
	);
	const ancestorSources =
		useOptionalScreenAnimationStore(
			relationships.parentScreenKey,
			(store) => store.transitionSourcesThroughSelf,
		) ?? EMPTY_TRANSITION_SOURCES;
	const descendantSources =
		useOptionalScreenAnimationStore(
			relationships.activeChildScreenKey,
			(store) => store.transitionSourcesFromSelf,
		) ?? EMPTY_TRANSITION_SOURCES;
	const transitionSourcesThroughSelf = useMemo(
		() => [...ancestorSources, screenAnimationSource],
		[ancestorSources, screenAnimationSource],
	);
	const transitionSourcesFromSelf = useMemo(
		() => [screenAnimationSource, ...descendantSources],
		[screenAnimationSource, descendantSources],
	);
	const transitionSources = useMemo(
		() => [...transitionSourcesThroughSelf, ...descendantSources],
		[transitionSourcesThroughSelf, descendantSources],
	);

	return {
		key: currentScreenKey,
		unregisterOnCleanup: isClosing,
		value: {
			...pipeline,
			transitionSources,
			transitionOriginIndex: ancestorSources.length,
			transitionSourcesThroughSelf,
			transitionSourcesFromSelf,
		},
	};
});
