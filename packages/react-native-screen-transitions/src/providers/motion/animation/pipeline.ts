import { useMemo } from "react";
import { ScrollStore } from "../../../stores/scroll.store";
import { useBuilderStore } from "../../builder";
import type { MotionValues } from "../types";
import { buildScreenTransitionOptions } from "./helpers/build-screen-transition-options";
import type { MotionAnimationState } from "./helpers/hydrate-transition-state/types";
import { toPlainRoute, toPlainValue } from "./helpers/worklet";

export function useMotionAnimationPipeline(
	values: MotionValues,
): MotionAnimationState {
	const descriptor = useBuilderStore((store) => store.descriptors.current);
	const route = descriptor.route;
	const { meta, snapPoints } = descriptor.options;
	const key = route.key;

	const {
		gestureEnabled,
		gestureTracking,
		gestureDirection,
		gestureSensitivity,
		gestureVelocityImpact,
		gestureSnapVelocityImpact,
		gestureReleaseVelocityScale,
		gestureSnapLocked,
		sheetSnapBehavior,
		sheetScrollGestureBehavior,
		backdropBehavior,
	} = descriptor.options;

	const transitionOptions = useMemo(
		() =>
			buildScreenTransitionOptions({
				gestureEnabled,
				gestureTracking,
				gestureDirection,
				gestureSensitivity,
				gestureVelocityImpact,
				gestureSnapVelocityImpact,
				gestureReleaseVelocityScale,
				gestureSnapLocked,
				sheetSnapBehavior,
				sheetScrollGestureBehavior,
				backdropBehavior,
			}),
		[
			gestureEnabled,
			gestureTracking,
			gestureDirection,
			gestureSensitivity,
			gestureVelocityImpact,
			gestureSnapVelocityImpact,
			gestureReleaseVelocityScale,
			gestureSnapLocked,
			sheetSnapBehavior,
			sheetScrollGestureBehavior,
			backdropBehavior,
		],
	);

	return useMemo(() => {
		const plainRoute = toPlainRoute(route);
		const plainMeta = meta
			? (toPlainValue(meta) as Record<string, unknown>)
			: undefined;

		const sortedNumericSnapPoints = (snapPoints ?? [])
			.filter((p): p is number => typeof p === "number")
			.sort((a, b) => a - b);

		return {
			...values,
			scrollMetadata: ScrollStore.getValue(key, "metadata"),
			hasAutoSnapPoint:
				snapPoints?.some((point) => typeof point === "string") ?? false,
			sortedNumericSnapPoints,
			route: plainRoute,
			meta: plainMeta,
			options: transitionOptions,
		};
	}, [key, meta, route, snapPoints, transitionOptions, values]);
}
