import { useMemo } from "react";
import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import { AnimationStore } from "../../../stores/animation.store";
import { SystemStore } from "../../../stores/system.store";
import type { BlankStackStoreValue } from "../../../types/providers/blank-stack-provider.types";
import { useBlankStackStore } from "../blank-stack.provider";
import { useStackTransitionStore } from "./stack-transition.provider";
import {
	normalizeStackTransitionProgress,
	resolveStackTransitionDismissalBoundary,
	type StackTransitionDirection,
} from "./stack-transition-controller";

export type StackTransition = {
	direction: StackTransitionDirection;
	driver: BlankStackStoreValue["scenes"][number];
	progress: DerivedValue<number>;
	source: BlankStackStoreValue["scenes"][number];
	target: BlankStackStoreValue["scenes"][number];
};

export const useStackTransition = (): StackTransition | null => {
	const selection = useStackTransitionStore((store) => store.selection);
	const scenesByKey = useBlankStackStore((store) => store.scenesByKey);
	const driverProgress = useMemo(
		() =>
			selection
				? AnimationStore.getValue(selection.driverRouteKey, "visualProgress")
				: null,
		[selection],
	);
	const resolvedAutoSnapPoint = useMemo(
		() =>
			selection
				? SystemStore.getValue(
						selection.driverRouteKey,
						"resolvedAutoSnapPoint",
					)
				: null,
		[selection],
	);
	const driverSnapPoints = selection
		? scenesByKey[selection.driverRouteKey]?.descriptor.options.snapPoints
		: undefined;
	const direction = selection?.direction ?? "forward";
	const progress = useDerivedValue(() => {
		if (!driverProgress) return 0;
		const dismissalBoundary = resolveStackTransitionDismissalBoundary({
			progressBaseline: 1,
			resolvedAutoSnapPoint: resolvedAutoSnapPoint?.get() ?? -1,
			snapPoints: driverSnapPoints,
		});

		return normalizeStackTransitionProgress(
			direction,
			driverProgress.get(),
			dismissalBoundary,
		);
	}, [direction, driverProgress, driverSnapPoints, resolvedAutoSnapPoint]);

	return useMemo(() => {
		if (!selection) return null;

		const source = scenesByKey[selection.sourceRouteKey];
		const target = scenesByKey[selection.targetRouteKey];
		const driver = scenesByKey[selection.driverRouteKey];
		if (!source || !target || !driver) return null;

		return {
			direction: selection.direction,
			driver,
			progress,
			source,
			target,
		};
	}, [progress, scenesByKey, selection]);
};
