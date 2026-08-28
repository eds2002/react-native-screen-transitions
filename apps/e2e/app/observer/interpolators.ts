import { interpolate } from "react-native-reanimated";
import type { ScreenStyleInterpolator } from "react-native-screen-transitions";

const probe = (progress: number) => {
	"worklet";
	return {
		style: {
			opacity: interpolate(progress, [0, 0.15, 1], [0.2, 1, 1], "clamp"),
			transform: [
				{
					translateX: interpolate(progress, [0, 1], [0, 114], "clamp"),
				},
				{
					scale: interpolate(progress, [0, 0.5, 1], [0.65, 1.2, 1]),
				},
			],
		},
	};
};

export const observerRootInterpolator: ScreenStyleInterpolator = ({
	current,
}) => {
	"worklet";
	return {
		"observer-layout-current": probe(current.progress),
	};
};

export const observerIndexInterpolator: ScreenStyleInterpolator = ({
	current,
}) => {
	"worklet";
	return {
		"observer-index-current": probe(current.progress),
	};
};

export const observerChildInterpolator: ScreenStyleInterpolator = ({
	current,
}) => {
	"worklet";
	return {
		"observer-child-current": probe(current.progress),
	};
};
