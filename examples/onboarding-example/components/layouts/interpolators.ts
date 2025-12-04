import { interpolate } from "react-native-reanimated";
import type { ScreenStyleInterpolator } from "react-native-screen-transitions";

export const horizontalSlide: ScreenStyleInterpolator = ({
	progress,
	current,
	layouts: { screen },
	bounds,
}) => {
	"worklet";
	const x = interpolate(progress, [0, 1, 2], [screen.width, 0, -screen.width]);
	return {
		contentStyle: {
			transform: [{ translateX: x }],
		},
		["SHARED"]: { ...sharedBounds, opacity },
	};
};
