import { useMemo } from "react";
import { AnimationStore } from "../../../../stores/animation.store";
import { GestureStore } from "../../../../stores/gesture.store";
import { ScrollStore } from "../../../../stores/scroll.store";
import { useBuilderStore } from "../../builder";
import { buildScreenTransitionOptions } from "./helpers/build-screen-transition-options";
import type { MotionAnimationState } from "./helpers/hydrate-transition-state/types";
import { toPlainRoute, toPlainValue } from "./helpers/worklet";

export function useMotionAnimationPipeline(): MotionAnimationState {
	const descriptor = useBuilderStore((store) => store.descriptors.current);
	const system = useBuilderStore((store) => store.animationState);
	const route = descriptor.route;
	const key = route.key;
	const meta = descriptor.options.meta;
	const snapPoints = descriptor.options.snapPoints;
	const animations = AnimationStore.getBag(key);
	return useMemo(() => {
		const plainRoute = toPlainRoute(route);
		const plainMeta = meta
			? (toPlainValue(meta) as Record<string, unknown>)
			: undefined;

		const sortedNumericSnapPoints = (snapPoints ?? [])
			.filter((p): p is number => typeof p === "number")
			.sort((a, b) => a - b);

		const transitionOptions = buildScreenTransitionOptions(descriptor.options);

		return {
			transitionProgress: animations.transitionProgress,
			visualProgress: animations.visualProgress,
			willAnimate: animations.willAnimate,
			closing: animations.closing,
			entering: animations.entering,
			progressAnimating: animations.progressAnimating,
			progressSettled: animations.progressSettled,
			targetProgress: system.targetProgress,
			resolvedAutoSnapPoint: system.resolvedAutoSnapPoint,
			measuredContentLayout: system.measuredContentLayout,
			scrollMetadata: ScrollStore.getValue(key, "metadata"),
			hasAutoSnapPoint: snapPoints?.includes("auto") ?? false,
			sortedNumericSnapPoints,
			gesture: GestureStore.getBag(key),
			route: plainRoute,
			meta: plainMeta,
			options: transitionOptions,
		};
	}, [key, meta, route, snapPoints, descriptor.options, system, animations]);
}
