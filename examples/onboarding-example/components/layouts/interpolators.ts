import { interpolate } from "react-native-reanimated";
import type { ScreenStyleInterpolator } from "react-native-screen-transitions";

export const horizontalSlide: ScreenStyleInterpolator = ({
	progress,
	layouts: { screen },
	bounds,
}) => {
	"worklet";
	const x = interpolate(progress, [0, 1, 2], [screen.width, 0, -screen.width]);
	const opacity = interpolate(progress, [0, 1, 2], [1, 1, 0]);
	const sharedBounds = bounds({ id: "SHARED" });

	return {
		contentStyle: {
			transform: [{ translateX: x }],
		},
		["SHARED"]: { ...sharedBounds, opacity },
	};
};

export const verticalSlide: ScreenStyleInterpolator = ({
	progress,
	layouts: { screen },
	bounds,
}) => {
	"worklet";
	const y = interpolate(
		progress,
		[0, 1, 2],
		[screen.height, 0, -screen.height],
	);
	const opacity = interpolate(progress, [0, 1, 2], [1, 1, 0]);
	const sharedBounds = bounds({ id: "SHARED" });

	return {
		contentStyle: {
			transform: [{ translateY: y }],
		},
		["SHARED"]: { ...sharedBounds, opacity },
	};
};
