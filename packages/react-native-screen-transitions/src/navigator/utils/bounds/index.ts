import { Dimensions } from "react-native";
import { interpolate, type StyleProps } from "react-native-reanimated";
import type { ScreenTransitionState } from "src/types/animation";
import type { BoundEntry } from "src/types/bounds";

const SAFE_DIMENSIONS_FALLBACK = Object.freeze({
	bounds: {
		x: 0,
		y: 0,
		pageX: 0,
		pageY: 0,
		width: Dimensions.get("window").width,
		height: Dimensions.get("window").height,
	},
	styles: {},
} satisfies BoundEntry);

export const createBoundsBuilder = ({
	id,
	previous,
	current,
	next,
	progress,
	dimensions,
}: {
	id: string | null;
	previous?: ScreenTransitionState;
	current: ScreenTransitionState;
	next?: ScreenTransitionState;
	progress: number;
	dimensions: { width: number; height: number };
}) => {
	"worklet";

	let startScreen: "previous" | "current" | "next" | undefined;
	let endScreen: "previous" | "current" | "next" | undefined;
	let gestureX = 0;
	let gestureY = 0;
	let isReverse = false;

	const builder = {
		start: (screen?: "previous" | "current" | "next") => {
			"worklet";
			startScreen = screen;
			return builder;
		},
		end: (screen?: "previous" | "current" | "next") => {
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
			if (!id) return {};

			const resolveBound = (phase?: "previous" | "current" | "next") => {
				if (phase === "previous") return previous?.bounds?.[id]?.bounds;
				if (phase === "current") return current.bounds[id]?.bounds;
				if (phase === "next") return next?.bounds?.[id]?.bounds;

				return {
					x: 0,
					y: 0,
					pageX: 0,
					pageY: 0,
					width: dimensions.width,
					height: dimensions.height,
				};
			};

			const start = resolveBound(startScreen);
			const end = resolveBound(endScreen);

			if (!start || !end) return {};

			const dx = start.pageX - end.pageX + (start.width - end.width) / 2;
			const dy = start.pageY - end.pageY + (start.height - end.height) / 2;

			const scaleX = start.width / end.width;
			const scaleY = start.height / end.height;

			if (isReverse) {
				return {
					transform: [
						{ translateX: gestureX },
						{ translateY: gestureY },
						{ translateX: interpolate(progress, [1, 2], [0, -dx]) },
						{ translateY: interpolate(progress, [1, 2], [0, -dy]) },
						{ scaleX: interpolate(progress, [1, 2], [1, 1 / scaleX]) },
						{ scaleY: interpolate(progress, [1, 2], [1, 1 / scaleY]) },
					],
				} satisfies StyleProps;
			} else {
				return {
					transform: [
						{ translateX: gestureX },
						{ translateY: gestureY },
						{ translateX: interpolate(progress, [0, 1], [dx, 0]) },
						{ translateY: interpolate(progress, [0, 1], [dy, 0]) },
						{ scaleX: interpolate(progress, [0, 1], [scaleX, 1]) },
						{ scaleY: interpolate(progress, [0, 1], [scaleY, 1]) },
					],
				} satisfies StyleProps;
			}
		},
	};

	return builder;
};

export const getBound = (
	phase: "previous" | "current" | "next",
	id: string | undefined,
	current: ScreenTransitionState,
	previous?: ScreenTransitionState,
	next?: ScreenTransitionState,
) => {
	"worklet";
	if (!id) return SAFE_DIMENSIONS_FALLBACK;

	const fromCurrent = phase === "current" ? current.bounds?.[id] : undefined;
	if (fromCurrent) return fromCurrent;

	const fromPrev = phase === "previous" ? previous?.bounds?.[id] : undefined;
	if (fromPrev) return fromPrev;

	const fromNext = phase === "next" ? next?.bounds?.[id] : undefined;
	if (fromNext) return fromNext;

	return SAFE_DIMENSIONS_FALLBACK;
};
