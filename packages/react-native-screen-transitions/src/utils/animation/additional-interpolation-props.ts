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
		start: ExtendedMeasuredDimensions,
		end: ExtendedMeasuredDimensions,
		prog: number,
	) => {
		"worklet";
		const delta = calculateDelta(start, end);

		const translateX = reInterpolate(prog, [0, 1], [delta.dx, 0]);
		const translateY = reInterpolate(prog, [0, 1], [delta.dy, 0]);
		const scaleX = reInterpolate(prog, [0, 1], [delta.scaleX, 1]);
		const scaleY = reInterpolate(prog, [0, 1], [delta.scaleY, 1]);

		return { translateX, translateY, scaleX, scaleY };
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
			interpolateBounds,
		},
	};
};
