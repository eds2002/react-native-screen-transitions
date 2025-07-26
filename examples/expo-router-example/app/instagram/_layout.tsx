import { Easing } from "react-native-reanimated";
import { opacity } from "react-native-reanimated/lib/typescript/Colors";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function InstagramLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{
					skipDefaultScreenOptions: true,
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="[id]"
				options={{
					headerShown: false,
					gestureEnabled: true,
					gestureDirection: ["vertical", "horizontal"],
					screenStyleInterpolator: ({
						previous,
						current,
						interpolate,
						isFocused,
						layouts: {
							screen: { width: screenWidth, height: screenHeight },
						},
					}) => {
						"worklet";

						const startBounds =
							previous?.allBounds?.[previous?.activeBoundId!].value;

						if (isFocused && startBounds) {
							// Calculate where the entire screen should start
							const startCenterX = startBounds.pageX + startBounds.width / 2;
							const startCenterY = startBounds.pageY + startBounds.height / 2;
							const screenCenterX = screenWidth / 2;
							const screenCenterY = screenHeight / 2;

							// Scale to match source size
							const initialScale = startBounds.width / screenWidth;

							// Translation to move from source center to screen center
							const translateX = interpolate(
								[0, 1],
								[startCenterX - screenCenterX, 0],
							);
							const translateY = interpolate(
								[0, 1],
								[startCenterY - screenCenterY + 38, 0],
							);
							const scale = interpolate([0, 1], [initialScale, 1]);

							return {
								contentStyle: {
									transform: [{ translateX }, { translateY }, { scale }],
									borderRadius: interpolate([0, 1], [12, 0]),
									overflow: "hidden",
								},
								overlayStyle: {
									backgroundColor: "#000",
									opacity: interpolate([0, 1], [0, 0.1]),
								},
							};
						}

						return {};
					},

					transitionSpec: {
						open: Transition.specs.DefaultSpec,
						close: Transition.specs.DefaultSpec,
					},
				}}
			/>
		</Stack>
	);
}
