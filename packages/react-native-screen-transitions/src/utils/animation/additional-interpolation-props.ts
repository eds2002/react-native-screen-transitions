import { interpolate as reInterpolate } from "react-native-reanimated";
import type {
	BaseScreenInterpolationProps,
	ScreenInterpolationProps,
} from "@/types";

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

	const activeTag = props.current?.bounds?.active || null;

	const createBoundsBuilder = (
		props: BaseScreenInterpolationProps,
		progress: number,
		activeTag: string | null,
	) => {
		"worklet";

		let startScreen: "previous" | "current" | "next" | null = null;
		let endScreen: "previous" | "current" | "next" | null = null;
		let gestureX = 0;
		let gestureY = 0;
		let isReverse = false;

		const builder = {
			start: (screen: "previous" | "current" | "next") => {
				"worklet";
				startScreen = screen;
				return builder;
			},
			end: (screen: "previous" | "current" | "next") => {
				"worklet";
				endScreen = screen;
				return builder;
			},
			isEntering: () => {
				"worklet";
				isReverse = false;
				return builder;
			},
			isExiting: () => {
				"worklet";
				isReverse = true;
				return builder;
			},
			x: (value: number) => {
				"worklet";
				gestureX = value;
				return builder;
			},
			y: (value: number) => {
				"worklet";
				gestureY = value;
				return builder;
			},
			build: () => {
				"worklet";
				if (!startScreen || !endScreen || !activeTag) return [];

				// Get bounds directly without helpers
				const start =
					startScreen === "previous"
						? props.previous?.bounds?.all?.[activeTag]?.value
						: startScreen === "current"
							? props.current?.bounds?.all?.[activeTag]?.value
							: props.next?.bounds?.all?.[activeTag]?.value;

				const end =
					endScreen === "previous"
						? props.previous?.bounds?.all?.[activeTag]?.value
						: endScreen === "current"
							? props.current?.bounds?.all?.[activeTag]?.value
							: props.next?.bounds?.all?.[activeTag]?.value;

				if (!start || !end) return [];

				// Calculate delta directly
				const dx = start.pageX - end.pageX + (start.width - end.width) / 2;
				const dy = start.pageY - end.pageY + (start.height - end.height) / 2;
				const scaleX = start.width / end.width;
				const scaleY = start.height / end.height;

				// Build transform based on direction
				if (isReverse) {
					return [
						{ translateX: gestureX },
						{ translateY: gestureY },
						{ translateX: reInterpolate(progress, [1, 2], [0, -dx]) },
						{ translateY: reInterpolate(progress, [1, 2], [0, -dy]) },
						{ scaleX: reInterpolate(progress, [1, 2], [1, 1 / scaleX]) },
						{ scaleY: reInterpolate(progress, [1, 2], [1, 1 / scaleY]) },
					];
				} else {
					return [
						{ translateX: gestureX },
						{ translateY: gestureY },
						{ translateX: reInterpolate(progress, [0, 1], [dx, 0]) },
						{ translateY: reInterpolate(progress, [0, 1], [dy, 0]) },
						{ scaleX: reInterpolate(progress, [0, 1], [scaleX, 1]) },
						{ scaleY: reInterpolate(progress, [0, 1], [scaleY, 1]) },
					];
				}
			},
		};

		return builder;
	};

	return {
		...props,
		isFocused,
		progress,
		interpolate,
		bounds: Object.assign(
			() => createBoundsBuilder(props, progress, activeTag),
			{ activeTag },
		),
	} satisfies ScreenInterpolationProps;
};
