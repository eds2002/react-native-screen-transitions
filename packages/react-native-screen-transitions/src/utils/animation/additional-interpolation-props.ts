import { interpolate as reInterpolate } from "react-native-reanimated";
import type {
	BaseScreenInterpolationProps,
	ScreenInterpolationProps,
} from "@/types";
import type { ExtendedMeasuredDimensions } from "@/types/bounds";

export const additionalInterpolationProps = (
	props: BaseScreenInterpolationProps,
): ScreenInterpolationProps => {
	"worklet";
	const isFocused = props.current && !props.next;
	const progress =
		props.current.progress.value + (props.next?.progress.value ?? 0);
	const interpolate = (inputRange: number[], outputRange: number[]) => {
		"worklet";
		return reInterpolate(progress, inputRange, outputRange);
	};

	const getBounds = (
		tag: string,
		screen: "previous" | "current" | "next" = "current",
	): ExtendedMeasuredDimensions | undefined => {
		"worklet";
		switch (screen) {
			case "previous":
				return props.previous?.bounds?.all?.[tag]?.value;
			case "current":
				return props.current?.bounds?.all?.[tag]?.value;
			case "next":
				return props.next?.bounds?.all?.[tag]?.value;
			default:
				return undefined;
		}
	};

	const hasBounds = (
		tag: string,
		screen: "previous" | "current" | "next" = "current",
	): boolean => {
		"worklet";
		return !!getBounds(tag, screen);
	};

	const activeTag = props.current?.bounds?.active || null;

	const calculateDelta = (
		start: ExtendedMeasuredDimensions,
		end: ExtendedMeasuredDimensions,
	) => {
		"worklet";
		if (!start || !end) return { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

		const dx = start.pageX - end.pageX + (start.width - end.width) / 2;
		const dy = start.pageY - end.pageY + (start.height - end.height) / 2;
		const scaleX = start.width / end.width;
		const scaleY = start.height / end.height;

		return { dx, dy, scaleX, scaleY };
	};

	const interpolateBounds = (
		inputRange: number[],
		start: ExtendedMeasuredDimensions,
		end: ExtendedMeasuredDimensions,
		reverse: boolean = false,
	) => {
		"worklet";
		const delta = calculateDelta(start, end);

		if (reverse) {
			// For exit: we want to animate FROM the current state TO the target
			// But delta is calculated as "how to get from start to end"
			// So we need to NEGATE the delta to go in the opposite direction
			const translateX = reInterpolate(progress, inputRange, [0, -delta.dx]);
			const translateY = reInterpolate(progress, inputRange, [0, -delta.dy]);
			const scaleX = reInterpolate(progress, inputRange, [1, 1 / delta.scaleX]);
			const scaleY = reInterpolate(progress, inputRange, [1, 1 / delta.scaleY]);
			const transform = [
				{ translateX },
				{ translateY },
				{ scaleX },
				{ scaleY },
			];

			return { translateX, translateY, scaleX, scaleY, transform };
		} else {
			// For enter: animate FROM delta TO 0 (normal behavior)
			const translateX = reInterpolate(progress, inputRange, [delta.dx, 0]);
			const translateY = reInterpolate(progress, inputRange, [delta.dy, 0]);
			const scaleX = reInterpolate(progress, inputRange, [delta.scaleX, 1]);
			const scaleY = reInterpolate(progress, inputRange, [delta.scaleY, 1]);
			const transform = [
				{ translateX },
				{ translateY },
				{ scaleX },
				{ scaleY },
			];
			return { translateX, translateY, scaleX, scaleY, transform };
		}
	};

	return {
		...props,
		isFocused,
		progress,
		interpolate,
		bounds: {
			get: getBounds,
			has: hasBounds,
			activeTag,
			calculateDelta,
			interpolate: interpolateBounds,
		},
	};
};
