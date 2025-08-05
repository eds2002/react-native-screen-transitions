import type { MeasuredDimensions } from "react-native-reanimated";
import type { ScreenTransitionState } from "src/types/animation";
import type { BoundStyleOptions, Geometry } from "./_types";

export function computeGeometry(
	{
		start,
		end,
		entering,
	}: { start: MeasuredDimensions; end: MeasuredDimensions; entering: boolean },
	current: ScreenTransitionState,
	next: ScreenTransitionState | undefined,
	computeOptions: BoundStyleOptions,
): Geometry {
	"worklet";
	const startCenterX = start.pageX + start.width / 2;
	const startCenterY = start.pageY + start.height / 2;
	const endCenterX = end.pageX + end.width / 2;
	const endCenterY = end.pageY + end.height / 2;

	const dx = startCenterX - endCenterX;
	const dy = startCenterY - endCenterY;

	const scaleX = start.width / end.width;
	const scaleY = start.height / end.height;

	//For defining withGestures on the unfocus route, we'll want to use next instead. Next will be undefined for focus anyways.
	const gestureX = computeOptions.withGestures
		? next
			? next.gesture.x
			: current.gesture.x
		: 0;
	const gestureY = computeOptions.withGestures
		? next
			? next.gesture.y
			: current.gesture.y
		: 0;

	const ranges: readonly [number, number] = entering ? [0, 1] : [1, 2];

	return { dx, dy, scaleX, scaleY, gestureX, gestureY, ranges, entering };
}
