import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";

export type Params = {
	start: MeasuredDimensions;
	end: MeasuredDimensions;

	dx: number;
	dy: number;
	scaleX: number;
	scaleY: number;

	gestureX: number;
	gestureY: number;

	entering: boolean;

	interp: (a: number, b: number) => number;
};

export function composeSizeAbsolute(params: Params): StyleProps {
	"worklet";
	const { start, end, entering, interp } = params;

	if (entering) {
		return {
			width: interp(start.width, end.width),
			height: interp(start.height, end.height),
			transform: [
				{ translateX: interp(start.pageX, end.pageX) },
				{ translateY: interp(start.pageY, end.pageY) },
			],
		} satisfies StyleProps;
	}

	return {
		width: interp(end.width, start.width),
		height: interp(end.height, start.height),
		transform: [
			{ translateX: interp(end.pageX, start.pageX) },
			{ translateY: interp(end.pageY, start.pageY) },
		],
	} satisfies StyleProps;
}

export function composeSizeRelative(params: Params): StyleProps {
	"worklet";
	const { start, end, dx, dy, entering, interp } = params;

	if (entering) {
		return {
			transform: [{ translateX: interp(dx, 0) }, { translateY: interp(dy, 0) }],
			width: interp(start.width, end.width),
			height: interp(start.height, end.height),
		} satisfies StyleProps;
	}

	return {
		transform: [{ translateX: interp(0, -dx) }, { translateY: interp(0, -dy) }],
		width: interp(end.width, start.width),
		height: interp(end.height, start.height),
	} satisfies StyleProps;
}

export function composeTransformAbsolute(params: Params): StyleProps {
	"worklet";
	const { start, end, scaleX, scaleY, entering, interp } = params;

	if (entering) {
		return {
			transform: [
				{ translateX: interp(start.pageX, end.pageX) },
				{ translateY: interp(start.pageY, end.pageY) },
				{ scaleX: interp(scaleX, 1) },
				{ scaleY: interp(scaleY, 1) },
			],
		} satisfies StyleProps;
	}

	return {
		transform: [
			{ translateX: interp(end.pageX, start.pageX) },
			{ translateY: interp(end.pageY, start.pageY) },
			{ scaleX: interp(1, 1 / scaleX) },
			{ scaleY: interp(1, 1 / scaleY) },
		],
	} satisfies StyleProps;
}

export function composeTransformRelative(params: Params): StyleProps {
	"worklet";
	const { dx, dy, scaleX, scaleY, gestureX, gestureY, entering, interp } =
		params;

	if (entering) {
		return {
			transform: [
				{ translateX: gestureX },
				{ translateY: gestureY },
				{ translateX: interp(dx, 0) },
				{ translateY: interp(dy, 0) },
				{ scaleX: interp(scaleX, 1) },
				{ scaleY: interp(scaleY, 1) },
			],
		} satisfies StyleProps;
	}

	return {
		transform: [
			{ translateX: gestureX },
			{ translateY: gestureY },
			{ translateX: interp(0, -dx) },
			{ translateY: interp(0, -dy) },
			{ scaleX: interp(1, 1 / scaleX) },
			{ scaleY: interp(1, 1 / scaleY) },
		],
	} satisfies StyleProps;
}
