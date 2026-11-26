import { useMemo } from "react";
import { useBuilderStore } from "../../builder";
import type { MotionValues } from "../types";
import { buildScreenTransitionOptions } from "./helpers/build-screen-transition-options";
import type { MotionAnimationState } from "./helpers/hydrate-transition-state/types";
import { toPlainRoute, toPlainValue } from "./helpers/worklet";

export function useMotionAnimationPipeline(
	values: MotionValues,
	scrollMetadata: MotionAnimationState["scrollMetadata"],
): MotionAnimationState {
	const descriptor = useBuilderStore((store) => store.descriptors.current);
	const route = descriptor.route;
	const { meta, snapPoints } = descriptor.options;

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
			scrollMetadata,
			hasAutoSnapPoint:
				snapPoints?.some((point) => typeof point === "string") ?? false,
			sortedNumericSnapPoints,
			route: plainRoute,
			meta: plainMeta,
			options: transitionOptions,
		};
	}, [meta, route, scrollMetadata, snapPoints, transitionOptions, values]);
}
